const ID_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz'

const randomString = (alphabet: string, length: number): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  let out = ''
  for (const byte of bytes) out += alphabet[byte % alphabet.length]
  return out
}

export const newId = (): string => randomString(ID_ALPHABET, 16)
