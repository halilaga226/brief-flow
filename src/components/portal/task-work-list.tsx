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
  { id: "1g", label: "1 gün" },
  { id: "3g", label: "3 gün" },
  { id: "1h", label: "1 hafta" },
  { id: "1ay", label: "1 ay" },
]

type Scope = "all" | "mine" | "given"

function accentBar(task: TaskCardDTO) {
  if (task.listColor === "red") return "border-l-[#ff3b30]"
  if (task.listColor === "orange") return "border-l-[#ff9f0a]"
  if (task.listColor === "green") return "border-l-[#34c759]"
  if (task.listColor === "blue") return "border-l-[#007aff]"
  if (task.listColor === "pink") return "border-l-[#ff2d55]"
  if (task.status === "TAMAMLANDI" || task.dueTone === "done") return "border-l-[#34c759]"
  if (task.dueTone === "overdue") return "border-l-[#ff3b30]"
  if (task.dueTone === "today" || task.dueTone === "soon") return "border-l-[#ff9f0a]"
  return "border-l-primary/50"
}

function ColorPicker({ taskId, value }: { taskId: string; value: string | null }) {
  const [state, action, pending] = useActionState(setTaskColorAction, null)
  useActionResult(state)
  return (
    <form action={action} className="shrink-0">
      <input type="hidden" name="taskId" value={taskId} />
      <select
        name="listColor"
        defaultValue={value ?? "auto"}
        disabled={pending}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="h-9 rounded-lg border border-border bg-background px-2 text-xs font-medium"
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

function TaskRow({
  task,
  canAssign,
}: {
  task: TaskCardDTO
  canAssign: boolean
}) {
  return (
    <li
      className={cn(
        "rounded-xl border border-border bg-card shadow-sm border-l-4",
        accentBar(task),
      )}
    >
      <div className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-start gap-2">
            <Link
              href={`/gorevler/${task.id}`}
              className="min-w-0 flex-1 text-base font-bold leading-snug text-foreground hover:underline"
            >
              {task.title}
            </Link>
            <StatusBadge status={task.status} />
          </div>

          <p className="text-sm font-semibold text-foreground">
            {task.clientName}
            <span className="mx-1.5 text-muted-foreground">·</span>
            <span className="font-mono text-xs font-medium text-muted-foreground">
              {task.fileNumber}
            </span>
          </p>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>
              <span className="font-medium text-foreground/70">Veren:</span> {task.assignerName}
            </span>
            <span>
              <span className="font-medium text-foreground/70">Yürüten:</span> {task.assigneeName}
            </span>
            <span
              className={cn(
                "font-semibold",
                task.dueTone === "overdue" && "text-[#ff3b30]",
                (task.dueTone === "soon" || task.dueTone === "today") && "text-[#c2410c] dark:text-[#ff9f0a]",
                (task.dueTone === "done" || task.status === "TAMAMLANDI") && "text-[#15803d] dark:text-[#34c759]",
              )}
            >
              Son gün: {task.dueLabel}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <ColorPicker taskId={task.id} value={task.listColor} />
          {canAssign ? (
            <Button asChild size="sm" variant="outline" className="h-9 font-semibold">
              <Link href={`/gorevler/yeni?from=${task.id}`}>
                <UserPlus className="size-3.5" />
                Ata
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline" className="h-9 font-semibold">
              <Link href={`/gorevler/${task.id}`}>Aç</Link>
            </Button>
          )}
          {task.canDelete ? (
            <DeleteTaskButton
              taskId={task.id}
              completed={task.status === "TAMAMLANDI"}
              compact
            />
          ) : null}
        </div>
      </div>
    </li>
  )
}

export function TaskWorkList({
  tasks,
  canAssign,
  userId,
  mode = "all",
}: {
  tasks: TaskCardDTO[]
  canAssign: boolean
  userId: string
  mode?: "all" | "given"
}) {
  const [query, setQuery] = useState("")
  const [due, setDue] = useState<(typeof DUE_CHIPS)[number]["id"]>("all")
  const [scope, setScope] = useState<Scope>(mode === "given" ? "given" : "all")
  const [hideDone, setHideDone] = useState(true)
  const lockedGiven = mode === "given"

  const workload = useMemo(() => {
    const map = new Map<string, { name: string; open: number; overdue: number }>()
    for (const task of tasks) {
      if (task.status === "TAMAMLANDI") continue
      const key = task.assigneeId
      const row = map.get(key) ?? { name: task.assigneeName, open: 0, overdue: 0 }
      row.open += 1
      if (task.dueTone === "overdue") row.overdue += 1
      map.set(key, row)
    }
    return [...map.values()].sort((a, b) => b.open - a.open || a.name.localeCompare(b.name, "tr"))
  }, [tasks])

  const filtered = useMemo(() => {
    return tasks.filter((task) => {
      if (hideDone && task.status === "TAMAMLANDI") return false
      if (!lockedGiven) {
        if (scope === "mine" && task.assigneeId !== userId) return false
        if (scope === "given" && task.assignerId !== userId) return false
      }
      if (!matchesQuery(task, query)) return false
      if (due === "all") return true
      if (due === "gecikmis") return task.dueTone === "overdue" && task.status !== "TAMAMLANDI"
      return matchesDueWindow(task, due)
    })
  }, [tasks, hideDone, lockedGiven, scope, userId, query, due])

  return (
    <div className="grid gap-4">
      {workload.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
            İş yükü
          </span>
          {workload.map((person) => (
            <span key={person.name} className="inline-flex items-center gap-1.5 font-semibold">
              <span>{person.name}</span>
              <span className="tabular-nums text-primary">{person.open}</span>
              {person.overdue > 0 ? (
                <span className="tabular-nums text-[#ff3b30]">· {person.overdue} gecikmiş</span>
              ) : null}
            </span>
          ))}
        </div>
      ) : null}

      <div className="grid gap-2">
        <div className="flex flex-wrap gap-1.5">
          {!lockedGiven
            ? (
                [
                  { id: "all" as const, label: "Hepsi" },
                  { id: "mine" as const, label: "Bana gelen" },
                  { id: "given" as const, label: "Benim verdiğim" },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setScope(item.id)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                    scope === item.id
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {item.label}
                </button>
              ))
            : null}
          <button
            type="button"
            onClick={() => setHideDone((value) => !value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-bold transition",
              hideDone
                ? "text-muted-foreground hover:bg-muted hover:text-foreground"
                : "bg-foreground text-background",
            )}
          >
            {hideDone ? "Tamamlananları göster" : "Tamamlananları gizle"}
          </button>
          <span className="ml-auto self-center text-xs font-semibold text-muted-foreground tabular-nums">
            {filtered.length} / {tasks.length}
          </span>
        </div>

        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ara…"
          className="h-9 w-full max-w-md bg-background"
        />

        <div className="flex flex-wrap gap-1.5">
          {DUE_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setDue(chip.id)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-bold transition",
                due === chip.id
                  ? chip.id === "gecikmis"
                    ? "bg-[#ff3b30] text-white"
                    : "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 px-4 py-12 text-center text-base text-muted-foreground">
          {tasks.length === 0
            ? lockedGiven
              ? "Henüz verdiğiniz görev yok. «Görev olarak ata» ile ekleyin."
              : "Kayıt yok"
            : "Filtreye uyan kayıt yok — filtreleri sıfırlayın."}
        </div>
      ) : (
        <ul className="grid gap-3">
          {filtered.map((task) => (
            <TaskRow key={task.id} task={task} canAssign={canAssign} />
          ))}
        </ul>
      )}
    </div>
  )
}
