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
    <form
      ref={formRef}
      action={action}
      className="grid gap-4 rounded-2xl border border-border/60 bg-card/50 p-4"
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

function ItemActions({ item }: { item: WorkItemDTO }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      <Button asChild size="sm" variant="outline" className="h-8 px-2.5 font-semibold">
        <Link href={`/is-listesi/${item.id}`}>Aç</Link>
      </Button>
      <Button asChild size="sm" variant="outline" className="h-8 px-2.5 font-semibold">
        <Link href={`/is-listesi/${item.id}/gorev`}>
          <UserPlus className="size-3.5" />
          Ata
        </Link>
      </Button>
      <DeleteButton id={item.id} />
    </div>
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
        <div className="flex justify-stretch sm:justify-end">
          <Button
            type="button"
            onClick={() => setFormOpen(true)}
            className="w-full font-semibold sm:w-auto"
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
        <div className="rounded-2xl border border-dashed border-border/70 py-10 text-center">
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
        <>
          <div className="grid gap-3 lg:hidden">
            {items.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-border/60 bg-card/60 p-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/is-listesi/${item.id}`}
                      className="block text-base font-bold hover:underline"
                    >
                      {item.courtName}
                    </Link>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                      {item.fileNumber}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-muted-foreground tabular-nums">
                    {item.taskCount} görev
                  </span>
                </div>
                <p className="mt-3 text-sm font-medium leading-relaxed">{item.workToDo}</p>
                {item.notes ? (
                  <p className="mt-2 text-sm text-muted-foreground">{item.notes}</p>
                ) : null}
                <div className="mt-3 border-t border-border/40 pt-3">
                  <ItemActions item={item} />
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-xl border border-border/50 lg:block">
            <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                  <th className="px-3 py-2.5 font-bold">Mahkeme</th>
                  <th className="px-3 py-2.5 font-bold">Dosya no</th>
                  <th className="px-3 py-2.5 font-bold">Yapılacaklar</th>
                  <th className="px-3 py-2.5 font-bold">Özel not</th>
                  <th className="px-3 py-2.5 font-bold">Görev</th>
                  <th className="px-3 py-2.5 font-bold" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border/40 odd:bg-black/[0.02] dark:odd:bg-white/[0.03]"
                  >
                    <td className="px-3 py-2.5 align-top">
                      <Link
                        href={`/is-listesi/${item.id}`}
                        className="font-semibold hover:underline"
                      >
                        {item.courtName}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 align-top font-mono text-xs">{item.fileNumber}</td>
                    <td className="max-w-[16rem] px-3 py-2.5 align-top font-medium">
                      {item.workToDo}
                    </td>
                    <td className="max-w-[12rem] px-3 py-2.5 align-top text-muted-foreground">
                      {item.notes || "—"}
                    </td>
                    <td className="px-3 py-2.5 align-top tabular-nums text-muted-foreground">
                      {item.taskCount}
                    </td>
                    <td className="px-3 py-2.5 align-top">
                      <ItemActions item={item} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
