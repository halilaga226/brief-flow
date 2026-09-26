import { STATUS_META, type TaskStatus } from "@/lib/workflow"
import { cn } from "@/lib/utils"

const tones: Record<TaskStatus, string> = {
  ATANDI: "bg-amber-100 text-amber-950 ring-amber-200",
  INCELEME_BEKLIYOR: "bg-zinc-100 text-zinc-800 ring-zinc-200",
  REVIZE_ISTENDI: "bg-red-100 text-red-800 ring-red-200",
  ONAYLANDI: "bg-yellow-200 text-yellow-950 ring-yellow-300",
  GONDERIM_BEKLIYOR: "bg-amber-50 text-amber-900 ring-amber-200",
  TAMAMLANDI: "bg-yellow-300 text-yellow-950 ring-yellow-400",
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-bold ring-1",
        tones[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {STATUS_META[status].label}
    </span>
  )
}
