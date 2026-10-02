"use client"

import { setTaskColorAction } from "@/actions/tasks"
import { useActionResult } from "@/components/portal/use-action-result"
import { DeleteTaskButton } from "@/components/portal/task-lifecycle-buttons"
import { StatusBadge } from "@/components/portal/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { TaskCardDTO } from "@/lib/dto"
import { cn } from "@/lib/utils"
import {
  matchesDueWindow,
  matchesQuery,
  type DueWindow,
} from "@/lib/workflow"
import { UserPlus } from "lucide-react"
import Link from "next/link"
import { useActionState, useMemo, useState } from "react"

const COLORS = [
  { id: "auto", label: "Oto" },
  { id: "blue", label: "Mavi" },
  { id: "orange", label: "Turuncu" },
  { id: "red", label: "Kırmızı" },
  { id: "green", label: "Yeşil" },
  { id: "pink", label: "Pembe" },
] as const

const DUE_CHIPS: { id: DueWindow | "all" | "gecikmis"; label: string }[] = [
  { id: "all", label: "Tümü" },
  { id: "gecikmis", label: "Gecikmiş" },
  { id: "1g", label: "1g" },
  { id: "3g", label: "3g" },
  { id: "1h", label: "1h" },
  { id: "1ay", label: "1ay" },
]

type Scope = "all" | "mine" | "given"

function rowTone(task: TaskCardDTO) {
  if (task.listColor === "red") return "bg-[#ff3b30]/15"
  if (task.listColor === "orange") return "bg-[#ff9f0a]/15"
  if (task.listColor === "green") return "bg-[#34c759]/15"
  if (task.listColor === "blue") return "bg-[#007aff]/12"
  if (task.listColor === "pink") return "bg-[#ff2d55]/15"
  if (task.status === "TAMAMLANDI") return "bg-[#34c759]/12"
  if (task.dueTone === "overdue") return "bg-[#ff3b30]/15"
  if (task.dueTone === "today" || task.dueTone === "soon") return "bg-[#ff9f0a]/12"
  return "bg-transparent"
}

