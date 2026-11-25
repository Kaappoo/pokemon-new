# better-auth hardening: what 1.7.7 gives us

Research for issue #11: "What does our better-auth version offer for rate limits, verification, breached passwords and deletion?"

**Version.** `better-auth@1.7.7`, with `@better-auth/core@1.7.7` and `@better-auth/drizzle-adapter@1.7.7` (`pnpm-lock.yaml`; `package.json` asks for `^1.7.7`). `node_modules` was not installed, so I read the published npm tarballs for exactly these versions (`npm pack better-auth@1.7.7 @better-auth/core@1.7.7 @better-auth/drizzle-adapter@1.7.7`). The citations below are paths inside those packages: `ba:` means `better-auth/dist/`, `core:` means `@better-auth/core/dist/`, and `drz:` means `@better-auth/drizzle-adapter/dist/`. Vercel's behaviour comes from <https://vercel.com/docs/headers/request-headers>.

Current config: `src/server/auth.ts` (email+password with `autoSignIn`, min length 8, bcrypt/scrypt hashing; `username` and `magicLink` plugins; `cookieCache` set to 5 min).

---

## TL;DR

| Topic | Built in? | What we need to do |
|---|---|---|
| Rate limiting | Yes, **on only when `NODE_ENV=production`**. By default it lives **in memory**, which does nothing on Vercel serverless. | `rateLimit: { storage: 'database' }` plus a new `rate_limit` table (additive migration). Read the IP from `x-vercel-forwarded-for`. |
| Email verification | Yes. `requireEmailVerification` blocks password and username sign-in for unverified users. | **Every existing password user is `email_verified = false`**, legacy accounts included. Turning it on locks them out of password sign-in until they click a link. Needs a rollout plan (see §2). |
| Breached passwords | `haveIBeenPwned` plugin: k-anonymity, SHA-1 prefix of 5 characters, one external call to `api.pwnedpasswords.com`. | Add the plugin. It fails closed (500) if HIBP is down. |
| Password length | min 8 (ours), **max 128** by default | Nothing to do. bcrypt legacy hashes only use the first 72 bytes. |
| Account deletion | `user.deleteUser`, using a password, a fresh session (<24 h) or an email link. Has `beforeDelete`/`afterDelete` hooks. | Enable it with `sendDeleteAccountVerification` (magic-link users have no password). Our FKs already cascade the binder data. |
| Data export | **None** | Write our own. |
| Expired-row cleanup | Verification rows: yes, opportunistically. Sessions: **no**, only when the expired token itself comes back. Rate-limit rows: pruned on window reset. | A cron job that deletes expired `session` rows. |
| Cookies / CSRF | `__Secure-` prefix, `Secure`, `HttpOnly`, `SameSite=Lax` when `baseURL` is https. Origin check runs on every cookie-bearing POST. | Nothing, as long as `BETTER_AUTH_URL` is https. |
| cookieCache vs revocation | **Yes, a delay**: a revoked or deleted session stays valid for up to 5 min on *other* devices. | Bypass the cache for sensitive server fns, or accept the 5 min window. |

---

## 1. Rate limiting

### Defaults (`ba:context/create-context.mjs` L170–176)

```js
enabled: options.rateLimit?.enabled ?? isProduction,   // isProduction = NODE_ENV === "production" (core:env/env-impl.mjs L32)
window:  options.rateLimit?.window || 10,              // seconds
max:     options.rateLimit?.max || 100,
storage: options.rateLimit?.storage || (options.secondaryStorage ? "secondary-storage" : "memory")
```

Built-in special rules (`ba:api/rate-limiter/index.mjs` `getDefaultSpecialRules`, L305–318):

- `/sign-in*`, `/sign-up*`, `/change-password*`, `/change-email*`: **3 requests / 10 s**. This also covers `/sign-in/username` and `/sign-in/email`.
- `/request-password-reset`, `/send-verification-email`, `/forget-password*`: **3 / 60 s**.
- The magic-link plugin adds `/sign-in/magic-link` and `/magic-link/verify`: **5 / 60 s**, configurable with `magicLink({ rateLimit })` (`ba:plugins/magic-link/index.mjs` L216–222). Plugin rules override the special rules (resolution order: default, then special, then plugin, then `customRules`; L249–279).
- Everything else falls back to the global 100 / 10 s.

