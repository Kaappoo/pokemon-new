import { useCallback, useEffect, useState } from 'react'
import { catalogApi } from '@/lib/api'

// ── Cards ──────────────────────────────────────────────

interface CardListItem {
    id: string
    localId: string
    name: string
    image: string
}

interface CardDetail {
    id: string
    localId: string
    name: string
    image: string
    category: string
    illustrator: string
    rarity: string
    set: { id: string; name: string; logo?: string; symbol?: string; cardCount: { official: number; total: number } }
    variants: Record<string, boolean>
    hp?: number
    types?: string[]
    evolveFrom?: string
    description?: string
    stage?: string
    attacks?: { name: string; cost?: string[]; effect?: string; damage?: number | string }[]
    abilities?: { name: string; text: string; type: string }[]
    weaknesses?: { type: string; value: string }[]
    resistances?: { type: string; value: string }[]
    retreat?: number
    regulationMark?: string
    legal?: { standard: boolean; expanded: boolean }
}

export type { CardListItem, CardDetail }

interface CardFilters {
    page: number
    itemsPerPage: number
    name?: string
    type?: string
    set?: string
    category?: string
    includePocket?: boolean
}

export function useCards(initialFilters: CardFilters) {
    const [cards, setCards] = useState<CardListItem[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [filters, setFilters] = useState<CardFilters>(initialFilters)
    const [hasMore, setHasMore] = useState(true)

    const fetchCards = useCallback(async (f: CardFilters) => {
        setIsLoading(true)
        try {
            const results = await catalogApi.getCards({
                page: f.page,
                itemsPerPage: f.itemsPerPage,
                name: f.name,
                set: f.set,
                type: f.type,
                category: f.category,
                includePocket: f.includePocket,
            })

            setCards(results ?? [])
            setHasMore((results ?? []).length >= f.itemsPerPage)
        } catch (err) {
            console.error('Failed to fetch cards:', err)
            setCards([])
            setHasMore(false)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchCards(filters)
    }, [filters, fetchCards])

    const updateFilters = useCallback((updates: Partial<CardFilters>) => {
        setFilters((prev) => ({ ...prev, ...updates }))
    }, [])

    return { cards, isLoading, filters, updateFilters, hasMore }
}

export function useRecentCards(count: number) {
    const [cards, setCards] = useState<CardListItem[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchRecentCards() {
            try {
                const sets = await catalogApi.getSets({ page: 1, itemsPerPage: 1 })
                if (!sets || sets.length === 0) {
                    setCards([])
                    return
                }
                const fullSet = (await catalogApi.getSet(sets[0].id)) as { cards?: CardListItem[] } | null
                const results = fullSet?.cards ?? []
                setCards(results.slice(0, count))
            } catch (err) {
                console.error('Failed to fetch recent cards:', err)
                setCards([])
            } finally {
                setIsLoading(false)
            }
        }

        fetchRecentCards()
    }, [count])

    return { cards, isLoading }
}

export function useCard(cardId: string) {
    const [card, setCard] = useState<CardDetail | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!cardId) return
        catalogApi
            .getCard(cardId)
            .then((data) => setCard(data as CardDetail | null))
            .catch((err) => console.error('Failed to fetch card:', err))
            .finally(() => setIsLoading(false))
    }, [cardId])

    return { card, isLoading }
}

// ── Sets ───────────────────────────────────────────────

interface SetListItem {
    id: string
    name: string
    logo?: string
    symbol?: string
    cardCount: { official: number; total: number }
}

export type { SetListItem }

export function useSets(page: number, itemsPerPage: number, includePocket = false) {
    const [sets, setSets] = useState<SetListItem[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)

    useEffect(() => {
        setIsLoading(true)
        catalogApi
            .getSets({ page, itemsPerPage, includePocket })
            .then((results) => {
                setSets(results ?? [])
                setHasMore((results ?? []).length >= itemsPerPage)
            })
            .catch((err) => console.error('Failed to fetch sets:', err))
            .finally(() => setIsLoading(false))
    }, [page, itemsPerPage, includePocket])

    return { sets, isLoading, hasMore }
}

export function useAllSets(includePocket = false) {
    const [sets, setSets] = useState<SetListItem[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        catalogApi
            .getAllSets({ includePocket })
            .then((results) => setSets(results ?? []))
            .catch((err) => console.error('Failed to fetch all sets:', err))
            .finally(() => setIsLoading(false))
    }, [includePocket])

    return { sets, isLoading }
}

export function useNewestSet() {
    const [set, setSet] = useState<SetListItem | null>(null)

    useEffect(() => {
        catalogApi
            .getSets({ page: 1, itemsPerPage: 1 })
            .then((results) => {
                if (results && results.length > 0) setSet(results[0])
            })
            .catch((err) => console.error('Failed to fetch newest set:', err))
    }, [])

    return set
}

// ── Types ──────────────────────────────────────────────

export function useTypes() {
    const [types, setTypes] = useState<string[]>([])

    useEffect(() => {
        catalogApi
            .getTypes()
            .then((data) => setTypes(data ?? []))
            .catch((err) => console.error('Failed to fetch types:', err))
    }, [])

    return types
}
