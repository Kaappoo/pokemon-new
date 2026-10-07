import { barX, defineChart } from '@tanstack/charts'
import { Chart } from '@tanstack/charts/react'
import { scaleBand } from '@tanstack/charts/scales/band'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { tooltip } from '@tanstack/charts/tooltip'
import { useMemo } from 'react'
import type { Tally } from '#/domain/binder.ts'

// Mirrors the --orange token (SVG paint can't read oklch vars everywhere).
const ORANGE = '#ff6a1a'

/**
 * Brief: "What kind of collector am I?" — one bar per energy type, longest
 * first, in the single accent colour. Types are categories, not series, so
 * they share a colour instead of getting a rainbow.
 */
export function TypeChart({ tallies }: { tallies: ReadonlyArray<Tally> }) {
  const definition = useMemo(() => {
    const labels = tallies.map((t) => t.label)
    return defineChart({
      marks: [barX([...tallies], { y: 'label', x: 'count', fill: ORANGE, inset: 2 })],
      scales: {
        y: { scale: () => scaleBand<string>().domain(labels).padding(0.25) },
        x: {
          scale: scaleLinear,
          nice: true,
          grid: true,
          // Copies are whole numbers; don't label fractional gridlines.
          axis: { label: 'Copies', ticks: { format: (v) => (Number.isInteger(v) ? String(v) : '') } },
        },
      },
      svgAnimation: true,
      tooltip,
    })
  }, [tallies])

  if (tallies.length === 0) {
    return <p className="py-10 text-center text-sm text-paper-dim">Add Pokémon to the binder and their types chart here.</p>
  }

  return (
    <div className="text-paper-dim [&_text]:fill-current">
      <Chart
        definition={definition}
        height={Math.max(160, tallies.length * 34 + 50)}
        initialWidth={560}
        ariaLabel="Copies owned per Pokémon type"
        ariaDescription="Horizontal bars, one per energy type, longest first."
      />
    </div>
  )
}
