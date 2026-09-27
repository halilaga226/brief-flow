"use client"

import { createWorkItemAction, deleteWorkItemAction } from "@/actions/work-items"
import { setTaskColorAction } from "@/actions/tasks"
import { useActionResult } from "@/components/portal/use-action-result"
import { DeleteTaskButton } from "@/components/portal/task-lifecycle-buttons"
import { StatusBadge } from "@/components/portal/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { TaskCardDTO } from "@/lib/dto"
import { cn } from "@/lib/utils"
import { matchesQuery } from "@/lib/workflow"
import type { WorkItemDTO } from "@/server/work-items"
import { Plus, Trash2, UserPlus } from "lucide-react"
import Link from "next/link"
import { useActionState, useMemo, useRef, useState } from "react"

/**
 * Sıfırdan iş listesi — sütun başlığı YOK.
 * Sadece alt alta satırlar.
 */

function ColorSelect({ taskId, value }: { taskId: string; value: string | null }) {
  const [state, action, pending] = useActionState(setTaskColorAction, null)
  useActionResult(state)
  return (
    <form action={action} className="inline">
      <input type="hidden" name="taskId" value={taskId} />
      <select
        name="listColor"
        defaultValue={value ?? "auto"}
        disabled={pending}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="h-8 rounded border border-border bg-background px-1.5 text-xs"
        aria-label="Renk"
      >
        <option value="auto">Oto</option>
        <option value="blue">Mavi</option>
        <option value="orange">Turuncu</option>
        <option value="red">Kırmızı</option>
        <option value="green">Yeşil</option>
        <option value="pink">Pembe</option>
      </select>
    </form>
  )
}

function tone(task: TaskCardDTO) {
  if (task.listColor === "red") return "border-l-[#ff3b30] bg-[#ff3b30]/10"
  if (task.listColor === "orange") return "border-l-[#ff9f0a] bg-[#ff9f0a]/10"
  if (task.listColor === "green") return "border-l-[#34c759] bg-[#34c759]/10"
  if (task.listColor === "blue") return "border-l-[#007aff] bg-[#007aff]/10"
  if (task.listColor === "pink") return "border-l-[#ff2d55] bg-[#ff2d55]/10"
  if (task.dueTone === "overdue") return "border-l-[#ff3b30] bg-[#ff3b30]/10"
  if (task.dueTone === "soon" || task.dueTone === "today") return "border-l-[#ff9f0a] bg-[#ff9f0a]/10"
  if (task.status === "TAMAMLANDI") return "border-l-[#34c759] bg-[#34c759]/10"
  return "border-l-border bg-card"
}

