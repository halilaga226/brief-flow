"use client"

import {
  createCaseFileAction,
  createClientAction,
  deleteCaseFileAction,
  deleteClientAction,
  updateCaseFileAction,
  updateClientAction,
} from "@/actions/clients"
import { useActionResult } from "@/components/portal/use-action-result"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { CaseFileListDTO, ClientListDTO } from "@/server/clients"
import { Pencil, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { useActionState, useState } from "react"

export function ClientsView({
  clients,
}: {
  clients: ClientListDTO[]
}) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(createClientAction, null)
  useActionResult(state)

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Müvekkiller</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Müvekkil altında dosya tutun; işler dosyada birikir. Yeni görev atarken müvekkil/dosya
            otomatik oluşur.
          </p>
        </div>
        <Button type="button" className="font-semibold" onClick={() => setOpen(true)}>
          <Plus />
          Müvekkil ekle
        </Button>
      </div>

      {open ? (
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
          Henüz müvekkil yok. Görev atayınca otomatik oluşur veya buradan ekleyin.
        </p>
      ) : (
        <ul className="overflow-hidden rounded-lg border border-border">
          {clients.map((client) => (
            <li key={client.id} className="border-b border-border last:border-b-0">
              <Link
                href={`/muvekkiller/${client.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50"
              >
                <span>
                  <span className="block text-base font-bold">{client.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {client.fileCount} dosya · {client.taskCount} iş
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

export function ClientDetailView({
  client,
}: {
  client: { id: string; name: string; files: CaseFileListDTO[] }
}) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [state, action, pending] = useActionState(createCaseFileAction, null)
  const [editState, editAction, editPending] = useActionState(updateClientAction, null)
  const [deleteState, deleteAction, deletePending] = useActionState(deleteClientAction, null)
  useActionResult(state)
  useActionResult(editState, () => setEditing(false))
  useActionResult(deleteState)

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <Link href="/muvekkiller" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          Müvekkillere dön
        </Link>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{client.name}</h1>
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
        </div>
      </div>

      {editing ? (
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

      {open ? (
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

      {client.files.length === 0 ? (
        <p className="border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          Dosya yok — ekleyin veya görev atayın.
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
