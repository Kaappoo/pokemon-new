import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { magicLink, username } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { Effect } from 'effect'
import { database } from './db/index.ts'
import * as schema from './db/schema.ts'
import { Mailer, type Email } from './email/mailer.ts'
import { magicLinkEmail, resetPasswordEmail } from './email/templates.ts'
import { hashPassword, verifyPassword } from './password.ts'
import { runtime } from './runtime.ts'

const send = (email: Email) => runtime.runPromise(Mailer.use((m) => m.send(email)).pipe(Effect.orDie))

// Vercel serves one deployment under several hosts (production domain, *.vercel.app
// alias, per-branch and per-deployment preview URLs); sign-in must work from each.
const vercelOrigins = [
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
  process.env.VERCEL_BRANCH_URL,
  process.env.VERCEL_URL,
].flatMap((host) => (host ? [`https://${host}`] : []))

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.APP_URL,
  trustedOrigins: [process.env.APP_URL, ...vercelOrigins].filter((o): o is string => Boolean(o)),
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(database, { provider: 'pg', schema }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    password: { hash: hashPassword, verify: verifyPassword },
    sendResetPassword: async ({ user, url }) => send(resetPasswordEmail(user.email, url)),
  },
  user: {
    additionalFields: {
      bio: { type: 'string', required: false, input: false },
      favoriteCard: { type: 'string', required: false, input: false },
    },
  },
  session: {
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  plugins: [
    username({ minUsernameLength: 3, maxUsernameLength: 24 }),
    magicLink({ sendMagicLink: async ({ email, url }) => send(magicLinkEmail(email, url)) }),
    tanstackStartCookies(),
  ],
})
