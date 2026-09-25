export default function PanelLoading() {
  return (
    <div className="grid gap-4">
      <div className="h-8 w-40 animate-pulse rounded-md bg-[#e7e1d4]" />
      <div className="h-4 w-72 animate-pulse rounded-md bg-[#e7e1d4]" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-xl bg-[#e7e1d4]" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-[#e7e1d4]" />
    </div>
  )
}
