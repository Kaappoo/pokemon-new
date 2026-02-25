interface PaginationProps {
    first: number
    rows: number
    totalRecords: number
    rowsPerPageOptions?: number[]
    onPageChange: (event: { first: number; rows: number }) => void
}

export default function Pagination({
    first,
    rows,
    totalRecords,
    rowsPerPageOptions = [20, 30, 50],
    onPageChange,
}: PaginationProps) {
    const currentPage = Math.floor(first / rows) + 1
    const totalPages = Math.ceil(totalRecords / rows)
    const lastItem = Math.min(first + rows, totalRecords)

    return (
        <div className="flex flex-wrap items-center justify-center gap-4 py-6 px-4">
            {/* Prev */}
            <button
                onClick={() => onPageChange({ first: Math.max(0, first - rows), rows })}
                disabled={currentPage <= 1}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                    backgroundColor: 'var(--bg-header)',
                    color: 'var(--text-primary)',
                    border: '1px solid transparent',
                }}
            >
                ← Prev
            </button>

            {/* Info */}
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Showing {first + 1} to {lastItem} of {totalRecords}
            </span>

            {/* Next */}
            <button
                onClick={() =>
                    onPageChange({
                        first: Math.min(first + rows, (totalPages - 1) * rows),
                        rows,
                    })
                }
                disabled={currentPage >= totalPages}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                    backgroundColor: 'var(--bg-header)',
                    color: 'var(--text-primary)',
                    border: '1px solid transparent',
                }}
            >
                Next →
            </button>

            {/* Rows per page */}
            <select
                value={rows}
                onChange={(e) =>
                    onPageChange({ first: 0, rows: Number(e.target.value) })
                }
                className="px-3 py-2 rounded-lg text-sm cursor-pointer"
                style={{
                    backgroundColor: '#1e1c24',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--bg-header)',
                }}
            >
                {rowsPerPageOptions.map((opt) => (
                    <option key={opt} value={opt}>
                        {opt} / page
                    </option>
                ))}
            </select>
        </div>
    )
}
