"use client"

import {
  restoreCaseFileAction,
  restoreClientAction,
  restoreTaskAction,
} from "@/actions/clients"
import { restoreAllDeletedAction } from "@/actions/tasks"
import { useActionResult } from "@/components/portal/use-action-result"
import { Button } from "@/components/ui/button"
import type { ActionState } from "@/lib/dto"
import { formatDateTime } from "@/lib/format"
import { RotateCcw } from "lucide-react"
import { useActionState } from "react"

type DeletedBundle = {
  clients: { id: string; name: string; deletedAt: string }[]
  files: {
    id: string
    fileNumber: string
    clientId: string
    clientName: string
    deletedAt: string
  }[]
  tasks: {
    id: string
    title: string
    clientName: string
    fileNumber: string
    deletedAt: string
  }[]
}

type RestoreAction = (
  prev: ActionState,
  formData: FormData,
) => Promise<ActionState>

function RestoreRow({
  action,
  hidden,
  label,
  meta,
}: {
  action: RestoreAction
  hidden: { name: string; value: string }
  label: string
  meta: string
}) {
  const [state, formAction, pending] = useActionState(action, null)
  useActionResult(state)
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{meta}</p>
        {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      </div>
      <form action={formAction}>
        <input type="hidden" name={hidden.name} value={hidden.value} />
        <Button type="submit" disabled={pending} variant="outline" className="font-semibold">
          <RotateCcw />
          {pending ? "…" : "Geri yükle"}
        </Button>
      </form>
    </li>
  )
}

function RestoreAllButton() {
  const [state, action, pending] = useActionState(restoreAllDeletedAction, null)
  useActionResult(state)
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm("Silinenlerdeki tüm müvekkil, dosya ve işler geri yüklensin mi?")) {
          event.preventDefault()
        }
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <Button type="submit" disabled={pending} className="font-semibold">
        <RotateCcw />
        {pending ? "Yükleniyor…" : "Tüm silinenleri geri getir"}
      </Button>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
    </form>
  )
}

export function TrashRestoreList({ items }: { items: DeletedBundle }) {
  const empty =
    items.clients.length === 0 && items.files.length === 0 && items.tasks.length === 0

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Silinenler</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Müvekkil, dosya ve işler burada tutulur. Tek tek veya toplu geri yükleyebilirsiniz.
          </p>
        </div>
        {!empty ? <RestoreAllButton /> : null}
      </div>

      {empty ? (
        <p className="border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          Silinen kayıt yok. Kalıcı silinenler için Ayarlar → veri yedeklerine bakın.
        </p>
      ) : null}

      {items.clients.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-base font-semibold">Müvekkiller</h2>
          <ul className="overflow-hidden rounded-lg border border-border">
            {items.clients.map((row) => (
              <RestoreRow
                key={row.id}
                action={restoreClientAction}
                hidden={{ name: "clientId", value: row.id }}
                label={row.name}
                meta={formatDateTime(row.deletedAt)}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {items.files.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-base font-semibold">Dosyalar</h2>
          <ul className="overflow-hidden rounded-lg border border-border">
            {items.files.map((row) => (
              <RestoreRow
                key={row.id}
                action={restoreCaseFileAction}
                hidden={{ name: "caseFileId", value: row.id }}
                label={row.fileNumber}
                meta={`${row.clientName} · ${formatDateTime(row.deletedAt)}`}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {items.tasks.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-base font-semibold">İşler</h2>
          <ul className="overflow-hidden rounded-lg border border-border">
            {items.tasks.map((row) => (
              <RestoreRow
                key={row.id}
                action={restoreTaskAction}
                hidden={{ name: "taskId", value: row.id }}
                label={row.title}
                meta={`${row.clientName} · ${row.fileNumber} · ${formatDateTime(row.deletedAt)}`}
              />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