The key is `${ip}|${path}` (`core:utils/ip.mjs` L228). Exceeding the limit returns **429** with a JSON message and an `X-Retry-After` header (L64–73). The limiter only runs inside the HTTP router (`ba:api/index.mjs` L172). Direct `auth.api.*` calls from our server code skip it. All our sign-in, sign-up and magic-link calls go through `/api/auth/*` (`src/lib/auth-client.ts`), so they are covered.

### Memory storage is useless on Vercel

The memory store is a module-level `Map` (L6). Each serverless instance has its own copy, and a cold start resets it, so an attacker spread across instances is barely limited. Use the database store instead.

### `storage: 'database'`: yes, it needs a table

`core:db/get-tables.mjs` L33–56 adds a `rateLimit` model only when `storage === "database"`:

| field | type | notes |
|---|---|---|
| `key` | string | **unique**, required |
| `count` | number | required |
| `lastRequest` | number, **bigint** | ms epoch |

The adapter factory also generates an `id` for every model it creates (`core:db/adapter/factory.mjs` L107), so the table needs a text primary key too. The DB store uses `findMany`, `create`, `incrementOne` (native in the Drizzle adapter, `drz:index.mjs` L498) and `deleteMany`. Each window reset prunes rows older than the longest configured window (L174–184), so the table cleans up after itself. Cost: one or two Neon round-trips per `/api/auth/*` request.

Schema to add to `src/server/db/schema.ts` (the export name must be `rateLimit`, because the Drizzle adapter looks models up by name):

```ts
export const rateLimit = pgTable('rate_limit', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  count: integer('count').notNull(),
  lastRequest: bigint('last_request', { mode: 'number' }).notNull(),
})
```

Then run `pnpm db:generate`. The migration only creates a new table, so it is safe next to the Go-era tables (ADR 0004).

### Custom per-path rules

`rateLimit.customRules` maps a path (relative to `/api/auth`, `*` wildcards allowed) to `{ window, max }`, `false` (disable), or `(request, currentRule) => rule | false` (`ba:api/rate-limiter/index.mjs` L262–279; type in `core:types/init-options.d.mts` L197+).

### Client IP behind Vercel

`getIP` (`core:utils/ip.mjs` L203–219) reads `advanced.ipAddress.ipAddressHeaders`, which defaults to `['x-forwarded-for']`. Without `trustedProxies` it **only accepts a single-IP header value**. A comma list is rejected as spoofable (L190). In production, if no IP resolves, the limiter warns once and **every client shares one bucket per path** (`NO_TRUSTED_IP_KEY`, L236–248). With sign-in at 3 per 10 s, that would mean a global lockout.

Vercel: `x-forwarded-for` holds "the public IP address of the client", and Vercel "overwrite[s] the X-Forwarded-For header and do[es] not forward external IPs … to prevent IP spoofing". `x-vercel-forwarded-for` is identical, but stays correct if another proxy ever sits in front, and `x-real-ip` is identical too. So the header holds one trusted value and we need no `trustedProxies`. IPv6 addresses are bucketed by /64 by default (`ipv6Subnet`, L105).

```ts
advanced: {
  ipAddress: { ipAddressHeaders: ['x-vercel-forwarded-for', 'x-forwarded-for'] },
},
```

In dev and test the IP falls back to `127.0.0.1` (L217).

### Config

```ts
rateLimit: {
  storage: 'database',
  // enabled defaults to NODE_ENV === 'production'; leave it so tests/dev aren't throttled
  customRules: {
    '/sign-up/email': { window: 60, max: 5 },   // optional: tighten account creation
  },
},
```

---

## 2. Email verification (`requireEmailVerification`)

### What it does in 1.7.7

