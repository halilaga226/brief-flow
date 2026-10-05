"use client"

import {
  addWorkItemEntryAction,
  completeWorkItemAction,
  reopenWorkItemAction,
  updateWorkItemAction,
} from "@/actions/work-items"
import { useActionResult } from "@/components/portal/use-action-result"
import { StatusBadge } from "@/components/portal/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { WorkItemDetailDTO } from "@/server/work-items"
import type { ClientPickerDTO } from "@/server/clients"
import type { TaskStatus } from "@/lib/workflow"
import { formatDateTime } from "@/lib/format"
import { Check, Plus, RotateCcw, UserPlus } from "lucide-react"
import Link from "next/link"
import { useActionState, useMemo, useRef, useState } from "react"

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

function EditWorkItemForm({
  item,
  clients,
  onClose,
}: {
  item: WorkItemDetailDTO
  clients: ClientPickerDTO[]
  onClose: () => void
}) {
  const [state, action, pending] = useActionState(updateWorkItemAction, null)
  const [clientId, setClientId] = useState(item.clientId ?? "")
  const [caseFileId, setCaseFileId] = useState("")
  useActionResult(state, onClose)

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === clientId) ?? null,
    [clients, clientId],
  )
  const selectedFile = useMemo(
    () => selectedClient?.caseFiles.find((f) => f.id === caseFileId) ?? null,
    [selectedClient, caseFileId],
  )

  return (
    <form action={action} className="grid gap-3 rounded-xl border border-border bg-card p-4">
      <input type="hidden" name="workItemId" value={item.id} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">İşi düzenle</p>
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
        <div className="grid gap-1 sm:col-span-2">
          <Label htmlFor="edit-clientId">Müvekkil</Label>
          {clients.length > 0 ? (
            <>
              <select
                id="edit-clientId"
                name="clientId"
                value={clientId}
                onChange={(e) => {
                  setClientId(e.target.value)
                  setCaseFileId("")
                }}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                required
              >
                <option value="">Müvekkil seçin…</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              <input
                type="hidden"
                name="clientName"
                value={selectedClient?.name ?? item.clientName}
              />
            </>
          ) : (
            <Input
              id="edit-clientName"
              name="clientName"
              required
              className="h-9"
              defaultValue={item.clientName}
            />
          )}
        </div>
        {clients.length > 0 ? (
          <div className="grid gap-1 sm:col-span-2">
            <Label htmlFor="edit-caseFileId">Dosya (varsa)</Label>
            <select
              id="edit-caseFileId"
              value={caseFileId}
              onChange={(e) => setCaseFileId(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              disabled={!selectedClient}
            >
              <option value="">Dosya seçilmedi</option>
              {(selectedClient?.caseFiles ?? []).map((file) => (
                <option key={file.id} value={file.id}>
                  {file.fileNumber}
                  {file.courtName ? ` · ${file.courtName}` : ""}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div className="grid gap-1">
          <Label htmlFor="edit-courtName">Mahkeme</Label>
          <Input
            id="edit-courtName"
            name="courtName"
            required
            className="h-9"
            key={`court-${caseFileId || "x"}`}
            defaultValue={selectedFile?.courtName || item.courtName}
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="edit-fileNumber">Dosya no</Label>
          <Input
            id="edit-fileNumber"
            name="fileNumber"
            required
            className="h-9"
            key={`file-${caseFileId || "x"}`}
            defaultValue={selectedFile?.fileNumber || item.fileNumber}
          />
        </div>
        <div className="grid gap-1 sm:col-span-2">
          <Label htmlFor="edit-workToDo">Yapılacaklar</Label>
          <Textarea
            id="edit-workToDo"
            name="workToDo"
            required
            rows={2}
            defaultValue={item.workToDo}
          />
        </div>
        <div className="grid gap-1 sm:col-span-2">
          <Label htmlFor="edit-notes">Özel not</Label>
          <Textarea id="edit-notes" name="notes" rows={2} defaultValue={item.notes} />
        </div>
        <input type="hidden" name="opposingParty" value={item.opposingParty} />
        <input
          type="hidden"
          name="courtFile"
          value={selectedFile?.fileNumber || item.courtFile}
        />
      </div>
    </form>
  )
}

export function WorkItemDetail({
  item,
  canAssign = false,
  canEdit = false,
  clients = [],
}: {
  item: WorkItemDetailDTO
  canAssign?: boolean
  canEdit?: boolean
  clients?: ClientPickerDTO[]
}) {
  const [editing, setEditing] = useState(false)
  const [completeState, completeAction, completePending] = useActionState(
    item.completedAt ? reopenWorkItemAction : completeWorkItemAction,
    null,
  )
  useActionResult(completeState)
  const backHref =
    item.ownerRole === "INTERN" && !canEdit ? "/stajyer-isleri" : "/is-listesi"

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <div>
        <Link
          href={backHref}
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          {backHref === "/stajyer-isleri" ? "Stajyer işlerine dön" : "İş listesine dön"}
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{item.courtName}</h1>
        <p className="mt-1 font-mono text-sm text-muted-foreground">{item.fileNumber}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Müvekkil · {item.clientName}
          {item.ownerRole === "INTERN" ? ` · Stajyer · ${item.ownerName}` : null}
          {item.completedAt ? " · Tamamlandı" : null}
        </p>
      </div>

      <section className="grid gap-2 border-y border-border/50 py-4">
        <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
          Yapılacaklar
        </p>
        <p className="text-base font-medium leading-relaxed whitespace-pre-wrap">{item.workToDo}</p>
        {item.notes ? (
          <>
            <p className="mt-3 text-xs font-bold tracking-wide text-muted-foreground uppercase">
              Özel not
            </p>
            <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {item.notes}
            </p>
          </>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          {canEdit ? (
            <Button
              type="button"
              variant="outline"
              className="font-semibold"
              onClick={() => setEditing((v) => !v)}
            >
              {editing ? "Düzenlemeyi kapat" : "Düzenle / müvekkil"}
            </Button>
          ) : null}
          {canEdit ? (
            <form action={completeAction}>
              <input type="hidden" name="workItemId" value={item.id} />
              <Button type="submit" variant="outline" disabled={completePending} className="font-semibold">
                {item.completedAt ? <RotateCcw /> : <Check />}
                {item.completedAt ? "Yeniden aç" : "Kendim tamamladım"}
              </Button>
            </form>
          ) : null}
          {canAssign && canEdit && !item.completedAt ? (
            <Button asChild className="font-semibold">
              <Link href={`/is-listesi/${item.id}/gorev`}>
                <UserPlus />
                Stajyere ata
              </Link>
            </Button>
          ) : null}
        </div>
      </section>

      {editing && canEdit ? (
        <EditWorkItemForm item={item} clients={clients} onClose={() => setEditing(false)} />
      ) : null}

      <section className="grid gap-4">
        <h2 className="text-xl font-semibold tracking-tight">Yapılanlar</h2>
        {canEdit || item.ownerRole === "INTERN" ? (
          <AddEntryForm workItemId={item.id} />
        ) : null}
        {item.entries.length === 0 && item.tasks.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">Henüz yapılan yok.</p>
        ) : (
          <ul className="divide-y divide-border/50 border-y border-border/50">
            {item.entries.map((entry) => (
              <li key={entry.id} className="py-3">
                <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
                  {entry.content}
                </p>
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
