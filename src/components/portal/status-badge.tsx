import { STATUS_META, type TaskStatus } from "@/lib/workflow"
import { cn } from "@/lib/utils"

const tones: Record<TaskStatus, string> = {
  ATANDI: "bg-[#e7eef6] text-[#16324f] ring-[#c5d4e4]",
  INCELEME_BEKLIYOR: "bg-[#f3ead2] text-[#7a5b12] ring-[#e4d3a4]",
  REVIZE_ISTENDI: "bg-[#f8e6e1] text-[#8d3a2f] ring-[#ecc8bf]",
  GONDERIM_BEKLIYOR: "bg-[#e3f3ec] text-[#0f5c45] ring-[#bfe0d2]",
  TAMAMLANDI: "bg-[#eceae4] text-[#4d5560] ring-[#ddd8ce]",
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1",
        tones[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {STATUS_META[status].label}
    </span>
  )
}
