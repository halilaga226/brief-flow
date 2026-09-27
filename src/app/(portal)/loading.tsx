export default function PortalLoading() {
  return (
    <div className="grid gap-4" aria-busy aria-live="polite">
      <div className="h-8 w-44 animate-pulse rounded-xl bg-muted" />
      <div className="h-4 w-72 max-w-full animate-pulse rounded-lg bg-muted/80" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl bg-muted/70" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-muted/60" />
    </div>
  )
}
