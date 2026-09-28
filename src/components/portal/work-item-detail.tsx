"use client"

import { addWorkItemEntryAction } from "@/actions/work-items"
import { useActionResult } from "@/components/portal/use-action-result"
import { StatusBadge } from "@/components/portal/status-badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { WorkItemDetailDTO } from "@/server/work-items"
import type { TaskStatus } from "@/lib/workflow"
import { formatDateTime } from "@/lib/format"
import { Plus, UserPlus } from "lucide-react"
import Link from "next/link"
import { useActionState, useRef } from "react"

function AddEntryForm({ workItemId }: { workItemId: string }) {
  const [state, action, pending] = useActionState(addWorkItemEntryAction, null)
  const formRef = useRef<HTMLFormElement>(null)
  useActionResult(state, () => formRef.current?.reset())

  return (
    <form ref={formRef} action={action} className="grid gap-3 border-b border-border/50 pb-4">
      <input type="hidden" name="workItemId" value={workItemId} />
      <Textarea
        name="content"
        required
        rows={2}
        placeholder="Yapılanı yazın…"
        className="min-h-[4rem]"
      />
      {state?.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending} className="font-semibold">
          <Plus />
          {pending ? "…" : "Yapılanlara ekle"}
        </Button>
      </div>
    </form>
  )
}

export function WorkItemDetail({
  item,
  canAssign = false,
}: {
  item: WorkItemDetailDTO
  canAssign?: boolean
}) {
  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <div>
        <Link href="/is-listesi" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          İş listesine dön
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{item.courtName}</h1>
        <p className="mt-1 font-mono text-sm text-muted-foreground">{item.fileNumber}</p>
        {item.ownerRole === "INTERN" ? (
          <p className="mt-1 text-sm text-muted-foreground">Stajyer · {item.ownerName}</p>
        ) : null}
      </div>

      <section className="grid gap-2 border-y border-border/50 py-4">
        <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">Yapılacaklar</p>
        <p className="text-base font-medium leading-relaxed whitespace-pre-wrap">{item.workToDo}</p>
        {item.notes ? (
          <>
            <p className="mt-3 text-xs font-bold tracking-wide text-muted-foreground uppercase">Özel not</p>
            <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {item.notes}
            </p>
          </>
        ) : null}
        {canAssign ? (
          <div className="mt-3">
            <Button asChild className="font-semibold">
              <Link href={`/is-listesi/${item.id}/gorev`}>
                <UserPlus />
                Görev olarak ata
              </Link>
            </Button>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4">
        <h2 className="text-xl font-semibold tracking-tight">Yapılanlar</h2>
        <AddEntryForm workItemId={item.id} />
        {item.entries.length === 0 && item.tasks.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">Henüz yapılan yok.</p>
        ) : (
          <ul className="divide-y divide-border/50 border-y border-border/50">
            {item.entries.map((entry) => (
              <li key={entry.id} className="py-3">
                <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {entry.createdByName} · {formatDateTime(entry.createdAt)}
                </p>
              </li>
            ))}
            {item.tasks.map((task) => (
              <li key={task.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div className="min-w-0">
                  <Link href={`/gorevler/${task.id}`} className="font-semibold hover:underline">
                    {task.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {task.assigneeName} · {task.dueLabel}
                    {task.completedAt ? " · tamamlandı" : ""}
                  </p>
                </div>
                <StatusBadge status={task.status as TaskStatus} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