function TaskLine({
  task,
  canAssign,
}: {
  task: TaskCardDTO
  canAssign: boolean
}) {
  return (
    <li className={cn("border-l-4 border-b border-border px-3 py-3 last:border-b-0", tone(task))}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1">
          <Link
            href={`/gorevler/${task.id}`}
            className="block text-[15px] font-bold leading-snug text-foreground hover:underline"
          >
            {task.title}
          </Link>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground/80">{task.clientName}</span>
            <span className="mx-1.5">·</span>
            <span className="font-mono text-xs">{task.fileNumber}</span>
            <span className="mx-1.5">·</span>
            {task.assigneeName}
            <span className="mx-1.5">·</span>
            <span
              className={cn(
                "font-semibold",
                task.dueTone === "overdue" && "text-[#ff3b30]",
                (task.dueTone === "soon" || task.dueTone === "today") &&
                  "text-[#c2410c] dark:text-[#ff9f0a]",
              )}
            >
              {task.dueLabel}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={task.status} />
          <ColorSelect taskId={task.id} value={task.listColor} />
          {canAssign ? (
            <Button asChild size="sm" variant="outline" className="h-8 font-semibold">
              <Link href={`/gorevler/yeni?from=${task.id}`}>
                <UserPlus className="size-3.5" />
                Ata
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline" className="h-8 font-semibold">
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

function CreateForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [state, action, pending] = useActionState(createWorkItemAction, null)
  const ref = useRef<HTMLFormElement>(null)
  useActionResult(state, () => {
    ref.current?.reset()
    onClose()
  })
  if (!open) return null
  return (
    <form ref={ref} action={action} className="space-y-3 border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">Yeni kayıt</p>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Vazgeç
          </Button>
          <Button type="submit" size="sm" disabled={pending} className="font-semibold">
            {pending ? "…" : "Kaydet"}
          </Button>
        </div>
      </div>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1">
          <Label htmlFor="courtName">Mahkeme</Label>
          <Input id="courtName" name="courtName" required className="h-9" />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="fileNumber">Dosya no</Label>
          <Input id="fileNumber" name="fileNumber" required className="h-9" />
        </div>
        <div className="grid gap-1 sm:col-span-2">
          <Label htmlFor="workToDo">Yapılacaklar</Label>
          <Textarea id="workToDo" name="workToDo" required rows={2} />
        </div>
        <div className="grid gap-1 sm:col-span-2">
          <Label htmlFor="notes">Özel not</Label>
          <Textarea id="notes" name="notes" rows={2} />
        </div>
        <input type="hidden" name="clientName" value="" />
        <input type="hidden" name="opposingParty" value="" />
        <input type="hidden" name="courtFile" value="" />
      </div>
    </form>
  )
}

function FileDelete({ id }: { id: string }) {
  const [state, action, pending] = useActionState(deleteWorkItemAction, null)
  useActionResult(state)
  return (
    <form action={action}>
      <input type="hidden" name="workItemId" value={id} />
      <Button
        type="submit"
        variant="ghost"
        size="icon-sm"
        disabled={pending}
        aria-label="Sil"
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 />
      </Button>
    </form>
  )
}

export function IsListesiView({
  tasks,
  files,
  canAssign,
  canManageFiles,
  userId,
}: {
  tasks: TaskCardDTO[]
  files: WorkItemDTO[]
  canAssign: boolean
  canManageFiles: boolean
  userId: string
}) {
  const [q, setQ] = useState("")
  const [hideDone, setHideDone] = useState(true)
  const [formOpen, setFormOpen] = useState(false)

  const list = useMemo(() => {
    return tasks.filter((task) => {
      if (canAssign && task.assignerId !== userId) return false
      if (hideDone && task.status === "TAMAMLANDI") return false
      return matchesQuery(task, q)
    })
  }, [tasks, canAssign, userId, hideDone, q])

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">İş listesi</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {list.length} açık satır
          </p>
        </div>
        {canManageFiles ? (
          <Button
            type="button"
            className="font-semibold"
            onClick={() => setFormOpen(true)}
          >
            <Plus />
            İş ekle
          </Button>
        ) : null}
      </header>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ara…"
          className="h-9 sm:max-w-xs"
        />
        <button
          type="button"
          onClick={() => setHideDone((v) => !v)}
          className={cn(
            "self-start rounded px-2.5 py-1.5 text-xs font-bold",
            hideDone ? "text-muted-foreground" : "bg-foreground text-background",
          )}
        >
          {hideDone ? "Tamamlananları göster" : "Tamamlananları gizle"}
        </button>
      </div>

      {canManageFiles ? (
        <CreateForm open={formOpen} onClose={() => setFormOpen(false)} />
      ) : null}

      <section>
        <h2 className="mb-2 text-sm font-bold tracking-wide text-muted-foreground uppercase">
          Görevler
        </h2>
        {list.length === 0 ? (
          <p className="border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            Liste boş
          </p>
        ) : (
          <ul className="overflow-hidden rounded-lg border border-border">
            {list.map((task) => (
              <TaskLine key={task.id} task={task} canAssign={canAssign} />
            ))}
          </ul>
        )}
      </section>

      {canManageFiles ? (
        <section>
          <h2 className="mb-2 text-sm font-bold tracking-wide text-muted-foreground uppercase">
            Dosya kayıtları
          </h2>
          {files.length === 0 ? (
            <p className="border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
              Dosya kaydı yok — üstten İş ekle
            </p>
          ) : (
            <ul className="overflow-hidden rounded-lg border border-border">
              {files.map((item) => (
                <li
                  key={item.id}
                  className="border-b border-border bg-card px-3 py-3 last:border-b-0"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <Link
                        href={`/is-listesi/${item.id}`}
                        className="text-[15px] font-bold hover:underline"
                      >
                        {item.courtName}
                      </Link>
                      <p className="font-mono text-xs text-muted-foreground">{item.fileNumber}</p>
                      <p className="text-sm">{item.workToDo}</p>
                      {item.notes ? (
                        <p className="text-sm text-muted-foreground">{item.notes}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Button asChild size="sm" variant="outline" className="h-8 font-semibold">
                        <Link href={`/is-listesi/${item.id}`}>Aç</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="h-8 font-semibold">
                        <Link href={`/is-listesi/${item.id}/gorev`}>
                          <UserPlus className="size-3.5" />
                          Ata
                        </Link>
                      </Button>
                      <FileDelete id={item.id} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  )
}
