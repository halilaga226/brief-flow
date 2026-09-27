"use client"

import { createWorkItemAction, deleteWorkItemAction } from "@/actions/work-items"
import { useActionResult } from "@/components/portal/use-action-result"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { WorkItemDTO } from "@/server/work-items"
import { Plus, Trash2, UserPlus } from "lucide-react"
import Link from "next/link"
import { useActionState, useEffect, useRef, useState } from "react"

function CreateWorkItemForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [state, action, pending] = useActionState(createWorkItemAction, null)
  const formRef = useRef<HTMLFormElement>(null)
  useActionResult(state, () => {
    formRef.current?.reset()
    onClose()
  })

  if (!open) return null

  return (
    <form
      ref={formRef}
      action={action}
      className="grid gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-tight">Yeni iş</h3>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onClose} className="font-medium">
            Vazgeç
          </Button>
          <Button type="submit" disabled={pending} className="font-semibold">
            <Plus />
            {pending ? "…" : "Kaydet"}
          </Button>
        </div>
      </div>
      {state?.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="courtName">Mahkeme</Label>
          <Input
            id="courtName"
            name="courtName"
            required
            className="h-10"
            placeholder="Örn. İstanbul 5. Asliye Hukuk"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="fileNumber">Dosya no</Label>
          <Input
            id="fileNumber"
            name="fileNumber"
            required
            className="h-10"
            placeholder="Örn. 2026/184"
          />
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="workToDo">Yapılacaklar</Label>
          <Textarea
            id="workToDo"
            name="workToDo"
            required
            rows={2}
            placeholder="Yapılacak işler…"
          />
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="notes">Özel not</Label>
          <Textarea id="notes" name="notes" rows={2} placeholder="İsteğe bağlı not…" />
        </div>
        <input type="hidden" name="clientName" value="" />
        <input type="hidden" name="opposingParty" value="" />
        <input type="hidden" name="courtFile" value="" />
      </div>
    </form>
  )
}

function DeleteButton({ id }: { id: string }) {
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

export function WorkItemAgenda({
  items,
  canCreate = true,
  startOpen = false,
}: {
  items: WorkItemDTO[]
  canCreate?: boolean
  startOpen?: boolean
}) {
  const [formOpen, setFormOpen] = useState(startOpen)

  useEffect(() => {
    const onHash = () => {
      if (window.location.hash === "#is-ekle") setFormOpen(true)
    }
    onHash()
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [])

  return (
    <div className="grid gap-4" id="dosya-kayitlari">
      {canCreate ? (
        <div className="flex">
          <Button
            type="button"
            id="is-ekle-btn"
            onClick={() => setFormOpen(true)}
            className="w-full font-semibold sm:ml-auto sm:w-auto"
            disabled={formOpen}
          >
            <Plus />
            İş ekle
          </Button>
        </div>
      ) : null}

      {canCreate ? (
        <CreateWorkItemForm open={formOpen} onClose={() => setFormOpen(false)} />
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 px-4 py-10 text-center">
          <p className="text-base text-muted-foreground">Henüz dosya kaydı yok.</p>
          {canCreate && !formOpen ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setFormOpen(true)}
              className="mt-4 font-semibold"
            >
              <Plus />
              İlk işi ekle
            </Button>
          ) : null}
        </div>
      ) : (
        <ul className="grid gap-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/is-listesi/${item.id}`}
                    className="text-base font-bold text-foreground hover:underline"
                  >
                    {item.courtName}
                  </Link>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {item.fileNumber}
                  </p>
                </div>
                <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                  {item.taskCount} görev
                </span>
              </div>
              <p className="mt-3 text-sm font-medium leading-relaxed text-foreground">
                {item.workToDo}
              </p>
              {item.notes ? (
                <p className="mt-2 text-sm text-muted-foreground">{item.notes}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                <Button asChild size="sm" variant="outline" className="h-9 font-semibold">
                  <Link href={`/is-listesi/${item.id}`}>Aç</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="h-9 font-semibold">
                  <Link href={`/is-listesi/${item.id}/gorev`}>
                    <UserPlus className="size-3.5" />
                    Ata
                  </Link>
                </Button>
                <DeleteButton id={item.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
