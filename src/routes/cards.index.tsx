import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCards, useAllSets, useTypes } from '@/hooks/usePokemonApi'
import { useState, useMemo, useEffect } from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'

interface CardsSearch {
    set?: string
    name?: string
}

export const Route = createFileRoute('/cards/')({
    validateSearch: (search: Record<string, unknown>): CardsSearch => ({
        set: (search.set as string) || undefined,
        name: (search.name as string) || undefined,
    }),
    component: CardsPage,
})

function CardsPage() {
    const { set: searchSet, name: searchName } = Route.useSearch()
    const navigate = useNavigate()

    const initialFilters = useMemo(
        () => ({
            page: 1,
            itemsPerPage: 20,
            name: searchName || undefined,
            set: searchSet || undefined,
        }),
        [],
    )

    const { cards, isLoading, filters, updateFilters, hasMore } = useCards(initialFilters)
    console.log({ cards });

    const { sets: allSets } = useAllSets()
    const types = useTypes()

    const [searchString, setSearchString] = useState(searchName || '')
    const [selectedSet, setSelectedSet] = useState(searchSet || '')
    const [selectedType, setSelectedType] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('')

    useEffect(() => {
        if (searchSet || searchName) {
            updateFilters({ set: searchSet || undefined, name: searchName || undefined, page: 1 })
        }
    }, [])

    const handleSearchChange = (value: string) => {
        setSearchString(value)
        if (value.length > 2) {
            updateFilters({ name: value, page: 1 })
        } else if (value.length < 2 && filters.name) {
            updateFilters({ name: undefined, page: 1 })
        }
    }

    const handleSetChange = (value: string) => {
        setSelectedSet(value)
        updateFilters({ set: value || undefined, page: 1 })
    }

    const handleTypeChange = (value: string) => {
        setSelectedType(value)
        updateFilters({ type: value || undefined, page: 1 })
    }

    const handleCategoryChange = (value: string) => {
        setSelectedCategory(value)
        updateFilters({ category: value || undefined, page: 1 })
    }

    const viewCard = (cardId: string) => {
        navigate({ to: '/cards/$cardId', params: { cardId } })
    }

    return (
        <div className="flex flex-col gap-4 min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
            <div className="flex flex-wrap items-center justify-between p-4 gap-4">
                <h2 className="text-xl md:text-2xl font-bold uppercase m-0">cards search</h2>
                <div className="flex items-center bg-white rounded-xl px-3 h-9">
                    <input
                        type="text"
                        placeholder="Enter name.."
                        value={searchString}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="outline-none border-none bg-transparent text-gray-900 text-sm w-40 md:w-60"
                    />
                    <Search size={18} className="text-[#3a1078]" />
                </div>
            </div>

            <div className="flex flex-col lg:flex-row">
                <div className="flex flex-row lg:flex-col gap-4 lg:gap-6 p-4 lg:w-60 flex-shrink-0">
                    <FilterSelect label="Select Set" value={selectedSet} onChange={handleSetChange} options={allSets.map((s) => ({ value: s.id, label: s.name }))} />
                    <FilterSelect label="Select Type" value={selectedType} onChange={handleTypeChange} options={types.map((t) => ({ value: t, label: t }))} />
                    <FilterSelect label="Select Category" value={selectedCategory} onChange={handleCategoryChange} options={[{ value: 'Pokemon', label: 'Pokemon' }, { value: 'Energy', label: 'Energy' }, { value: 'Trainer', label: 'Trainer' }]} />
                </div>

                <div className="flex flex-wrap gap-6 md:gap-8 flex-1 p-4 min-h-[60vh]">
                    {isLoading ? (
                        Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="skeleton w-[95px] md:w-[150px] lg:w-[200px] h-[130px] md:h-[210px] lg:h-[280px] rounded-xl" />
                        ))
                    ) : cards.length > 0 ? (
                        cards.map((card) => (
                            <>
                                {
                                    <div key={card.id} onClick={() => viewCard(card.id)} className="cursor-pointer transition-transform duration-100 hover:scale-105">
                                        <img src={`${card.image}/low.webp`} alt={card.name} loading="lazy" className="w-[95px] md:w-[150px] lg:w-[200px] rounded-lg" />
                                    </div>
                                }
                            </>
                        ))
                    ) : (
                        <div className="flex items-center justify-center w-full">
                            <h2 className="text-2xl opacity-50">No cards found</h2>
                        </div>
                    )}
                </div>
            </div>

            {!isLoading && (
                <div className="flex flex-wrap items-center justify-center gap-4 py-6 px-4">
                    <button
                        onClick={() => updateFilters({ page: Math.max(1, filters.page - 1) })}
                        disabled={filters.page <= 1}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                        style={{ backgroundColor: 'var(--bg-header)', color: 'var(--text-primary)' }}
                    >
                        <ChevronLeft size={16} /> Prev
                    </button>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Page {filters.page}</span>
                    <button
                        onClick={() => updateFilters({ page: filters.page + 1 })}
                        disabled={!hasMore}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                        style={{ backgroundColor: 'var(--bg-header)', color: 'var(--text-primary)' }}
                    >
                        Next <ChevronRight size={16} />
                    </button>
                    <select
                        value={filters.itemsPerPage}
                        onChange={(e) => updateFilters({ page: 1, itemsPerPage: Number(e.target.value) })}
                        className="px-3 py-2 rounded-lg text-sm cursor-pointer"
                        style={{ backgroundColor: '#1e1c24', color: 'var(--text-primary)', border: '1px solid var(--bg-header)' }}
                    >
                        {[20, 30, 50].map((opt) => (<option key={opt} value={opt}>{opt} / page</option>))}
                    </select>
                </div>
            )}
        </div>
    )
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
    return (
        <div className="flex flex-col gap-1 flex-1 lg:flex-none">
            <label className="text-xs md:text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</label>
            <select value={value} onChange={(e) => onChange(e.target.value)} className="px-3 py-2 rounded-lg text-sm cursor-pointer" style={{ backgroundColor: '#090016', color: 'var(--text-primary)', border: '2px solid var(--bg-header)' }}>
                <option value="">All</option>
                {options.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
            </select>
        </div>
    )
}