function ColorPicker({ taskId, value }: { taskId: string; value: string | null }) {
  const [state, action, pending] = useActionState(setTaskColorAction, null)
  useActionResult(state)
  return (
    <form action={action}>
      <input type="hidden" name="taskId" value={taskId} />
      <select
        name="listColor"
        defaultValue={value ?? "auto"}
        disabled={pending}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="h-8 w-full max-w-[5.5rem] rounded border border-border bg-background px-1 text-[11px] font-medium"
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

/** Classic list row — CSS grid, never sticky header */
const COL =
  "grid grid-cols-1 gap-2 border-b border-border px-3 py-3 md:grid-cols-[minmax(10rem,1.6fr)_minmax(6rem,0.9fr)_5.5rem_minmax(5rem,0.7fr)_minmax(5rem,0.7fr)_6.5rem_auto_4.5rem_auto] md:items-center md:gap-2 md:py-2.5"

export function TaskWorkList({
  tasks,
  canAssign,
  userId,
  mode = "all",
  /** true: renk/sil/ata yalnızca kendi atadığın satırlarda */
  actOnlyOwnAssignments = false,
}: {
  tasks: TaskCardDTO[]
  canAssign: boolean
  userId: string
  mode?: "all" | "given" | "unified"
  actOnlyOwnAssignments?: boolean
}) {
  const [query, setQuery] = useState("")
  const [due, setDue] = useState<(typeof DUE_CHIPS)[number]["id"]>("all")
  const [scope, setScope] = useState<Scope>(mode === "given" ? "given" : "all")
  const [hideDone, setHideDone] = useState(true)
  const lockedGiven = mode === "given"
  const unified = mode === "unified"

  const filtered = useMemo(() => {
    return tasks.filter((task) => {
      if (hideDone && task.status === "TAMAMLANDI") return false
      if (!lockedGiven && !unified) {
        if (scope === "mine" && task.assigneeId !== userId) return false
        if (scope === "given" && task.assignerId !== userId) return false
      }
      if (!matchesQuery(task, query)) return false
      if (due === "all") return true
      if (due === "gecikmis") return task.dueTone === "overdue" && task.status !== "TAMAMLANDI"
      return matchesDueWindow(task, due)
    })
  }, [tasks, hideDone, lockedGiven, unified, scope, userId, query, due])

  function canAct(task: TaskCardDTO) {
    if (!actOnlyOwnAssignments) return true
    return task.assignerId === userId
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        {!lockedGiven && !unified ? (
          <div className="flex flex-wrap gap-1">
            {(
              [
                { id: "all" as const, label: "Hepsi" },
                { id: "mine" as const, label: "Bana gelen" },
                { id: "given" as const, label: "Verdiğim" },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setScope(item.id)}
                className={cn(
                  "rounded px-2.5 py-1 text-xs font-bold",
                  scope === item.id
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => setHideDone((v) => !v)}
          className={cn(
            "rounded px-2.5 py-1 text-xs font-bold",
            hideDone ? "text-muted-foreground hover:text-foreground" : "bg-foreground text-background",
          )}
        >
          {hideDone ? "Tamamlanan +" : "Tamamlanan −"}
        </button>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ara…"
          className="h-8 max-w-xs"
        />
        <div className="flex flex-wrap gap-1">
          {DUE_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setDue(chip.id)}
              className={cn(
                "rounded px-2 py-1 text-xs font-bold",
                due === chip.id
                  ? chip.id === "gecikmis"
                    ? "bg-[#ff3b30] text-white"
                    : "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
        <span className="text-xs font-semibold text-muted-foreground tabular-nums sm:ml-auto">
          {filtered.length}/{tasks.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          Kayıt yok
        </p>
      ) : (
        <div className="rounded-lg border border-border bg-card">
          {/* Header: normal flow only — never sticky */}
          <div
            className={cn(
              COL,
              "hidden bg-muted/50 text-[10px] font-bold tracking-wide text-muted-foreground uppercase md:grid",
            )}
            aria-hidden
          >
            <span>İş</span>
            <span>Müvekkil</span>
            <span>Dosya</span>
            <span>Veren</span>
            <span>Yürüten</span>
            <span>Son gün</span>
            <span>Durum</span>
            <span>Renk</span>
            <span />
          </div>

          <ul>
            {filtered.map((task) => (
              <li key={task.id} className={cn(COL, rowTone(task))}>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase md:hidden">İş</p>
                  <Link
                    href={`/gorevler/${task.id}`}
                    className="line-clamp-2 text-sm font-bold leading-snug hover:underline"
                  >
                    {task.title}
                  </Link>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase md:hidden">
                    Müvekkil
                  </p>
                  <p className="truncate text-sm font-semibold">{task.clientName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase md:hidden">
                    Dosya
                  </p>
                  <p className="font-mono text-xs">{task.fileNumber}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase md:hidden">
                    Veren
                  </p>
                  <p className="truncate text-sm text-muted-foreground">{task.assignerName}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase md:hidden">
                    Yürüten
                  </p>
                  <p className="truncate text-sm text-muted-foreground">{task.assigneeName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase md:hidden">
                    Son gün
                  </p>
                  <p
                    className={cn(
                      "text-sm font-bold",
                      task.dueTone === "overdue" && "text-[#ff3b30]",
                      (task.dueTone === "soon" || task.dueTone === "today") &&
                        "text-[#c2410c] dark:text-[#ff9f0a]",
                      task.status === "TAMAMLANDI" && "text-[#15803d] dark:text-[#34c759]",
                    )}
                  >
                    {task.dueLabel}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase md:hidden">
                    Durum
                  </p>
                  <StatusBadge status={task.status} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase md:hidden">
                    Renk
                  </p>
                  {canAct(task) ? (
                    <ColorPicker taskId={task.id} value={task.listColor} />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
                <div className="flex items-center gap-1 md:justify-end">
                  {canAssign && canAct(task) ? (
                    <Button asChild size="sm" variant="ghost" className="h-8 px-2 font-semibold">
                      <Link href={`/gorevler/yeni?from=${task.id}`}>
                        <UserPlus className="size-3.5" />
                        Ata
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild size="sm" variant="ghost" className="h-8 px-2 font-semibold">
                      <Link href={`/gorevler/${task.id}`}>Aç</Link>
                    </Button>
                  )}
                  {canAct(task) && task.canDelete ? (
                    <DeleteTaskButton
                      taskId={task.id}
                      completed={task.status === "TAMAMLANDI"}
                      compact
                    />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
