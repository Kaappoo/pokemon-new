import { Schema } from 'effect'

/**
 * Effect Schema models of the TCGdex payloads we store and render
 * (https://tcgdex.dev). Decoding is lenient on purpose: TCGdex is community
 * maintained, so most fields are optional or null and unknown keys are ignored.
 */

const maybe = <S extends Schema.Top>(schema: S) => Schema.optional(Schema.NullOr(schema))

const CardCount = Schema.Struct({
  total: maybe(Schema.Number),
  official: maybe(Schema.Number),
})

export const SetResume = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
})
export type SetResume = typeof SetResume.Type

export const CardResume = Schema.Struct({
  id: Schema.String,
  localId: Schema.String,
  name: Schema.String,
  image: maybe(Schema.String),
})
export type CardResume = typeof CardResume.Type

export const TcgdexSet = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  logo: maybe(Schema.String),
  symbol: maybe(Schema.String),
  serie: Schema.Struct({ id: Schema.String, name: Schema.String }),
  releaseDate: maybe(Schema.String),
  cardCount: maybe(CardCount),
  cards: Schema.Array(CardResume),
})
export type TcgdexSet = typeof TcgdexSet.Type

const Attack = Schema.Struct({
  name: Schema.String,
  cost: maybe(Schema.Array(Schema.String)),
  effect: maybe(Schema.String),
  damage: maybe(Schema.Union([Schema.String, Schema.Number])),
})

const Ability = Schema.Struct({
  type: maybe(Schema.String),
  name: Schema.String,
  effect: maybe(Schema.String),
})

const TypeModifier = Schema.Struct({
  type: Schema.String,
  value: maybe(Schema.String),
})

export const TcgdexCard = Schema.Struct({
  id: Schema.String,
  localId: Schema.String,
  name: Schema.String,
  image: maybe(Schema.String),
  category: Schema.String,
  illustrator: maybe(Schema.String),
  rarity: maybe(Schema.String),
  variants: maybe(Schema.Record(Schema.String, Schema.Boolean)),
  set: Schema.Struct({
    id: Schema.String,
    name: Schema.String,
    logo: maybe(Schema.String),
    symbol: maybe(Schema.String),
    cardCount: maybe(CardCount),
  }),
  dexId: maybe(Schema.Array(Schema.Number)),
  hp: maybe(Schema.Number),
  types: maybe(Schema.Array(Schema.String)),
  evolveFrom: maybe(Schema.String),
  description: maybe(Schema.String),
  stage: maybe(Schema.String),
  suffix: maybe(Schema.String),
  abilities: maybe(Schema.Array(Ability)),
  attacks: maybe(Schema.Array(Attack)),
  weaknesses: maybe(Schema.Array(TypeModifier)),
  resistances: maybe(Schema.Array(TypeModifier)),
  retreat: maybe(Schema.Number),
  effect: maybe(Schema.String),
  trainerType: maybe(Schema.String),
  energyType: maybe(Schema.String),
  regulationMark: maybe(Schema.String),
  legal: maybe(Schema.Struct({ standard: Schema.Boolean, expanded: Schema.Boolean })),
})
export type TcgdexCard = typeof TcgdexCard.Type
