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
import { useActionState, useRef, useState } from "react"

function CreateWorkItemForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [state, action, pending] = useActionState(createWorkItemAction, null)
  const formRef = useRef<HTMLFormElement>(null)
  useActionResult(state, () => {
    formRef.current?.reset()
    onClose()
  })

  if (!open) return null

  return (
    <form ref={formRef} action={action} className="grid gap-4 border-y border-border/60 py-4">
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
}: {
  items: WorkItemDTO[]
  canCreate?: boolean
}) {
  const [formOpen, setFormOpen] = useState(false)

  return (
    <div className="grid gap-4">
      {canCreate ? (
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => setFormOpen(true)}
            className="font-semibold"
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
        <div className="border-y border-border/50 py-10 text-center">
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
        <div className="-mx-3 overflow-x-auto sm:-mx-4 md:mx-0">
          <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
            <thead className="sticky top-14 z-10 bg-background">
              <tr className="border-y border-border text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                <th className="px-2 py-1.5 font-bold">Mahkeme</th>
                <th className="px-2 py-1.5 font-bold">Dosya no</th>
                <th className="px-2 py-1.5 font-bold">Yapılacaklar</th>
                <th className="px-2 py-1.5 font-bold">Özel not</th>
                <th className="px-2 py-1.5 font-bold">Görev</th>
                <th className="px-2 py-1.5 font-bold" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-border/40 odd:bg-black/[0.02] dark:odd:bg-white/[0.03]"
                >
                  <td className="px-2 py-2 align-top">
                    <Link href={`/is-listesi/${item.id}`} className="font-semibold hover:underline">
                      {item.courtName}
                    </Link>
                  </td>
                  <td className="px-2 py-2 align-top font-mono text-xs">{item.fileNumber}</td>
                  <td className="max-w-[16rem] px-2 py-2 align-top font-medium">{item.workToDo}</td>
                  <td className="max-w-[12rem] px-2 py-2 align-top text-muted-foreground">
                    {item.notes || "—"}
                  </td>
                  <td className="px-2 py-2 align-top tabular-nums text-muted-foreground">
                    {item.taskCount}
                  </td>
                  <td className="px-2 py-2 align-top">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild size="sm" variant="ghost" className="h-7 px-2 font-semibold">
                        <Link href={`/is-listesi/${item.id}`}>Aç</Link>
                      </Button>
                      <Button asChild size="sm" variant="ghost" className="h-7 px-2 font-semibold">
                        <Link href={`/is-listesi/${item.id}/gorev`}>
                          <UserPlus className="size-3.5" />
                          Ata
                        </Link>
                      </Button>
                      <DeleteButton id={item.id} />
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
