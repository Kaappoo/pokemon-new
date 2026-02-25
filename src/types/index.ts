// ── Card types (TCGdex API) ────────────────────────────

export interface CardBrief {
    id: string
    localId: string
    name: string
    image: string // base URL — append /high.webp or /low.webp
}

export interface Attack {
    name: string
    cost: string[]
    effect?: string
    damage?: number | string
}

export interface Ability {
    name: string
    text: string
    type: string
}

export interface WeaknessResistance {
    type: string
    value: string
}

export interface CardSet {
    id: string
    name: string
    logo?: string
    symbol?: string
    cardCount: { official: number; total: number }
}

export interface CardVariants {
    firstEdition: boolean
    holo: boolean
    normal: boolean
    reverse: boolean
    wPromo: boolean
}

export interface Card {
    id: string
    localId: string
    name: string
    image: string
    category: string // "Pokemon" | "Trainer" | "Energy"
    illustrator: string
    rarity: string
    set: CardSet
    variants: CardVariants
    hp?: number
    types?: string[]
    evolveFrom?: string
    description?: string
    stage?: string
    attacks?: Attack[]
    abilities?: Ability[]
    weaknesses?: WeaknessResistance[]
    resistances?: WeaknessResistance[]
    retreat?: number
    regulationMark?: string
    legal?: { standard: boolean; expanded: boolean }
    // TCGdex doesn't provide price data
}

// ── Request types ──────────────────────────────────────

export interface CardRequest {
    page: number
    itemsPerPage: number
    name?: string
    category?: string
    type?: string
    set?: string
}

// ── Set types ──────────────────────────────────────────

export interface SetBrief {
    id: string
    name: string
    logo?: string
    symbol?: string
    cardCount: { official: number; total: number }
}

export interface SetDetail {
    id: string
    name: string
    logo?: string
    symbol?: string
    releaseDate: string
    cardCount: { firstEd: number; holo: number; normal: number; official: number; reverse: number; total: number }
    cards: CardBrief[]
    serie: { id: string; name: string }
    legal?: { standard: boolean; expanded: boolean }
}

// ── Type types ─────────────────────────────────────────

// TCGdex returns a plain string array for types
export type TypesResponse = string[]
