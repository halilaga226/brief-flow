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
import { useMemo, useState, useActionState } from "react"

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

function rowFill(task: TaskCardDTO) {
  if (task.listColor === "red") return "bg-[#ff3b30]/28"
  if (task.listColor === "orange") return "bg-[#ff9f0a]/28"
  if (task.listColor === "green") return "bg-[#34c759]/28"
  if (task.listColor === "blue") return "bg-[#007aff]/25"
  if (task.listColor === "pink") return "bg-[#ff2d55]/28"
  if (task.status === "TAMAMLANDI" || task.dueTone === "done") return "bg-[#34c759]/22"
  if (task.dueTone === "overdue") return "bg-[#ff3b30]/28"
  if (task.dueTone === "today" || task.dueTone === "soon") return "bg-[#ff9f0a]/25"
  return "odd:bg-black/[0.02] dark:odd:bg-white/[0.03]"
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
        className="h-7 max-w-[5.5rem] rounded border border-border/70 bg-background/80 px-1.5 text-[11px] font-medium"
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
  userId,
  mode = "all",
}: {
  tasks: TaskCardDTO[]
  canAssign: boolean
  userId: string
  /** given: only assigned-by-me list — hide scope chips that empty the table */
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
        <div className="flex flex-wrap items-center gap-2 border-b border-border/50 pb-3">
          <span className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
            İş yükü
          </span>
          {workload.map((person) => (
            <span
              key={person.name}
              className="inline-flex items-center gap-1.5 text-sm font-semibold"
            >
              <span>{person.name}</span>
              <span className="tabular-nums text-primary">{person.open}</span>
              {person.overdue > 0 ? (
                <span className="tabular-nums text-[#ff3b30]">· {person.overdue} gecikmiş</span>
              ) : null}
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
                    "px-2.5 py-1 text-xs font-bold transition",
                    scope === item.id
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground",
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
              "px-2.5 py-1 text-xs font-bold transition",
              !lockedGiven && "ml-1",
              hideDone ? "text-muted-foreground hover:text-foreground" : "bg-foreground text-background",
            )}
          >
            {hideDone ? "Tamamlananları göster" : "Tamamlananları gizle"}
          </button>
        </div>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Müvekkil, dosya, iş, kişi ara…"
          className="h-9 max-w-sm border-border/70 bg-transparent"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {DUE_CHIPS.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => setDue(chip.id)}
            className={cn(
              "px-2.5 py-1 text-xs font-bold transition",
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
        <span className="ml-auto self-center text-xs font-semibold text-muted-foreground tabular-nums">
          {filtered.length} / {tasks.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="border-y border-border/50 py-10 text-center text-base text-muted-foreground">
          {tasks.length === 0
            ? lockedGiven
              ? "Henüz verdiğiniz görev yok. Soldan «Görev olarak ata» ile ekleyin."
              : "Kayıt yok"
            : "Filtreye uyan kayıt yok"}
        </p>
      ) : (
        <div className="-mx-3 overflow-x-auto sm:-mx-4 md:mx-0">
          <table className="w-full min-w-[54rem] border-collapse text-left text-sm">
            <thead className="sticky top-14 z-10 bg-background">
              <tr className="border-y border-border text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                <th className="px-2 py-1.5 font-bold">İş</th>
                <th className="px-2 py-1.5 font-bold">Müvekkil</th>
                <th className="px-2 py-1.5 font-bold">Dosya</th>
                <th className="px-2 py-1.5 font-bold">Veren</th>
                <th className="px-2 py-1.5 font-bold">Yürüten</th>
                <th className="px-2 py-1.5 font-bold">Son gün</th>
                <th className="px-2 py-1.5 font-bold">Durum</th>
                <th className="px-2 py-1.5 font-bold">Renk</th>
                <th className="px-2 py-1.5 font-bold" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((task) => (
                <tr
                  key={task.id}
                  className={cn("border-b border-border/35", rowFill(task))}
                >
                  <td className="max-w-[14rem] px-2 py-1.5 align-middle">
                    <Link
                      href={`/gorevler/${task.id}`}
                      className="line-clamp-1 font-bold leading-snug hover:underline"
                    >
                      {task.title}
                    </Link>
                  </td>
                  <td className="max-w-[9rem] truncate px-2 py-1.5 font-semibold">{task.clientName}</td>
                  <td className="px-2 py-1.5 font-mono text-xs font-medium">{task.fileNumber}</td>
                  <td className="max-w-[8rem] truncate px-2 py-1.5 font-medium text-muted-foreground">
                    {task.assignerName}
                  </td>
                  <td className="max-w-[8rem] truncate px-2 py-1.5 font-medium text-muted-foreground">
                    {task.assigneeName}
                  </td>
                  <td
                    className={cn(
                      "whitespace-nowrap px-2 py-1.5 font-bold",
                      task.dueTone === "overdue" && "text-[#ff3b30]",
                      (task.dueTone === "soon" || task.dueTone === "today") && "text-[#9a3412]",
                      (task.dueTone === "done" || task.status === "TAMAMLANDI") && "text-[#15803d]",
                    )}
                  >
                    {task.dueLabel}
                  </td>
                  <td className="px-2 py-1.5">
                    <StatusBadge status={task.status} />
                  </td>
                  <td className="px-2 py-1.5">
                    <ColorPicker taskId={task.id} value={task.listColor} />
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      {canAssign ? (
                        <Button asChild size="sm" variant="ghost" className="h-7 px-2 font-semibold">
                          <Link href={`/gorevler/yeni?from=${task.id}`}>
                            <UserPlus className="size-3.5" />
                            Ata
                          </Link>
                        </Button>
                      ) : (
                        <Button asChild size="sm" variant="ghost" className="h-7 px-2 font-semibold">
                          <Link href={`/gorevler/${task.id}`}>Aç</Link>
                        </Button>
                      )}
                      {task.canDelete ? (
                        <DeleteTaskButton
                          taskId={task.id}
                          completed={task.status === "TAMAMLANDI"}
                        />
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
