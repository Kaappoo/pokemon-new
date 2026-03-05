import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCards, useAllSets, useTypes } from '@/hooks/usePokemonApi'
import { useState, useMemo, useEffect } from 'react'
import { Search, ChevronLeft, ChevronRight, SlidersHorizontal, X, PackageOpen } from 'lucide-react'

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
            itemsPerPage: 40,
            name: searchName || undefined,
            set: searchSet || undefined,
        }),
        [],
    )

    const { cards, isLoading, filters, updateFilters, hasMore } = useCards(initialFilters)
    const { sets: allSets } = useAllSets()
    const types = useTypes()

    const [searchString, setSearchString] = useState(searchName || '')
    const [selectedSet, setSelectedSet] = useState(searchSet || '')
    const [selectedType, setSelectedType] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('')
    const [filtersOpen, setFiltersOpen] = useState(true)

    useEffect(() => {
        if (searchSet || searchName) {
            updateFilters({ set: searchSet || undefined, name: searchName || undefined, page: 1 })
        }
    }, [])

    const activeFilterCount = [selectedSet, selectedType, selectedCategory].filter(Boolean).length

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

    const clearAllFilters = () => {
        setSearchString('')
        setSelectedSet('')
        setSelectedType('')
        setSelectedCategory('')
        updateFilters({ name: undefined, set: undefined, type: undefined, category: undefined, page: 1 })
    }

    const viewCard = (cardId: string) => {
        navigate({ to: '/cards/$cardId', params: { cardId } })
    }

    return (
        <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
            {/* ── Hero search area ────────────────────────── */}
            <div className="flex flex-col items-center gap-6 pt-10 pb-6 px-4">
                <div className="flex flex-col items-center gap-2">
                    <h1 className="text-3xl md:text-4xl font-extrabold m-0 tracking-tight bg-[#d9d0ff] bg-clip-text text-transparent">
                        Card Search
                    </h1>
                    <p className="text-sm m-0" style={{ color: 'var(--text-secondary)' }}>
                        Browse & discover every Pokémon card
                    </p>
                </div>

                <div className="w-full max-w-xl rounded-2xl flex items-center px-4 py-3 gap-3 bg-white/4 backdrop-blur-lg border border-white/8 shadow-[0_0_0_1px_rgba(136,59,207,0.3)] transition-shadow duration-300 focus-within:shadow-[0_0_20px_rgba(136,59,207,0.35),0_0_0_1px_rgba(136,59,207,0.6)]">
                    <Search size={20} className="text-[#883bcf] flex-shrink-0" />
                    <input
                        type="text"
                        placeholder="Search cards by name…"
                        value={searchString}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="outline-none border-none bg-transparent text-[var(--text-primary)] text-base w-full placeholder:text-[var(--text-secondary)] placeholder:opacity-50"
                    />
                    {searchString && (
                        <button
                            onClick={() => handleSearchChange('')}
                            className="bg-transparent border-none cursor-pointer p-1 rounded-full hover:bg-white/10 transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:gap-10 flex-1">
                <aside className="lg:w-64 shrink-0 px-4 pb-4 lg:pb-0 lg:pt-2">
                    {/* Toggle button (mobile + desktop) */}
                    <button
                        onClick={() => setFiltersOpen(!filtersOpen)}
                        className="flex items-center gap-2 text-sm font-medium mb-3 bg-transparent border-none cursor-pointer transition-colors hover:opacity-80"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        <SlidersHorizontal size={16} />
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="text-[0.65rem] bg-(--accent-purple) text-white rounded-full min-w-[18px] h-[18px] inline-flex items-center justify-center px-[5px] font-bold">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>

                    {filtersOpen && (
                        <div className="flex flex-row lg:flex-col gap-3 flex-wrap">
                            <FilterSelect
                                label="Set"
                                value={selectedSet}
                                onChange={handleSetChange}
                                options={allSets.map((s) => ({ value: s.id, label: s.name }))}
                            />
                            <FilterSelect
                                label="Type"
                                value={selectedType}
                                onChange={handleTypeChange}
                                options={types.map((t) => ({ value: t, label: t }))}
                            />
                            <FilterSelect
                                label="Category"
                                value={selectedCategory}
                                onChange={handleCategoryChange}
                                options={[
                                    { value: 'Pokemon', label: 'Pokémon' },
                                    { value: 'Energy', label: 'Energy' },
                                    { value: 'Trainer', label: 'Trainer' },
                                ]}
                            />

                            {activeFilterCount > 0 && (
                                <button
                                    onClick={clearAllFilters}
                                    className="flex items-center gap-1 text-xs font-medium px-3 py-2 rounded-lg bg-transparent border border-red-500/30 cursor-pointer transition-all hover:bg-red-500/10"
                                    style={{ color: '#f87171' }}
                                >
                                    <X size={12} /> Clear all
                                </button>
                            )}
                        </div>
                    )}
                </aside>

                <div className="flex-1 flex flex-col px-4 lg:px-6">
                    {!isLoading && (
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                                {cards.length > 0 ? `Showing ${cards.length} cards` : ''}
                            </span>
                        </div>
                    )}
                    <div className="grid gap-4 md:gap-5 min-h-[60vh]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                        {isLoading
                            ? Array.from({ length: 12 }).map((_, i) => (
                                <div key={i} className="skeleton rounded-xl" style={{ aspectRatio: '5/7' }} />
                            ))
                            : cards.length > 0
                                ? cards.map((card, i) => (
                                    <div
                                        key={card.id}
                                        onClick={() => viewCard(card.id)}
                                        className="group cursor-pointer relative rounded-xl overflow-hidden transition-all duration-250 ease-out hover:-translate-y-2 hover:scale-[1.04] hover:z-10 animate-[cardFadeIn_0.4s_ease_forwards] opacity-0"
                                        style={{ animationDelay: `${Math.min(i * 30, 400)}ms` }}
                                    >
                                        <img
                                            src={`${card.image}/low.webp`}
                                            alt={card.name}
                                            loading="lazy"
                                            className="w-full rounded-xl transition-shadow duration-300 group-hover:shadow-[0_12px_40px_rgba(136,59,207,0.35),0_4px_12px_rgba(0,0,0,0.5)]"
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 py-2 px-1.5 bg-linear-to-t from-black/80 to-transparent rounded-b-xl opacity-0 transition-opacity duration-250 pointer-events-none group-hover:opacity-100">
                                            <span className="text-xs font-semibold text-white truncate block text-center">
                                                {card.name}
                                            </span>
                                        </div>
                                    </div>
                                ))
                                : (
                                    <div className="col-span-full flex flex-col items-center justify-center gap-4 py-20">
                                        <PackageOpen size={56} className="animate-[floatSlow_3s_ease-in-out_infinite]" style={{ color: 'var(--accent-purple)', opacity: 0.5 }} />
                                        <h2 className="text-xl font-semibold m-0" style={{ color: 'var(--text-secondary)' }}>No cards found</h2>
                                        <p className="text-sm m-0" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>Try adjusting your filters or search term</p>
                                    </div>
                                )}
                    </div>
                </div>
            </div>

            {/* ── Pagination ─────────────────────────────── */}
            {!isLoading && cards.length > 0 && (
                <div className="flex items-center justify-center gap-3 py-8 px-4">
                    <button
                        onClick={() => updateFilters({ page: Math.max(1, filters.page - 1) })}
                        disabled={filters.page <= 1}
                        className="py-2 px-[18px] rounded-full text-sm font-medium border border-white/10 bg-white/5 text-(--text-primary) cursor-pointer transition-all flex items-center gap-1 not-disabled:hover:bg-[rgba(136,59,207,0.25)] not-disabled:hover:border-(--accent-purple) not-disabled:hover:shadow-[0_0_16px_rgba(136,59,207,0.2)] disabled:opacity-25 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={16} /> Prev
                    </button>

                    <span
                        className="px-4 py-2 rounded-full text-sm font-semibold"
                        style={{ background: 'var(--accent-purple)', color: '#fff' }}
                    >
                        {filters.page}
                    </span>

                    <button
                        onClick={() => updateFilters({ page: filters.page + 1 })}
                        disabled={!hasMore}
                        className="py-2 px-[18px] rounded-full text-sm font-medium border border-white/10 bg-white/5 text-(--text-primary) cursor-pointer transition-all flex items-center gap-1 not-disabled:hover:bg-[rgba(136,59,207,0.25)] not-disabled:hover:border-(--accent-purple) not-disabled:hover:shadow-[0_0_16px_rgba(136,59,207,0.2)] disabled:opacity-25 disabled:cursor-not-allowed"
                    >
                        Next <ChevronRight size={16} />
                    </button>

                    <select
                        value={filters.itemsPerPage}
                        onChange={(e) => updateFilters({ page: 1, itemsPerPage: Number(e.target.value) })}
                        className="ml-2 bg-white/5 border border-white/10 rounded-[10px] py-2.5 px-3.5 pr-8 text-(--text-primary) text-sm cursor-pointer transition-all appearance-none hover:border-(--accent-purple) hover:shadow-[0_0_12px_rgba(136,59,207,0.2)] focus:border-(--accent-purple) focus:shadow-[0_0_12px_rgba(136,59,207,0.2)] focus:outline-none"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23d9d0ff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                    >
                        {[40, 60, 80].map((opt) => (
                            <option key={opt} value={opt} className="bg-[#1e1c24] text-(--text-primary)">{opt} / page</option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    )
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
    return (
        <div className="flex flex-col gap-1.5 flex-1 lg:flex-none">
            <label className="text-xs font-semibold tracking-wide uppercase" style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>
                {label}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-[10px] py-2.5 px-3.5 pr-8 text-(--text-primary) text-sm cursor-pointer transition-all appearance-none hover:border-(--accent-purple) hover:shadow-[0_0_12px_rgba(136,59,207,0.2)] focus:border-(--accent-purple) focus:shadow-[0_0_12px_rgba(136,59,207,0.2)] focus:outline-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23d9d0ff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
            >
                <option value="" className="bg-[#1e1c24] text-(--text-primary)">All</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#1e1c24] text-(--text-primary)">{opt.label}</option>
                ))}
            </select>
        </div>
    )
}
