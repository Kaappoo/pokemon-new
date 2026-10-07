import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useHydrated } from '#/hooks/use-hydrated.ts'
import type { CardSummary } from '#/server/catalog/service.ts'

const MIN_TILE = 148
const GAP = 16
/** Card art is 63:88; the caption under it adds ~52px. */
const rowHeight = (tileWidth: number) => Math.round((tileWidth * 88) / 63 + 52 + GAP)
/** Server-rendered (and first hydrated) tiles before the virtual grid takes over. */
const STATIC_COUNT = 24

const gridClass = 'grid gap-4 grid-cols-[repeat(auto-fill,minmax(148px,1fr))]'

/**
 * A responsive, window-virtualized card grid. Big sets and search results
 * run into thousands of cards; only the rows on screen are mounted, and the
 * next page loads as the last rows scroll into view.
 */
export function CardGrid<C extends CardSummary>({
  cards,
  renderTile,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}: {
  cards: ReadonlyArray<C>
  renderTile: (card: C, index: number) => ReactNode
  hasMore?: boolean
  loadingMore?: boolean
  onLoadMore?: () => void
}) {
  const hydrated = useHydrated()

  // Server render and hydration: a plain CSS grid with the same column maths, so nothing jumps.
  if (!hydrated) {
    return <div className={gridClass}>{cards.slice(0, STATIC_COUNT).map(renderTile)}</div>
  }
  return (
    <VirtualGrid
      cards={cards}
      renderTile={renderTile}
      hasMore={hasMore}
      loadingMore={loadingMore}
      onLoadMore={onLoadMore}
    />
  )
}

function VirtualGrid<C extends CardSummary>({
  cards,
  renderTile,
  hasMore,
  loadingMore,
  onLoadMore,
}: {
  cards: ReadonlyArray<C>
  renderTile: (card: C, index: number) => ReactNode
  hasMore: boolean
  loadingMore: boolean
  onLoadMore?: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [offset, setOffset] = useState(0)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      setWidth(el.clientWidth)
      setOffset(el.getBoundingClientRect().top + window.scrollY)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const columns = Math.max(2, Math.floor((width + GAP) / (MIN_TILE + GAP)))
  const tileWidth = width ? (width - GAP * (columns - 1)) / columns : MIN_TILE
  const rows = Math.ceil(cards.length / columns)

  const virtualizer = useWindowVirtualizer({
    count: rows,
    estimateSize: () => rowHeight(tileWidth),
    overscan: 4,
    scrollMargin: offset,
  })
  const items = virtualizer.getVirtualItems()
  const lastRow = items.at(-1)?.index ?? 0

  useEffect(() => {
    if (hasMore && !loadingMore && rows > 0 && lastRow >= rows - 3) onLoadMore?.()
  }, [hasMore, loadingMore, lastRow, rows, onLoadMore])

  return (
    <div ref={ref} className="relative" style={{ height: width ? virtualizer.getTotalSize() : undefined }}>
      {width
        ? items.map((row) => (
            <div
              key={row.key}
              data-index={row.index}
              ref={virtualizer.measureElement}
              className="absolute inset-x-0 top-0 grid gap-4 pb-4"
              style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                transform: `translateY(${row.start - virtualizer.options.scrollMargin}px)`,
              }}
            >
              {cards
                .slice(row.index * columns, row.index * columns + columns)
                .map((card, i) => renderTile(card, row.index * columns + i))}
            </div>
          ))
        : null}
    </div>
  )
}
