import { useCallback, useEffect, useState } from 'react'
import tcgdex, { Query } from '@/lib/api'

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
}

export function useCards(initialFilters: CardFilters) {
    const [cards, setCards] = useState<CardListItem[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [filters, setFilters] = useState<CardFilters>(initialFilters)
    const [hasMore, setHasMore] = useState(true)

    const fetchCards = useCallback(async (f: CardFilters) => {
        setIsLoading(true)
        try {
            const query = Query.create().paginate(f.page, f.itemsPerPage)
            if (f.name) query.contains('name', f.name)
            if (f.type) query.equal('types', f.type)
            if (f.set) query.equal('set.id', f.set)
            if (f.category) query.equal('category', f.category)
            query.not.isNull('image')

            const data = await tcgdex.card.list(query) as CardListItem[] | null

            const results = data ?? []
            setCards(results)
            setHasMore(results.length >= f.itemsPerPage)
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
                const setsQuery = Query.create()
                    .paginate(1, 1)
                    .sort('releaseDate', 'DESC')

                const sets = await tcgdex.set.list(setsQuery)
                if (!sets || sets.length === 0) {
                    setCards([])
                    return
                }
                const fullSet = await tcgdex.set.get(sets[0].id)
                const results = (fullSet?.cards ?? []) as unknown as CardListItem[]
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
        tcgdex.card
            .get(cardId)
            .then((data) => setCard(data as unknown as CardDetail | null))
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

export function useSets(page: number, itemsPerPage: number) {
    const [sets, setSets] = useState<SetListItem[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)

    useEffect(() => {
        setIsLoading(true)
        const query = Query.create()
            .paginate(page, itemsPerPage)
            .sort('releaseDate', 'DESC')

        tcgdex.set
            .list(query)
            .then((data) => {
                const results = (data ?? []) as unknown as SetListItem[]
                setSets(results)
                setHasMore(results.length >= itemsPerPage)
            })
            .catch((err) => console.error('Failed to fetch sets:', err))
            .finally(() => setIsLoading(false))
    }, [page, itemsPerPage])

    return { sets, isLoading, hasMore }
}

export function useAllSets() {
    const [sets, setSets] = useState<SetListItem[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const query = Query.create().sort('releaseDate', 'DESC')
        tcgdex.set
            .list(query)
            .then((data) => setSets((data ?? []) as unknown as SetListItem[]))
            .catch((err) => console.error('Failed to fetch all sets:', err))
            .finally(() => setIsLoading(false))
    }, [])

    return { sets, isLoading }
}

export function useNewestSet() {
    const [set, setSet] = useState<SetListItem | null>(null)

    useEffect(() => {
        const query = Query.create()
            .paginate(1, 1)
            .sort('releaseDate', 'DESC')

        tcgdex.set
            .list(query)
            .then((data) => {
                const results = (data ?? []) as unknown as SetListItem[]
                if (results.length > 0) setSet(results[0])
            })
            .catch((err) => console.error('Failed to fetch newest set:', err))
    }, [])

    return set
}

// ── Types ──────────────────────────────────────────────

export function useTypes() {
    const [types, setTypes] = useState<string[]>([])

    useEffect(() => {
        tcgdex.type
            .list()
            .then((data) => setTypes((data ?? []) as unknown as string[]))
            .catch((err) => console.error('Failed to fetch types:', err))
    }, [])

    return types
}
