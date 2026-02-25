import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSets } from '@/hooks/usePokemonApi'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export const Route = createFileRoute('/sets')({ component: SetsPage })

function SetsPage() {
    const navigate = useNavigate()
    const [page, setPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(20)
    const { sets, isLoading, hasMore } = useSets(page, itemsPerPage)

    const goToSet = (setId: string) => {
        navigate({ to: '/cards', search: { set: setId } })
    }

    return (
        <div
            className="flex flex-col gap-4 min-h-screen p-4"
            style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
        >
            <h1 className="text-2xl md:text-3xl font-bold">All sets</h1>

            {isLoading ? (
                <div className="flex flex-wrap gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="skeleton w-[300px] h-[150px] rounded-lg" />
                    ))}
                </div>
            ) : (
                <div className="flex flex-wrap gap-4">
                    {sets.length > 0 ? (
                        sets.map((set) => (
                            <div
                                key={set.id}
                                onClick={() => goToSet(set.id)}
                                className="w-[300px] h-[150px] flex flex-col items-center justify-center overflow-hidden p-2 mx-auto cursor-pointer rounded-lg border transition-transform duration-100 hover:border-[var(--accent-purple)] group"
                                style={{ borderColor: 'var(--bg-header)' }}
                            >
                                {set.logo ? (
                                    <img
                                        src={`${set.logo}.webp`}
                                        alt={set.name}
                                        className="w-[180px] h-[80%] object-contain transition-transform duration-100 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="text-lg font-bold text-center">{set.name}</div>
                                )}
                                <span className="text-sm font-medium whitespace-nowrap text-ellipsis overflow-hidden max-w-full">
                                    {set.name}
                                </span>
                            </div>
                        ))
                    ) : (
                        <h2 className="text-xl opacity-50">No sets found</h2>
                    )}
                </div>
            )}

            {/* Pagination */}
            <div className="flex flex-wrap items-center justify-center gap-4 py-6 px-4">
                <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                    style={{
                        backgroundColor: 'var(--bg-header)',
                        color: 'var(--text-primary)',
                    }}
                >
                    <ChevronLeft size={16} /> Prev
                </button>

                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Page {page}
                </span>

                <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!hasMore}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                    style={{
                        backgroundColor: 'var(--bg-header)',
                        color: 'var(--text-primary)',
                    }}
                >
                    Next <ChevronRight size={16} />
                </button>

                <select
                    value={itemsPerPage}
                    onChange={(e) => {
                        setItemsPerPage(Number(e.target.value))
                        setPage(1)
                    }}
                    className="px-3 py-2 rounded-lg text-sm cursor-pointer"
                    style={{
                        backgroundColor: '#1e1c24',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--bg-header)',
                    }}
                >
                    {[20, 30, 50].map((opt) => (
                        <option key={opt} value={opt}>
                            {opt} / page
                        </option>
                    ))}
                </select>
            </div>
        </div>
    )
}
