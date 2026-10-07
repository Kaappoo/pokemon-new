import { describe, expect, it } from 'vitest'
import { BCRYPT_PIKACHU1 } from './db/migrations.test.ts'
import { hashPassword, isBcryptHash, verifyPassword } from './password.ts'

describe('password hashing', () => {
  it('verifies bcrypt hashes migrated from the Go backend', async () => {
    expect(isBcryptHash(BCRYPT_PIKACHU1)).toBe(true)
    expect(await verifyPassword({ hash: BCRYPT_PIKACHU1, password: 'pikachu1' })).toBe(true)
    expect(await verifyPassword({ hash: BCRYPT_PIKACHU1, password: 'raichu1' })).toBe(false)
  })

  it('hashes new passwords with better-auth’s scrypt and verifies them', async () => {
    const hash = await hashPassword('correct-horse-1')
    expect(isBcryptHash(hash)).toBe(false)
    expect(await verifyPassword({ hash, password: 'correct-horse-1' })).toBe(true)
    expect(await verifyPassword({ hash, password: 'wrong-horse-1' })).toBe(false)
  })
})
