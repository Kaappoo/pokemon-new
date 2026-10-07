export const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

/** 23548 → "23,548". Fixed locale so the server render and hydration always match. */
export const formatCount = (value: number): string => value.toLocaleString('en-US')

export const pluralize = (count: number, one: string, many = `${one}s`): string =>
  `${formatCount(count)} ${count === 1 ? one : many}`
