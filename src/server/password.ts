import bcrypt from 'bcryptjs'
import { hashPassword as scryptHash, verifyPassword as scryptVerify } from 'better-auth/crypto'

/** Accounts migrated from the Go backend carry bcrypt hashes ("$2a$…", "$2b$…", "$2y$…"). */
export const isBcryptHash = (hash: string): boolean => /^\$2[aby]\$/.test(hash)

/** New passwords use better-auth's default scrypt hashing. */
export const hashPassword = (password: string) => scryptHash(password)

/** Verifies both kinds, so migrated users keep signing in with the password they already have. */
export const verifyPassword = ({ hash, password }: { hash: string; password: string }): Promise<boolean> =>
  isBcryptHash(hash) ? bcrypt.compare(password, hash) : scryptVerify({ hash, password })
