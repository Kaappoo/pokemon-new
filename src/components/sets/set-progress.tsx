import { cn } from '#/lib/utils.ts'

/** "Your progress 12/165" with the orange fill bar. Used on set headers and binder pages. */
export function SetProgress({
  owned,
  total,
  label = 'Your progress',
  ariaLabel = 'Cards collected from this set',
  className,
}: {
  owned: number
  total: number
  label?: string
  ariaLabel?: string
  className?: string
}) {
  const completion = total ? owned / total : 0
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-semibold text-paper-dim">{label}</span>
        <span className="font-numerals text-3xl leading-none">
          {owned}
          <span className="text-paper-dim">/{total}</span>
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-surface-raised"
        role="progressbar"
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={owned}
      >
        <div
          className="h-full rounded-full bg-orange transition-[width] duration-700 ease-out-expo"
          style={{ width: `${Math.round(completion * 100)}%` }}
        />
      </div>
    </div>
  )
}
