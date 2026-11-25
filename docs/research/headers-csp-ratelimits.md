# Headers, CSP and rate limits for TanStack Start on Vercel

Research for issue #12. Researched 2026-11-25 against the versions pinned in `pnpm-lock.yaml`:

| Package | Version |
| --- | --- |
| `@tanstack/react-start` | 1.168.60 |
| `@tanstack/react-router` | 1.170.41 |
| `@tanstack/router-core` | 1.171.34 |
| `@tanstack/start-server-core` | 1.169.39 |
| `@tanstack/start-client-core` | 1.170.34 |
| `nitro` | 3.0.260903-beta (latest is now `3.0.261103-rc`) |
| `serwist` | 9.5.13 |

There was no `node_modules` in the checkout. I read the published tarballs for those exact versions from the npm registry (`src/` ships in each TanStack package, and Nitro ships its docs under `dist/docs/`). Paths below such as `router-core/src/...` point into those tarballs.

**Decisions this assumes (from the owner):** preview deployments are turned off, and migrations run only on production.

---

## TL;DR

1. **Use two layers for headers.** No single mechanism covers everything:
   - **Start global request middleware** (`src/start.ts`). It covers SSR pages, server functions and every `routes/api/*` handler. The CSP lives here, because a nonce must be generated per request.
   - **`vercel.json` `headers`**. It covers static files (`/assets/*`, `/sw.js`, icons, the manifest). Vercel serves these from the CDN without invoking the function.
   - Nitro `routeRules.headers` also works, but read the caveat in §1.3 before using it.
2. **Adding `src/start.ts` turns off Start's automatic CSRF protection for server functions.** You must add `createCsrfMiddleware({ filter: ctx => ctx.handlerType === 'serverFn' })` yourself (§1.2).
3. **Start emits inline scripts, and the installed version supports nonces.** It inlines the dehydrated router/query state, a hydration boundary script, the scroll-restoration script (`scrollRestoration: true` is set in `src/router.tsx`) and React's streaming scripts. Setting `ssr: { nonce }` on the router stamps the nonce on all of them and also emits `<meta property="csp-nonce">`. So a strict `'nonce-…' 'strict-dynamic'` CSP is feasible. Inline `style` attributes still need `style-src 'unsafe-inline'`.
4. **Rate limiting:** Vercel WAF rate limiting is available on **all plans**, but **Hobby allows 1 rate-limit rule per project** (within 3 custom rules total) and Pro allows 40. Both use fixed windows of 10 s to 10 min, keyed by IP or JA4. The WAF runs before the deployment serves the request, so it also limits cache hits. `@vercel/firewall`'s `checkRateLimit` works from any function for finer, per-route keys.
5. **CDN abuse surface:** for function responses, the cache key includes the **full query string** and the **deployment URL**, and it can't be configured. Adding a junk param (`?x=random`) therefore bypasses the cache on `/api/cards/search` and, worse, on `/api/og/*`, where every miss is a satori+sharp render. Every deploy also starts with a cold cache. Possible fixes: canonicalise (redirect any request with unexpected params), cache 404s, and put the single Hobby rate-limit rule on `/api/og/`.
6. **Previews off:** set `"git": { "deploymentEnabled": { "**": false, "main": true } }` (minimatch), or pick **Ignored Build Step → "Only build production"**. Gate migrations on `VERCEL_ENV === 'production'` inside `scripts/migrate.ts`. Note that Instant Rollback does **not** rebuild, so it won't roll back the schema. Migrations must stay backward compatible (this already matches ADR 0004).

---

## 1. Ways to set response headers

### 1.1 What reaches what on Vercel

The Nitro `vercel` preset writes a Build Output API `config.json`:

- Static assets get a `{ "handle": "filesystem" }` phase.
- Everything else falls through to a catch-all `{ src: "/(.*)", dest: "/__server" }`.

Source: `nitro/dist/_presets.mjs`, `generateBuildConfig`, which uses `FALLBACK_ROUTE = "/__server"`.

