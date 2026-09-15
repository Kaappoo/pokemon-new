import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSets } from '@/hooks/usePokemonApi'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, PackageOpen } from 'lucide-react'

export const Route = createFileRoute('/sets')({ component: SetsPage })

function SetsPage() {
    const navigate = useNavigate()
    const [page, setPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(20)
    const [includePocket, setIncludePocket] = useState(false)
    const { sets, isLoading, hasMore } = useSets(page, itemsPerPage, includePocket)

    const goToSet = (setId: string) => {
        navigate({ to: '/cards', search: { set: setId } })
    }

    return (
        <div className="flex flex-col gap-6 min-h-screen p-6 md:p-10 bg-(--bg-primary) text-(--text-primary)">
            <div className="flex flex-col items-center gap-2 pt-4 pb-2">
                <h1 className="text-3xl md:text-4xl font-extrabold m-0 tracking-tight bg-[#d9d0ff] bg-clip-text text-transparent">
                    All Sets
                </h1>
                <p className="text-sm m-0 text-(--text-secondary) opacity-70">
                    Browse every Pokémon TCG expansion
                </p>
                <label className="flex items-center gap-2 text-xs font-medium mt-1 cursor-pointer select-none text-(--text-secondary)">
                    <input
                        type="checkbox"
                        checked={includePocket}
                        onChange={(e) => {
                            setIncludePocket(e.target.checked)
                            setPage(1)
                        }}
                        className="accent-(--accent-purple) cursor-pointer"
                    />
                    Include Pokémon TCG Pocket sets
                </label>
            </div>

            {isLoading ? (
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="skeleton h-[150px] rounded-xl" />
                    ))}
                </div>
            ) : (
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                    {sets.length > 0 ? (
                        sets.map((set, i) => (
                            <div
                                key={set.id}
                                onClick={() => goToSet(set.id)}
                                className="group h-[150px] flex flex-col items-center justify-center overflow-hidden p-4 cursor-pointer rounded-xl bg-white/[0.03] border border-white/[0.08] transition-all duration-250 hover:border-(--accent-purple) hover:bg-white/[0.06] hover:shadow-[0_0_24px_rgba(136,59,207,0.15)] animate-[cardFadeIn_0.4s_ease_forwards] opacity-0"
                                style={{ animationDelay: `${Math.min(i * 40, 500)}ms` }}
                            >
                                {set.logo ? (
                                    <img
                                        src={`${set.logo}.webp`}
                                        alt={set.name}
                                        className="w-[180px] h-[80%] object-contain transition-transform duration-200 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="text-lg font-bold text-center">{set.name}</div>
                                )}
                                <span className="text-sm font-medium whitespace-nowrap text-ellipsis overflow-hidden max-w-full text-(--text-secondary)">
                                    {set.name}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full flex flex-col items-center justify-center gap-4 py-20">
                            <PackageOpen size={56} className="animate-[floatSlow_3s_ease-in-out_infinite]" style={{ color: 'var(--accent-purple)', opacity: 0.5 }} />
                            <h2 className="text-xl font-semibold m-0 text-(--text-secondary)">No sets found</h2>
                        </div>
                    )}
                </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 py-6">
                <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="py-2 px-[18px] rounded-full text-sm font-medium border border-white/10 bg-white/5 text-(--text-primary) cursor-pointer transition-all flex items-center gap-1 not-disabled:hover:bg-[rgba(136,59,207,0.25)] not-disabled:hover:border-(--accent-purple) not-disabled:hover:shadow-[0_0_16px_rgba(136,59,207,0.2)] disabled:opacity-25 disabled:cursor-not-allowed"
                >
                    <ChevronLeft size={16} /> Prev
                </button>

                <span
                    className="px-4 py-2 rounded-full text-sm font-semibold"
                    style={{ background: 'var(--accent-purple)', color: '#fff' }}
                >
                    {page}
                </span>

                <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!hasMore}
                    className="py-2 px-[18px] rounded-full text-sm font-medium border border-white/10 bg-white/5 text-(--text-primary) cursor-pointer transition-all flex items-center gap-1 not-disabled:hover:bg-[rgba(136,59,207,0.25)] not-disabled:hover:border-(--accent-purple) not-disabled:hover:shadow-[0_0_16px_rgba(136,59,207,0.2)] disabled:opacity-25 disabled:cursor-not-allowed"
                >
                    Next <ChevronRight size={16} />
                </button>

                <select
                    value={itemsPerPage}
                    onChange={(e) => {
                        setItemsPerPage(Number(e.target.value))
                        setPage(1)
                    }}
                    className="ml-2 bg-white/5 border border-white/10 rounded-[10px] py-2.5 px-3.5 pr-8 text-(--text-primary) text-sm cursor-pointer transition-all appearance-none hover:border-(--accent-purple) hover:shadow-[0_0_12px_rgba(136,59,207,0.2)] focus:border-(--accent-purple) focus:shadow-[0_0_12px_rgba(136,59,207,0.2)] focus:outline-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23d9d0ff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                >
                    {[20, 30, 50].map((opt) => (
                        <option key={opt} value={opt} className="bg-[#1e1c24] text-(--text-primary)">
                            {opt} / page
                        </option>
                    ))}
                </select>
            </div>
        </div>
    )
}
