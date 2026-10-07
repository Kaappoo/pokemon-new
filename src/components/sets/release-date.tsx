/**
 * TCGdex release dates are calendar dates ("1999-01-09"), not instants, so
 * they are formatted in UTC with a fixed locale: identical on the server,
 * during hydration and in every timezone.
 */
export function ReleaseDate({ date, className }: { date: string | null; className?: string }) {
  if (!date) return <span className={className}>Date TBA</span>
  const parsed = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return <span className={className}>{date}</span>
  return (
    <time dateTime={date} className={className}>
      {parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
    </time>
  )
}
