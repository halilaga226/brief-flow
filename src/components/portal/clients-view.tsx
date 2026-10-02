"use client"

import {
  addClientNoteAction,
  createCaseFileAction,
  createClientAction,
  deleteCaseFileAction,
  deleteClientAction,
  deleteClientNoteAction,
  updateCaseFileAction,
  updateClientAction,
} from "@/actions/clients"
import { useActionResult } from "@/components/portal/use-action-result"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatDateTime } from "@/lib/format"
import { roleLabel } from "@/lib/workflow"
import type { CaseFileListDTO, ClientListDTO, ClientNoteDTO } from "@/server/clients"
import { Pencil, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { useActionState, useState } from "react"

function QuickDeleteClientButton({ clientId, name }: { clientId: string; name: string }) {
  const [state, action, pending] = useActionState(deleteClientAction, null)
  useActionResult(state)

  return (
    <form
      action={action}
      onClick={(event) => event.stopPropagation()}
      onSubmit={(event) => {
        if (!window.confirm(`“${name}” silinenlere taşınsın mı?`)) {
          event.preventDefault()
        }
      }}
    >
      <input type="hidden" name="clientId" value={clientId} />
      <Button
        type="submit"
        size="icon"
        variant="ghost"
        disabled={pending}
        className="size-9 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
        aria-label={`${name} sil`}
        title="Silinenlere taşı"
      >
        <Trash2 className="size-4" />
      </Button>
      {state?.error ? (
        <span className="sr-only" role="alert">
          {state.error}
        </span>
      ) : null}
    </form>
  )
}

export function ClientsView({
  clients,
  canManage = true,
}: {
  clients: ClientListDTO[]
  canManage?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(createClientAction, null)
  useActionResult(state)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Müvekkiller</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {canManage
              ? "Müvekkil altında dosya tutun; işler dosyada birikir. Yeni görev atarken müvekkil/dosya otomatik oluşur."
              : "Müvekkilleri görüntüleyebilir ve not ekleyebilirsiniz. Düzenleme avukatlara aittir."}
          </p>
        </div>
        {canManage ? (
          <Button type="button" className="font-semibold" onClick={() => setOpen(true)}>
            <Plus />
            Müvekkil ekle
          </Button>
        ) : null}
      </div>

      {open && canManage ? (
        <form action={action} className="grid gap-3 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold">Yeni müvekkil</p>
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Vazgeç
            </Button>
          </div>
          {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <div className="grid gap-1">
            <Label htmlFor="name">Ad soyad / ünvan</Label>
            <Input id="name" name="name" required className="h-9" placeholder="Deniz Acar" />
          </div>
          <Button type="submit" disabled={pending} className="font-semibold sm:w-fit">
            {pending ? "…" : "Kaydet"}
          </Button>
        </form>
      ) : null}

      {clients.length === 0 ? (
        <p className="border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          Henüz müvekkil yok.
          {canManage ? " Görev atayınca otomatik oluşur veya buradan ekleyin." : null}
        </p>
      ) : (
        <ul className="overflow-hidden rounded-lg border border-border">
          {clients.map((client) => (
            <li
              key={client.id}
              className="flex items-center gap-1 border-b border-border last:border-b-0"
            >
              <Link
                href={`/muvekkiller/${client.id}`}
                className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-base font-bold">{client.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {client.fileCount} dosya · {client.taskCount} iş
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-primary">Aç</span>
              </Link>
              {canManage ? (
                <div className="pr-2">
                  <QuickDeleteClientButton clientId={client.id} name={client.name} />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function ClientNotesPanel({
  clientId,
  notes,
}: {
  clientId: string
  notes: ClientNoteDTO[]
}) {
  const [state, action, pending] = useActionState(addClientNoteAction, null)
  const [deleteState, deleteAction, deletePending] = useActionState(deleteClientNoteAction, null)
  useActionResult(state)
  useActionResult(deleteState)

  return (
    <section className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div>
        <h2 className="text-base font-semibold">Müvekkil notları</h2>
        <p className="text-xs text-muted-foreground">
          Görüşme, hatırlatma veya dosya dışı bilgiler — avukat ve stajyer ekleyebilir.
        </p>
      </div>

      <form action={action} className="grid gap-2">
        <input type="hidden" name="clientId" value={clientId} />
        <Label htmlFor="client-note" className="sr-only">
          Not
        </Label>
        <Textarea
          id="client-note"
          name="body"
          rows={3}
          required
          placeholder="Örn. Müvekkil salı aranacak; vekalet aslı dosyada."
          className="min-h-[4.5rem]"
        />
        {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        <Button type="submit" disabled={pending} className="font-semibold sm:w-fit">
          {pending ? "…" : "Not ekle"}
        </Button>
      </form>

      {notes.length === 0 ? (
        <p className="border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
          Henüz not yok.
        </p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {note.authorName}
                    <span className="ml-1.5 text-xs font-medium text-muted-foreground">
                      {note.authorTitle || roleLabel(note.authorRole as "LAWYER" | "INTERN" | "ADMIN")}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(note.createdAt)}</p>
                </div>
                {note.canDelete ? (
                  <form action={deleteAction}>
                    <input type="hidden" name="noteId" value={note.id} />
                    <Button
                      type="submit"
                      size="icon"
                      variant="ghost"
                      disabled={deletePending}
                      className="size-8 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Notu sil"
                      onClick={(event) => {
                        if (!window.confirm("Bu not silinsin mi?")) event.preventDefault()
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </form>
                ) : null}
              </div>
              <p className="mt-2 text-sm whitespace-pre-wrap">{note.body}</p>
            </li>
          ))}
        </ul>
      )}
      {deleteState?.error ? (
        <p className="text-sm text-destructive">{deleteState.error}</p>
      ) : null}
    </section>
  )
}

export function ClientDetailView({
  client,
  notes,
}: {
  client: { id: string; name: string; canManage: boolean; files: CaseFileListDTO[] }
  notes: ClientNoteDTO[]
}) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [state, action, pending] = useActionState(createCaseFileAction, null)
  const [editState, editAction, editPending] = useActionState(updateClientAction, null)
  const [deleteState, deleteAction, deletePending] = useActionState(deleteClientAction, null)
  useActionResult(state)
  useActionResult(editState, () => setEditing(false))
  useActionResult(deleteState)
  const canManage = client.canManage

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <Link href="/muvekkiller" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          Müvekkillere dön
        </Link>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{client.name}</h1>
          {canManage ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" className="font-semibold" onClick={() => setEditing(true)}>
                <Pencil />
                Düzenle
              </Button>
              <Button type="button" className="font-semibold" onClick={() => setOpen(true)}>
                <Plus />
                Dosya ekle
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {editing && canManage ? (
        <form action={editAction} className="grid gap-3 rounded-lg border border-border bg-card p-4">
          <input type="hidden" name="clientId" value={client.id} />
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold">Müvekkil düzenle</p>
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Vazgeç
            </Button>
          </div>
          {editState?.error ? <p className="text-sm text-destructive">{editState.error}</p> : null}
          <div className="grid gap-1">
            <Label htmlFor="edit-name">Ad soyad / ünvan</Label>
            <Input
              id="edit-name"
              name="name"
              required
              defaultValue={client.name}
              className="h-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={editPending} className="font-semibold">
              {editPending ? "…" : "Kaydet"}
            </Button>
            <Button
              type="submit"
              formAction={deleteAction}
              disabled={deletePending}
              variant="destructive"
              className="font-semibold"
              onClick={(event) => {
                if (!window.confirm("Müvekkil ve altındaki dosyalar silinenlere taşınır. Devam?")) {
                  event.preventDefault()
                }
              }}
            >
              <Trash2 />
              {deletePending ? "…" : "Silinenlere taşı"}
            </Button>
          </div>
          {deleteState?.error ? (
            <p className="text-sm text-destructive">{deleteState.error}</p>
          ) : null}
        </form>
      ) : null}

      {open && canManage ? (
        <form action={action} className="grid gap-3 rounded-lg border border-border bg-card p-4">
          <input type="hidden" name="clientId" value={client.id} />
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold">Yeni dosya</p>
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Vazgeç
            </Button>
          </div>
          {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1">
              <Label htmlFor="fileNumber">Dosya no</Label>
              <Input id="fileNumber" name="fileNumber" required className="h-9" />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="courtName">Mahkeme</Label>
              <Input id="courtName" name="courtName" className="h-9" />
            </div>
            <div className="grid gap-1 sm:col-span-2">
              <Label htmlFor="notes">Not</Label>
              <Textarea id="notes" name="notes" rows={2} />
            </div>
          </div>
          <Button type="submit" disabled={pending} className="font-semibold sm:w-fit">
            {pending ? "…" : "Kaydet"}
          </Button>
        </form>
      ) : null}

      <ClientNotesPanel clientId={client.id} notes={notes} />

      {client.files.length === 0 ? (
        <p className="border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          Dosya yok{canManage ? " — ekleyin veya görev atayın." : "."}
        </p>
      ) : (
        <ul className="overflow-hidden rounded-lg border border-border">
          {client.files.map((file) => (
            <li key={file.id} className="border-b border-border last:border-b-0">
              <Link
                href={`/muvekkiller/${client.id}/dosya/${file.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50"
              >
                <span>
                  <span className="block font-mono text-sm font-bold">{file.fileNumber}</span>
                  <span className="text-xs text-muted-foreground">
                    {file.courtName || "Mahkeme yok"} · {file.taskCount} iş
                  </span>
                </span>
                <span className="text-sm font-semibold text-primary">Aç</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function CaseFileEditor({
  clientId,
  file,
}: {
  clientId: string
  file: {
    id: string
    fileNumber: string
    courtName: string
    notes: string
  }
}) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(updateCaseFileAction, null)
  const [deleteState, deleteAction, deletePending] = useActionState(deleteCaseFileAction, null)
  useActionResult(state, () => setOpen(false))
  useActionResult(deleteState)

  return (
    <div className="space-y-3">
      <Button type="button" variant="outline" className="font-semibold" onClick={() => setOpen(true)}>
        <Pencil />
        Dosyayı düzenle
      </Button>
      {open ? (
        <form action={action} className="grid gap-3 rounded-lg border border-border bg-card p-4">
          <input type="hidden" name="clientId" value={clientId} />
          <input type="hidden" name="caseFileId" value={file.id} />
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold">Dosya düzenle</p>
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Vazgeç
            </Button>
          </div>
          {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1">
              <Label htmlFor="edit-fileNumber">Dosya no</Label>
              <Input
                id="edit-fileNumber"
                name="fileNumber"
                required
                defaultValue={file.fileNumber}
                className="h-9"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="edit-courtName">Mahkeme</Label>
              <Input
                id="edit-courtName"
                name="courtName"
                defaultValue={file.courtName}
                className="h-9"
              />
            </div>
            <div className="grid gap-1 sm:col-span-2">
              <Label htmlFor="edit-notes">Not</Label>
              <Textarea id="edit-notes" name="notes" rows={2} defaultValue={file.notes} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending} className="font-semibold">
              {pending ? "…" : "Kaydet"}
            </Button>
            <Button
              type="submit"
              formAction={deleteAction}
              disabled={deletePending}
              variant="destructive"
              className="font-semibold"
              onClick={(event) => {
                if (!window.confirm("Dosya silinenlere taşınır. Devam?")) {
                  event.preventDefault()
                }
              }}
            >
              <Trash2 />
              {deletePending ? "…" : "Silinenlere taşı"}
            </Button>
          </div>
          {deleteState?.error ? (
            <p className="text-sm text-destructive">{deleteState.error}</p>
          ) : null}
        </form>
      ) : null}
    </div>
  )
}
