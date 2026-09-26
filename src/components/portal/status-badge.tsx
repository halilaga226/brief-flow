import { STATUS_META, type TaskStatus } from "@/lib/workflow"
import { cn } from "@/lib/utils"

const tones: Record<TaskStatus, string> = {
  ATANDI: "bg-accent text-accent-foreground ring-[var(--brand-accent)]/40",
  INCELEME_BEKLIYOR: "bg-secondary text-secondary-foreground ring-primary/30",
  REVIZE_ISTENDI: "bg-destructive/15 text-destructive ring-destructive/30",
  ONAYLANDI: "bg-accent text-accent-foreground ring-[var(--brand-accent)]/40",
  GONDERIM_BEKLIYOR: "bg-primary/15 text-primary ring-primary/30",
  TAMAMLANDI: "bg-primary text-primary-foreground ring-primary",
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
