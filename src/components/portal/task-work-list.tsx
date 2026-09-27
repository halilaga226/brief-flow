"use client"

import { setTaskColorAction } from "@/actions/tasks"
import { useActionResult } from "@/components/portal/use-action-result"
import { StatusBadge } from "@/components/portal/status-badge"
import { Button } from "@/components/ui/button"
import type { TaskCardDTO } from "@/lib/dto"
import { cn } from "@/lib/utils"
import { UserPlus } from "lucide-react"
import Link from "next/link"
import { useActionState } from "react"

const COLORS = [
  { id: "auto", label: "Otomatik", swatch: "bg-gradient-to-r from-blue-400 via-orange-400 to-red-400" },
  { id: "blue", label: "Mavi", swatch: "bg-[#007aff]" },
  { id: "orange", label: "Turuncu", swatch: "bg-[#ff9f0a]" },
  { id: "red", label: "Kırmızı", swatch: "bg-[#ff3b30]" },
  { id: "green", label: "Yeşil", swatch: "bg-[#34c759]" },
  { id: "pink", label: "Pembe", swatch: "bg-[#ff2d55]" },
] as const

function rowTone(task: TaskCardDTO) {
  if (task.listColor === "red") return "border-l-[#ff3b30] bg-[#ff3b30]/10"
  if (task.listColor === "orange") return "border-l-[#ff9f0a] bg-[#ff9f0a]/10"
  if (task.listColor === "green") return "border-l-[#34c759] bg-[#34c759]/10"
  if (task.listColor === "blue") return "border-l-[#007aff] bg-[#007aff]/10"
  if (task.listColor === "pink") return "border-l-[#ff2d55] bg-[#ff2d55]/12"
  if (task.status === "TAMAMLANDI" || task.dueTone === "done") {
    return "border-l-[#34c759] bg-[#34c759]/10"
  }
  if (task.dueTone === "overdue") return "border-l-[#ff3b30] bg-[#ff3b30]/10"
  if (task.dueTone === "today" || task.dueTone === "soon") {
    return "border-l-[#ff9f0a] bg-[#ff9f0a]/10"
  }
  return "border-l-[#007aff]/70 bg-white/40 dark:bg-white/5"
}

function ColorPicker({ taskId, value }: { taskId: string; value: string | null }) {
  const [state, action, pending] = useActionState(setTaskColorAction, null)
  useActionResult(state)
  return (
    <form action={action} className="flex items-center gap-1">
      <input type="hidden" name="taskId" value={taskId} />
      <select
        name="listColor"
        defaultValue={value ?? "auto"}
        disabled={pending}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="h-8 rounded-lg border border-border bg-white/50 px-2 text-xs backdrop-blur dark:bg-black/30"
        aria-label="Renk"
      >
        {COLORS.map((color) => (
          <option key={color.id} value={color.id}>
            {color.label}
          </option>
        ))}
      </select>
    </form>
  )
}

export function TaskWorkList({
  tasks,
  canAssign,
}: {
  tasks: TaskCardDTO[]
  canAssign: boolean
}) {
  return (
    <section className="glass overflow-hidden rounded-[1.4rem]">
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
        <h2 className="text-xl font-bold tracking-tight">İş listesi</h2>
        <p className="text-sm font-semibold text-muted-foreground">{tasks.length}</p>
      </div>

      {tasks.length === 0 ? (
        <p className="px-4 py-14 text-center text-base text-muted-foreground">Kayıt yok</p>
      ) : (
        <ul className="divide-y divide-border/60">
          {tasks.map((task) => (
            <li
              key={task.id}
              className={cn(
                "grid gap-3 border-l-4 px-4 py-4 transition md:grid-cols-[minmax(0,1fr)_auto] md:items-center",
                rowTone(task),
              )}
            >
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/gorevler/${task.id}`} className="text-lg font-bold tracking-tight hover:underline">
                    {task.title}
                  </Link>
                  <StatusBadge status={task.status} />
                </div>
                <p className="text-sm font-semibold text-foreground/85">
                  {task.clientName}
                  <span className="mx-1.5 text-muted-foreground">·</span>
                  <span className="font-mono text-xs">{task.fileNumber}</span>
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-muted-foreground">
                  <span>Veren: {task.assignerName}</span>
                  <span>Yürüten: {task.assigneeName}</span>
                  <span
                    className={cn(
                      "font-bold",
                      task.dueTone === "overdue" && "text-[#ff3b30]",
                      (task.dueTone === "soon" || task.dueTone === "today") && "text-[#ff9f0a]",
                      (task.dueTone === "done" || task.status === "TAMAMLANDI") && "text-[#34c759]",
                    )}
                  >
                    Son gün: {task.dueLabel}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                <ColorPicker taskId={task.id} value={task.listColor} />
                {canAssign ? (
                  <Button asChild size="sm" className="font-bold">
                    <Link href={`/gorevler/yeni?from=${task.id}`}>
                      <UserPlus />
                      Görev olarak ata
                    </Link>
                  </Button>
                ) : (
                  <Button asChild size="sm" variant="secondary" className="font-bold">
                    <Link href={`/gorevler/${task.id}`}>Aç</Link>
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
