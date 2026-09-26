import { STATUS_META, type TaskStatus } from "@/lib/workflow"
import { cn } from "@/lib/utils"

const tones: Record<TaskStatus, string> = {
  ATANDI: "bg-blue-500/15 text-blue-700 ring-blue-500/30 dark:text-blue-300",
  INCELEME_BEKLIYOR: "bg-violet-500/15 text-violet-700 ring-violet-500/30 dark:text-violet-300",
  REVIZE_ISTENDI: "bg-orange-500/15 text-orange-700 ring-orange-500/30 dark:text-orange-300",
  ONAYLANDI: "bg-amber-500/15 text-amber-800 ring-amber-500/30 dark:text-amber-300",
  GONDERIM_BEKLIYOR: "bg-sky-500/15 text-sky-700 ring-sky-500/30 dark:text-sky-300",
  TAMAMLANDI: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300",
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ring-1",
        tones[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {STATUS_META[status].label}
    </span>
  )
}