- **Sign-up** (`ba:api/routes/sign-up.mjs` L155–262). With `requireEmailVerification`, sign-up **skips auto sign-in** whatever `autoSignIn` says, and returns `{ token: null, user }`. A duplicate email gets a **generic synthetic success** (the password is still hashed, so timing doesn't reveal the duplicate) instead of `USER_ALREADY_EXISTS`. A verification email is sent if `emailVerification.sendOnSignUp ?? requireEmailVerification`.
- **Email sign-in** (`ba:api/routes/sign-in.mjs` L339–352) and **username sign-in** (`ba:plugins/username/index.mjs` L197–208). An unverified user who enters the *correct* password gets `403 EMAIL_NOT_VERIFIED`. If `emailVerification.sendOnSignIn` is true, a fresh link is emailed first. Without `sendVerificationEmail` configured they simply get 403.
- **Magic link** (`ba:plugins/magic-link/index.mjs` L170–212) creates new users with `emailVerified: true`. ⚠️ When it signs in an *existing unverified* user it calls `revokeUnprovenAccountAccess` (`ba:db/revoke-unproven-account-access.mjs`). That **deletes every `account` row (including the password credential) and every session** of that user, then sets `emailVerified = true`. This happens **today, whether or not `requireEmailVerification` is set**. An existing password user who once uses a magic link loses their password and must reset it to get it back.
- **Password reset** does *not* mark the email verified (`ba:api/routes/password.mjs`). A user who resets is still blocked by `requireEmailVerification`.

### Effect on existing users

`drizzle/0001_adopt_legacy_accounts.sql` inserts every Go-era user with `email_verified = false`. Every password sign-up since then is also `false` (`sign-up.mjs` L222). Turning on `requireEmailVerification` with no other change therefore **blocks password sign-in for every current password user**. They recover by clicking the emailed link (with `sendOnSignIn: true`) or by using a magic link, which as noted above drops their password.

Options:
1. Ship `sendOnSignIn: true` together with UI copy on the 403 ("we've sent you a verification link"). That is the minimum.
2. Grandfather the legacy accounts with a one-off migration `UPDATE "user" SET email_verified = true WHERE id LIKE 'legacy-%'`. That is a product decision: those emails were never proven.

### Resend flow

`POST /api/auth/send-verification-email` with `{ email, callbackURL? }` (`ba:api/routes/email-verification.mjs` L38–124). Without a session it is enumeration-safe: a 500 ms constant-time floor, and it only sends if the user exists and is unverified. With a session the email must match the session's. It is rate-limited to 3 per 60 s by the special rule. The client exposes it as `authClient.sendVerificationEmail`. `GET /verify-email?token=…` sets `emailVerified` and runs `before/afterEmailVerification`. It signs the user in if `autoSignInAfterVerification`. The token is a JWT signed with the secret, valid for `emailVerification.expiresIn`, default 3600 s (L14).

### Config

```ts
emailAndPassword: { /* … */ requireEmailVerification: true },
emailVerification: {
  sendOnSignUp: true,
  sendOnSignIn: true,
  autoSignInAfterVerification: true,
  expiresIn: 60 * 60 * 24,
  sendVerificationEmail: async ({ user, url }) => send(verifyEmailEmail(user.email, url)),
},
```

It also needs a new `verifyEmailEmail` template in `src/server/email/templates.ts`, `sendVerificationEmail` exported from `src/lib/auth-client.ts`, and changes to `src/routes/sign-up.tsx`. That page currently calls `refreshSession` and navigates as if signed in, so it must handle `token: null` with a "check your inbox" state. `src/routes/sign-in.tsx` must handle the `EMAIL_NOT_VERIFIED` code.

---

## 3. Breached passwords: `haveIBeenPwned`

`ba:plugins/haveibeenpwned/index.mjs`:

- **k-anonymity**: the plugin computes the SHA-1 of the password, sends only the first 5 hex characters to `https://api.pwnedpasswords.com/range/{prefix}` with `Add-Padding: true`, and compares the suffixes locally. The password and the full hash never leave the server. This is one external HTTPS call per checked request. It needs no API key.
- It wraps `ctx.password.hash`, which is our custom `hashPassword`, so the check composes with our bcrypt/scrypt setup. It only checks on these paths: `/sign-up/email`, `/change-password`, `/reset-password` (plus email-otp, phone and admin paths we don't use). `paths` can override that list. Sign-in is **not** checked.
- **Fails closed**: if the HIBP call errors, the endpoint throws `500` "Failed to check password". It returns `400 PASSWORD_COMPROMISED` (custom message via `customPasswordCompromisedMessage`) when the password is in the corpus.
- `enabled: false` turns it off. Use that in tests and e2e so they don't hit the network, or mock it with MSW.

```ts
import { haveIBeenPwned } from 'better-auth/plugins'
plugins: [ /* … */ haveIBeenPwned({ enabled: process.env.NODE_ENV === 'production' }) ]
```

**Length limits** (`ba:context/create-context.mjs` L186–187; enforced in `ba:utils/password.mjs`): `minPasswordLength` defaults to 8 (we set 8) and `maxPasswordLength` defaults to **128** characters. The max is checked on sign-up, sign-in, delete-user and so on. Legacy bcrypt hashes (`src/server/password.ts`) only consider the first 72 bytes. That is harmless, and new hashes are scrypt.

---

## 4. Account deletion and data export

`POST /api/auth/delete-user` (`ba:api/routes/update-user.mjs` L219–336) returns **404 unless `user.deleteUser.enabled`**. It runs `sensitiveSessionMiddleware`, which re-reads the session from the DB and **bypasses cookieCache** (`ba:api/routes/session.mjs` L284–311). There are three ways to verify:

1. **`password`** in the body is checked against the credential account. Magic-link-only users have none, so this fails with `CREDENTIAL_ACCOUNT_NOT_FOUND`.
2. **`sendDeleteAccountVerification`** configured: the endpoint stores a `delete-account-<token>` verification row (valid for `deleteTokenExpiresIn`, default 24 h) and emails a link to `GET /delete-user/callback?token=…`. The callback requires the same signed-in user and **consumes** the token. If this option is set, it takes precedence over freshness.
3. Otherwise, **session freshness**: the session must be younger than `session.freshAge`, default 86 400 s (create-context L149), or the endpoint returns `SESSION_EXPIRED`.

Then `beforeDelete(user, request)` runs (throw to abort), followed by `internalAdapter.deleteUser`. That deletes sessions, accounts and the user row (`ba:db/internal-adapter.mjs` L232–246), then deletes the user's sessions, clears the cookie and runs `afterDelete`. **Cascades:** better-auth deletes `session`, `account` and `user` explicitly. Our `wishlist_items` and `collection_items` have `ON DELETE CASCADE` on `user_id` (`drizzle/0000_init.sql` L122, L138), so binder data goes with the user. Leftover `verification` rows (magic-link tokens keyed by email) expire on their own.

**Data export: nothing built in.** No core endpoint or plugin exists in 1.7.7. We would add a `ProfileService.export` that dumps user, wishlist and collection rows.

```ts
user: {
  additionalFields: { /* … */ },
  deleteUser: {
    enabled: true,
    sendDeleteAccountVerification: async ({ user, url }) => send(deleteAccountEmail(user.email, url)),
    // beforeDelete: async (user) => { /* e.g. log / refuse */ },
  },
},
```

`deleteAccountEmail` is a new template. Expose it in the client as `authClient.deleteUser({ callbackURL: '/' })`.

---

## 5. Expired session, verification and rate-limit rows

- **verification**: built in. Every `findVerificationValue` deletes *all* rows with `expiresAt < now` unless `verification.disableCleanup` is set (`ba:db/internal-adapter.mjs` L753–757). Magic links, resets and deletion tokens all read through this path, so the table stays small.
- **session**: **not built in.** An expired session is deleted only when its own token is presented to `getSession` (`ba:api/routes/session.mjs` L155–162). Sessions on abandoned browsers stay forever. Default `expiresIn` is 7 days and `updateAge` 1 day. **Ours**: a Vercel Cron (or a step in `pnpm sync`) running `DELETE FROM session WHERE expires_at < now()`, wrapped as an Effect service method.
- **rateLimit**: pruned by the DB store itself (§1).

---

## 6. Cookies, CSRF and cookieCache

### Cookie attributes (`ba:cookies/index.mjs` L20–43)

The `__Secure-` prefix and `secure: true` apply when `advanced.useSecureCookies` is true, or else when `baseURL` starts with `https://` (falling back to `NODE_ENV === 'production'` if no baseURL). Defaults: `sameSite: 'lax'`, `path: '/'`, `httpOnly: true`, and no `Domain` unless `crossSubDomainCookies` is set. Cookie names: `__Secure-better-auth.session_token`, `.session_data` (the cache) and `.dont_remember`. **Nothing to change** as long as `BETTER_AUTH_URL`/`APP_URL` is `https://…` in production. To be explicit regardless of env, set `advanced: { useSecureCookies: process.env.NODE_ENV === 'production' }`.

### CSRF and origin checking (`ba:api/middlewares/origin-check.mjs`)

- `originCheckMiddleware` runs on every non-GET request. When the request carries cookies, `Origin` (or `Referer`) must match `trustedOrigins` (`baseURL` plus our list), otherwise **403 INVALID_ORIGIN**. A missing or `null` origin is rejected. `callbackURL`, `redirectTo`, `errorCallbackURL` and `newUserCallbackURL` must also be trusted origins or relative paths.
- First-login requests carry no cookie. For those, `formCsrfMiddleware` uses Fetch Metadata: it blocks `Sec-Fetch-Site: cross-site` + `Sec-Fetch-Mode: navigate`, and otherwise forces the origin check.
- This is on by default. `disableCSRFCheck` and `disableOriginCheck` must stay unset. Our `trustedOrigins` (APP_URL and Vercel URLs) is already right.

### Does cookieCache delay revocation? Yes

When `cookieCache.enabled`, `getSession` trusts the signed `session_data` cookie until it expires (`maxAge`, 5 min). It only checks that the cookie's token matches the session cookie and the optional `version` (`ba:api/routes/session.mjs` L39–90). It doesn't touch the DB. Consequences:

- **Delete account / revoke other sessions / password reset with revoke**: the acting browser's cookies are cleared immediately. **Other devices keep a valid-looking session for up to 5 min**, because `src/server/effect/run.ts` calls `auth.api.getSession` with the cache on. For a deleted user, binder writes then fail on the FK (the user row is gone). Reads still return the stale user from the cache.
- better-auth's own sensitive endpoints (delete-user, change-password and others using `sensitiveSessionMiddleware`) always bypass the cache.
- Mitigations, in order of cost: (a) accept the 5 min window; (b) for mutating server fns, call `auth.api.getSession({ headers, query: { disableCookieCache: true } })` in `run.ts`; (c) lower `maxAge`. `cookieCache.version` can't help here, because it is a global or per-session value, not a revocation list.

---

## Combined config sketch (`src/server/auth.ts`)

```ts
export const auth = betterAuth({
  // …existing baseURL, trustedOrigins, secret, database…
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,              // ignored for sign-up once requireEmailVerification is on
    minPasswordLength: 8,
    requireEmailVerification: true, // ⚠ see §2 rollout
    password: { hash: hashPassword, verify: verifyPassword },
    sendResetPassword: async ({ user, url }) => send(resetPasswordEmail(user.email, url)),
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => send(verifyEmailEmail(user.email, url)),
  },
  user: {
    additionalFields: { /* unchanged */ },
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({ user, url }) => send(deleteAccountEmail(user.email, url)),
    },
  },
  session: { cookieCache: { enabled: true, maxAge: 5 * 60 } },
  rateLimit: { storage: 'database' },
  advanced: {
    ipAddress: { ipAddressHeaders: ['x-vercel-forwarded-for', 'x-forwarded-for'] },
  },
  plugins: [
    username({ minUsernameLength: 3, maxUsernameLength: 24 }),
    magicLink({ sendMagicLink: async ({ email, url }) => send(magicLinkEmail(email, url)) }),
    haveIBeenPwned({ enabled: process.env.NODE_ENV === 'production' }),
    tanstackStartCookies(), // keep last
  ],
})
```

Plus: the `rate_limit` table and migration, two email templates, sign-up and sign-in UI states for verification, a session-cleanup cron, and our own data export.