So:

| Response | Served by | Start middleware | `vercel.json` headers | Nitro `routeRules.headers` |
| --- | --- | --- | --- | --- |
| SSR HTML pages | `/__server` function | yes | yes | yes |
| Server functions (`/_serverFn/*`) | function | yes (`handlerType: 'serverFn'`) | yes | yes |
| `routes/api/*` server routes (search, lookup, og, auth) | function | yes (`handlerType: 'router'`) | yes | yes |
| Hashed client assets `/assets/*`, `/sw.js`, `/icons/*`, `/manifest.webmanifest`, `/favicon.svg` | CDN, filesystem | **no** | yes | yes (as CDN route) |

The middleware row comes from the docs: global request middleware runs "before every request, including server routes, SSR and server functions" ([Start middleware guide](https://tanstack.com/start/latest/docs/framework/react/guide/middleware)). The source agrees. In `start-server-core/src/createStartHandler.ts`, `executeMiddleware(flattenedRequestMiddlewares…, terminal)` wraps both the server-function branch and `handleServerRoutes` (the router plus server-route branch). Static files never reach the function.

**Precedence for `Cache-Control`:** "if you return `Cache-Control` headers in a Vercel Function, it will override the headers defined for the same route in `vercel.json`" ([Vercel CDN cache](https://vercel.com/docs/caching/cdn-cache#how-to-cache-responses)).

### 1.2 Start global request middleware (recommended for dynamic responses)

`src/start.ts` doesn't exist today. Start therefore falls back to a built-in CSRF middleware for server-function requests only:

```ts
// start-server-core/src/createStartHandler.ts
requestMiddleware: startInstance
  ? startOptions.requestMiddleware
  : isServerFnRequest ? [defaultCsrfMiddleware] : undefined,
```

**As soon as `src/start.ts` exists, that default disappears.** The docs say: "If you define a custom `src/start.ts`, add it yourself, filtered to server functions" ([middleware guide → CSRF](https://tanstack.com/start/latest/docs/framework/react/guide/middleware)). In dev, Start prints a warning if it's missing (`warnMissingCsrfMiddlewareOnce`).

Keep the filter on `handlerType === 'serverFn'`. An unfiltered CSRF middleware would reject `POST /api/cards/lookup` from tcgRank, because the middleware "rejects requests it cannot prove same-origin".

A request middleware receives `{ request, pathname, context, next, handlerType }`. `next({ context })` returns `{ response, … }`, and the middleware may return that result or a `Response` (`start-client-core/src/createMiddleware.ts`, `RequestServerOptions` / `RequestServerResult`). Context passed to `next` is readable during SSR through `getGlobalStartContext()`. That function reads `getStartContext().contextAfterGlobalMiddlewares` and returns `undefined` on the client (`start-client-core/src/getGlobalStartContext.ts`). The router is created lazily inside that terminal (`getRouter()` in `createStartHandler.ts`), so `src/router.tsx` can read the nonce.

Candidate code (not applied):

```ts
// src/start.ts
import { createCsrfMiddleware, createMiddleware, createStart } from '@tanstack/react-start'
import { contentSecurityPolicy, securityHeaders } from '#/server/security-headers.ts'

const csrf = createCsrfMiddleware({ filter: (ctx) => ctx.handlerType === 'serverFn' })

const headers = createMiddleware().server(async ({ next, handlerType }) => {
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))))
  const result = await next({ context: { nonce } })
  const h = result.response.headers
  for (const [k, v] of Object.entries(securityHeaders)) if (!h.has(k)) h.set(k, v)
  // Only HTML documents need a CSP; skip in dev (Vite injects its own inline preamble).
  if (import.meta.env.PROD && handlerType === 'router' && h.get('content-type')?.startsWith('text/html')) {
    h.set('content-security-policy-report-only', contentSecurityPolicy(nonce)) // flip to enforcing after a soak
  }
  return result
})

export const startInstance = createStart(() => ({ requestMiddleware: [csrf, headers] }))
```

```ts
// src/router.tsx: add to createTanStackRouter({...})
import { getGlobalStartContext } from '@tanstack/react-start'
// …
ssr: { nonce: getGlobalStartContext()?.nonce },
```

Caveat: if a handler ever returns a `Response` with immutable headers (for example, a proxied `fetch()` response), `headers.set` throws. Wrap it with `new Response(res.body, res)` in that case. Every handler in the repo today builds its own `Response`, so their headers are mutable.

### 1.3 Nitro `routeRules.headers`

You can pass `routeRules` to `nitro({...})` in `vite.config.ts`. On the Vercel preset they're compiled into CDN routes in `config.json`:

```js
// nitro/dist/_presets.mjs (generateBuildConfig)
...rules.filter(([path, r]) => (r.redirect || r.headers) && !cdnProxyPaths.has(path)).map(([path, r]) => {
  let route = { src: path.replace("/**", "/(.*)") };
  if (r.headers) route = defu(route, { headers: r.headers });
  return route;
}),
```

So route rules reach static files too. **Caveat:** these generated routes have no `continue: true`. The Build Output API defines `continue` as "If true, routing will continue even when the src is matched" ([BOA configuration → routes](https://vercel.com/docs/build-output-api/configuration#routes)). I couldn't confirm from primary sources how Vercel treats a header-only route without `continue` that is followed by the `/__server` catch-all. A `"/**"` rule might stop routing before the function fallback. If you go this way, run `vercel build` locally and inspect `.vercel/output/config.json` before shipping. **Recommendation:** don't use route rules for headers here. Use middleware plus `vercel.json`.

Nitro also documents how it sets `Cache-Control` on Vercel for public asset directories with a non-root `baseURL`: one year `immutable` by default, overridable with a `cache-control` route rule ([Nitro Vercel provider → Public asset caching](https://nitro.build/deploy/providers/vercel), also shipped as `nitro/dist/docs/1.deploy/2.providers/21.vercel.md`).

### 1.4 `vercel.json` `headers` (recommended for static files)

`headers: [{ source, headers: [{key, value}], has?, missing? }]` "configures custom response headers for static files, Vercel functions, and a wildcard that matches all routes" ([vercel.json → headers](https://vercel.com/docs/project-configuration/vercel-json#headers)).

When the framework writes `.vercel/output` itself, the Vercel CLI's build merges the user's `vercel.json` routes with the builder's routes. In `vercel/vercel` `internals/cli-builder-integration/src/do-build.ts`, `mergeRoutes({ userRoutes: routesResult.routes, builds: builderRoutes })`. `packages/routing-utils/src/merge.ts` places user routes after the builder's `continue` routes and before its other routes. Headers from `vercel.json` should therefore apply on top of Nitro's output. This comes from reading the CLI source, not from a doc statement, so verify it once with `vercel build` (or `curl -I` after the next production deploy).

Candidate `vercel.json` (not created):

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "git": { "deploymentEnabled": { "**": false, "main": true } },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), payment=()" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" }
      ]
    },
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" },
        { "key": "Service-Worker-Allowed", "value": "/" }
      ]
    }
  ]
}
```

Notes:

- Confirm that `main` is the production branch in Vercel → Settings → Environments before you copy the `git` block.
- `X-Frame-Options` is unnecessary once the CSP has `frame-ancestors 'none'`.
- Leave HSTS `preload` off unless you intend to submit the domain to the preload list.

---

## 2. CSP with SSR

### 2.1 What Start puts inline (installed version)

| Inline script | Source | Gets nonce? |
| --- | --- | --- |
| Dehydrated router state and TanStack Query data (`setupRouterSsrQueryIntegration`) streamed as `<script>` chunks, plus a cleanup suffix | `router-core/src/ssr/hydrationScripts.ts`, `createInitialTags` → `attrs: { nonce, … }`; streamed parts use `` `<script nonce="${escapeAttribute(this.nonce)}">` `` | yes |
| Hydration boundary script | same file, `boundary: { tag: 'script', attrs: { nonce } }` | yes |
| Client entry and route `scripts` (module script tags) | `router-core/src/ssr/bodyScripts.ts` → `attrs: { ...asset.attrs, nonce }` | yes |
| Scroll restoration (`scrollRestoration: true` in `src/router.tsx`) | `react-router/src/scroll-restoration.tsx` → `<ScriptOnce>` → `<script nonce={router.options.ssr?.nonce}>` | yes |
| React streaming / Suspense scripts | `react-router/src/ssr/renderRouterToStream.tsx` passes `nonce: router.options.ssr?.nonce` to React's stream renderer | yes |
| `<HeadContent>` meta/link/script/style tags | `react-router/src/HeadContent.tsx`, `headContentUtils.tsx` (passes `nonce` and adds `<meta property="csp-nonce" content=…>`) | yes |

The option is declared as `ssr?: { nonce?: string }` on router options (`router-core/src/router.ts`). The official docs say nothing about it. The middleware guide only lists CSP as a use case, with no nonce guidance. A community thread ([TanStack/router discussion #3028](https://github.com/TanStack/router/discussions/3028)) predates the feature. So the source is the authority here, and it's complete for the installed version.

**Consequences:**

- `script-src 'nonce-…' 'strict-dynamic'` works. `'strict-dynamic'` lets the nonce-carrying entry script load code-split chunks with `import()`.
- SSR HTML must stay uncacheable at the CDN. Two users must never share a nonce, and pages don't set `s-maxage` today. The service worker's `NetworkFirst` `pages` cache stores the HTML together with its own CSP header, so offline replays stay self-consistent.
- Inline **style attributes** are produced by React `style={…}` props and by Base UI positioning. A nonce can't cover them, so use `style-src 'self' 'unsafe-inline'`. Don't add a nonce to `style-src`: a nonce disables `'unsafe-inline'`.
- Dev mode (Vite's React-refresh preamble, devtools) isn't nonce-aware. Emit the CSP only when `import.meta.env.PROD`.

### 2.2 What each feature needs

- **Card art (`assets.tcgdex.net`)** is loaded as `<img>` → `img-src https://assets.tcgdex.net`. The `preconnect` link is fine.
- **Profile avatars:** `profileInput.image` accepts **any** `https://` URL (`src/shared/schemas.ts`), rendered by `<Avatar src={user.image}>`. You can either allow `img-src https:` (simplest) or restrict avatars to an allow-list or proxy. A strict `img-src` would break existing avatars.
- **Fonts** are self-hosted through `@fontsource-variable/archivo` in `app.css` → `font-src 'self'`.
- **Service worker:**
  - The page needs `worker-src 'self'` to register `/sw.js`.
  - The worker itself is governed by **the CSP on the `sw.js` response**, not the page's: "If serviceWorker's script resource was delivered with a Content-Security-Policy HTTP header containing the value policy, the user agent must enforce policy for serviceWorker" ([Service Workers spec §6.2](https://w3c.github.io/ServiceWorker/#content-security-policy)).
  - `src/sw.ts` `fetch`es `assets.tcgdex.net` (CacheFirst `card-images`), so if `/sw.js` ever gets a CSP, its `connect-src` must include `https://assets.tcgdex.net`. The simplest option is to send no CSP on `/sw.js`; the `vercel.json` above doesn't. Within the page, requests the worker intercepts are still checked against the page's `img-src` and similar directives first.
- **OG images (`/api/og/*`)** are `image/png` responses fetched by crawlers, so CSP doesn't apply to them. The middleware above only sets the CSP on `text/html`. satori+sharp fetch the card PNG server-side, which no CSP governs. `nosniff` is worth keeping on them.
- **better-auth / magic link:** same-origin `/api/auth/*`, so `connect-src 'self'` and `form-action 'self'` are enough.

### 2.3 Candidate policy

```ts
// src/server/security-headers.ts (candidate)
export const contentSecurityPolicy = (nonce: string) =>
  [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://assets.tcgdex.net https:", // drop bare https: if avatars get restricted
    "font-src 'self'",
    "connect-src 'self'",
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ')

export const securityHeaders = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
} as const
```

Ship it as `Content-Security-Policy-Report-Only` first. Run the Playwright e2e suite and check the browser console for violations, then switch to enforcing.

---

## 3. Vercel: Firewall, rate limits, previews, migrations

### 3.1 WAF rate limiting

From [WAF Rate Limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting): "WAF Rate Limiting is available on all plans".

| | Hobby | Pro |
| --- | --- | --- |
| Keys | IP, JA4 digest | IP, JA4 digest (User-Agent and Header keys only for Priority projects) |
| Algorithm | Fixed window | Fixed window (Token bucket is Enterprise only) |
| Window | 10 s to 10 min | 10 s to 10 min |
| Rules | **1 per project** (within 3 custom rules total) | 40 per project |
| Included requests | 1,000,000 allowed requests | usage-based, regional pricing |

- Actions are 429 (default), Log, Deny (403) and Challenge.
- Counters are tracked per region.
- Rules are configured in the dashboard (Firewall → Configure → New Rule) and published to production. The REST API and Terraform are also options ([Firewall overview](https://vercel.com/docs/vercel-firewall)).

**Ordering:** "If the request is not blocked by the WAF rules, your deployment can process and serve it" ([Firewall concepts](https://vercel.com/docs/vercel-firewall/firewall-concepts#how-vercel-secures-requests)). The WAF therefore sits in front of what the deployment serves, cached responses included. A denied request "does not incur CDN Requests or Fast Data Transfer" (same page).

**Don't use Challenge on `/api/cards/*`.** Challenged API routes "can only be accessed within a valid challenge session", and direct API calls from scripts fail (same page). tcgRank calls these endpoints server-to-server.

**In code: `@vercel/firewall`.** `checkRateLimit('<rule-id>', { request, rateLimitKey?, timeout? })` returns `{ rateLimited }` and needs a dashboard rule whose condition is `@vercel/firewall` with that rate-limit ID ([Rate Limiting SDK](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting-sdk)). It's a plain `Request`-based API, so it fits Start server routes or a request middleware. On Hobby it still counts as the single rate-limit rule. It also only runs **inside the function**, so it doesn't protect CDN-cached hits. That's fine, since cached hits are cheap.

**Suggested allocation:**

- **Hobby (1 rule):** put a dashboard rule on *Request Path starts with `/api/og/`*, keyed by IP, with something like 30 requests per 60 s and a 429 response. OG is the expensive endpoint (CPU-heavy satori+sharp). Legitimate traffic is mostly crawlers fetching one image per shared link.
- **Pro:** add a second rule for `/api/cards/` (for example 120 per 60 s per IP). If tcgRank's server egress IPs would trip it, either add a bypass custom rule for them or call `checkRateLimit` with a key that excludes them.

### 3.2 Turning off preview deployments

- **`vercel.json`:** `git.deploymentEnabled` accepts an object mapping minimatch branch globs to booleans. "If a branch matches multiple rules and at least one rule is `true`, a deployment will occur" ([Git configuration](https://vercel.com/docs/project-configuration/git-configuration#git.deploymentenabled)). So `{ "**": false, "main": true }` deploys only `main`. Use `**` rather than `*`: minimatch's `*` doesn't cross `/`, so `"*": false` would miss slash-named branches like `feat/x`.
- **Dashboard alternative:** Settings → Build and Deployment → **Ignored Build Step → "Only build production"** ("When the `VERCEL_ENV` is production, a new build will be issued"). Canceled builds still "count towards your deployment quotas and concurrent build slots" ([Project settings → Ignored Build Step](https://vercel.com/docs/project-configuration/project-settings#ignored-build-step)). `deploymentEnabled` avoids creating the deployment at all, so prefer it.
- With previews gone, `VERCEL_BRANCH_URL` / `VERCEL_URL` in `src/server/auth.ts` `trustedOrigins` become production-only aliases. They're harmless and can stay.

### 3.3 Migrations only on production

`VERCEL_ENV` is available "at both build and runtime", with values `production`, `preview` or `development` ([System environment variables](https://vercel.com/docs/environment-variables/system-environment-variables#vercel_env)).

Put the guard in `scripts/migrate.ts`, so `vercel-build` stays a single command and local runs are unaffected:

```ts
// scripts/migrate.ts: before the `if (url)` branch
if (process.env.VERCEL && process.env.VERCEL_ENV !== 'production') {
  console.log(`↷ skipping migrations on a ${process.env.VERCEL_ENV} Vercel build`)
  process.exit(0)
}
```

Interactions to know ([Promoting deployments](https://vercel.com/docs/deployments/promoting-a-deployment)):

- **Promote preview to production** is "a complete rebuild" with production env vars, so migrations run then.
- **Promote a staged production build** "won't trigger a rebuild". That build already ran as `VERCEL_ENV=production`, so it already migrated before it was promoted.
- **Instant Rollback** assigns domains to an older deployment without rebuilding, so the schema stays at the newer version. Migrations must therefore be additive and backward compatible, as ADR 0004 already requires for the Go-era tables.

---

## 4. Cache-Control on `/api/cards/search` and `/api/og/*` vs the Vercel CDN

Current headers:

- `/api/cards/search` → `public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400`
- OG → `public, max-age=N, s-maxage=N, stale-while-revalidate=86400`, where N is 86,400 for `card/$cardId` and `default`. The `ogResponse` default is 300.

How Vercel treats them:

- **Cacheable?** Yes. Function responses are cached with `s-maxage` (+`stale-while-revalidate`), for `GET`/`HEAD` without an `Authorization` header, with status 200/404/410/301/302/307/308, no `set-cookie`, and size ≤ 10 MB ([CDN cache → cacheable response criteria](https://vercel.com/docs/caching/cdn-cache#cacheable-response-criteria)). Without `CDN-Cache-Control`, Vercel strips `s-maxage`/`stale-while-revalidate` before the response reaches the browser (same page).
- **Cache key** = method + URL + host + **deployment URL** + scheme. "Query strings are ignored for static files" only, and "Cache keys are not configurable" ([Purging CDN cache → cache keys](https://vercel.com/docs/caching/cdn-cache/purge#cache-keys)). For these function routes:
  - **Query-string busting:** `/api/og/card/base1-4?x=1`, `?x=2`, … are all separate misses, and each runs satori+sharp. Search has the same problem (`&_=random`), and `q` × `page` (≤ 500) × `perPage` (≤ 96) is a large keyspace even with valid input.
  - **Every deploy starts cold.** The deployment URL is part of the key, so a deploy right after a link goes viral re-renders every OG image.
  - Cache is **per region**, and "cache times are best-effort": rarely requested entries get evicted.
- **Not cached:** the 400 from search (400 isn't a cacheable status) and the 404s from `og/card` and `og/collector`, which return `new Response('Not found', { status: 404 })` with no `Cache-Control`. Random-ID enumeration therefore always reaches the function. That costs a cheap DB lookup, not a render, but it still counts as an invocation.
- **The `Vary` header isn't needed.** `Accept`/`Accept-Encoding` are already part of the key.

Mitigations, cheapest first:

1. **Canonicalise OG URLs.** In each `/api/og/*` handler (or one middleware branch), return a cacheable `308` to the bare path whenever `url.search !== ''`. A cache-busting request then costs one cheap function invocation instead of a render, and the redirect itself caches.
2. **Canonicalise search.** Rebuild the URL from the parsed `{ q, page, perPage }` (trimmed, lower-cased `q`, default params omitted). If it differs from `request.url`, 308 to it, so junk params can't multiply renders of the same result.
3. **Cache negative results briefly:** `cache-control: public, s-maxage=300` on the OG 404s and on search 400s. A 400 isn't cacheable, so for bad search input consider returning a `200` with an empty result plus `error`, or accept the cost.
4. **WAF rate-limit rule on `/api/og/`** (§3.1). It's the one control that also covers cache misses caused by deploys and key churn.
5. *(Optional)* `Vercel-Cache-Tag: og` on OG responses, so a design change can purge them without a deploy ([Purging → cache tags](https://vercel.com/docs/caching/cdn-cache/purge#cache-tags)). Hobby gets 50 purge calls per second per team.

`POST /api/cards/lookup` is never CDN-cached (POST). It's bounded by `liveCardLookupInput` (≤ 120 cards, 12-char fields), so per-IP rate limiting (Pro) or `checkRateLimit` is its only abuse control.

---

## 5. Open questions / verify before implementing

- **Nitro routeRules headers on Vercel:** does a header-only route without `continue` stop routing before `/__server`? Check `.vercel/output/config.json` from `vercel build` if route rules are ever used (§1.3).
- **`vercel.json` headers merging with a framework-written `.vercel/output`:** inferred from the Vercel CLI source, not from a doc statement (§1.4). Confirm with `curl -I` on `/assets/<file>.js` after the first deploy.
- **Production branch name** for `git.deploymentEnabled`, and whether minimatch `*` vs `**` matters for slash-named branches.
- **Avatar policy:** allow any `https:` image or restrict it (affects `img-src`).
- **Nitro version drift:** the pinned `3.0.260903-beta` is older than `3.0.261103-rc`. I didn't diff the Vercel preset between them.

## Sources

- TanStack Start middleware guide: https://tanstack.com/start/latest/docs/framework/react/guide/middleware
- TanStack source, from npm tarballs at the versions above: `start-server-core/src/createStartHandler.ts`, `start-client-core/src/{createStart,createMiddleware,createCsrfMiddleware,getGlobalStartContext}.ts`, `router-core/src/router.ts`, `router-core/src/ssr/{hydrationScripts,bodyScripts,ssr-server}.ts`, `react-router/src/{Scripts,ScriptOnce,HeadContent,headContentUtils,scroll-restoration}.tsx`, `react-router/src/ssr/renderRouterToStream.tsx`
- TanStack/router discussion #3028 (community, older): https://github.com/TanStack/router/discussions/3028
- Nitro 3.0.260903-beta: `dist/_presets.mjs` (Vercel `generateBuildConfig`) and `dist/docs/1.deploy/2.providers/21.vercel.md`; online: https://nitro.build/deploy/providers/vercel
- Vercel Build Output API configuration: https://vercel.com/docs/build-output-api/configuration
- Vercel CLI source: https://github.com/vercel/vercel/blob/main/internals/cli-builder-integration/src/do-build.ts, https://github.com/vercel/vercel/blob/main/packages/routing-utils/src/merge.ts
- vercel.json: https://vercel.com/docs/project-configuration/vercel-json
- Git configuration: https://vercel.com/docs/project-configuration/git-configuration
- Project settings (Ignored Build Step): https://vercel.com/docs/project-configuration/project-settings
- System environment variables: https://vercel.com/docs/environment-variables/system-environment-variables
- Promoting deployments: https://vercel.com/docs/deployments/promoting-a-deployment
- Vercel Firewall: https://vercel.com/docs/vercel-firewall; concepts: https://vercel.com/docs/vercel-firewall/firewall-concepts
- WAF rate limiting: https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting; SDK: https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting-sdk
- CDN cache: https://vercel.com/docs/caching/cdn-cache; purge and cache keys: https://vercel.com/docs/caching/cdn-cache/purge
- W3C Service Workers §6.2 Content Security Policy: https://w3c.github.io/ServiceWorker/#content-security-policy
