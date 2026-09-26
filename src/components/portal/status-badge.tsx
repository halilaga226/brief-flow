import { STATUS_META, type TaskStatus } from "@/lib/workflow"
import { cn } from "@/lib/utils"

const tones: Record<TaskStatus, string> = {
  ATANDI: "bg-[#ffe3b8] text-[#7a3e00] ring-[#ffc878]",
  INCELEME_BEKLIYOR: "bg-[#d9f3ee] text-[#0f6b57] ring-[#9ed9cd]",
  REVIZE_ISTENDI: "bg-[#ffe0db] text-[#9b2c1f] ring-[#f5b0a6]",
  ONAYLANDI: "bg-[#fff1c9] text-[#7a3e00] ring-[#ffd56a]",
  GONDERIM_BEKLIYOR: "bg-[#e7f6f0] text-[#0f6b57] ring-[#9ed9cd]",
  TAMAMLANDI: "bg-[#0f6b57] text-white ring-[#0f6b57]",
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
