"use client"

import { createWorkItemAction, deleteWorkItemAction } from "@/actions/work-items"
import { useActionResult } from "@/components/portal/use-action-result"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { WorkItemDTO } from "@/server/work-items"
import { cn } from "@/lib/utils"
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
      className="grid gap-3 border border-border bg-card p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">Yeni dosya kaydı</p>
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

const COL =
  "grid grid-cols-1 gap-2 border-b border-border px-3 py-3 md:grid-cols-[minmax(8rem,1.2fr)_6rem_minmax(8rem,1.4fr)_minmax(6rem,1fr)_3.5rem_auto] md:items-start md:gap-2 md:py-2.5"

export function WorkItemAgenda({
  items,
  canCreate = true,
  canAssign = false,
  currentUserId,
}: {
  items: WorkItemDTO[]
  canCreate?: boolean
  canAssign?: boolean
  /** Verilirse silme yalnızca kendi kayıtlarında görünür */
  currentUserId?: string
}) {
  const [formOpen, setFormOpen] = useState(false)

  useEffect(() => {
    const onHash = () => {
      if (window.location.hash === "#is-ekle") setFormOpen(true)
    }
    onHash()
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [])

  return (
    <div className="space-y-3" id="dosya-kayitlari">
      {canCreate ? (
        <div className="flex justify-end">
          <Button
            type="button"
            id="is-ekle-btn"
            size="sm"
            className="font-semibold"
            disabled={formOpen}
            onClick={() => setFormOpen(true)}
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
        <p className="border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          Dosya kaydı yok
        </p>
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <div
            className={cn(
              COL,
              "hidden bg-muted/50 text-[10px] font-bold tracking-wide text-muted-foreground uppercase md:grid",
            )}
          >
            <span>Mahkeme</span>
            <span>Dosya no</span>
            <span>Yapılacaklar</span>
            <span>Özel not</span>
            <span>Görev</span>
            <span />
          </div>
          <ul>
            {items.map((item) => (
              <li key={item.id} className={COL}>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase md:hidden">
                    Mahkeme
                  </p>
                  <Link href={`/is-listesi/${item.id}`} className="text-sm font-bold hover:underline">
                    {item.courtName}
                  </Link>
                  {item.ownerRole === "INTERN" ? (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Stajyer · {item.ownerName}
                    </p>
                  ) : null}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase md:hidden">
                    Dosya
                  </p>
                  <p className="font-mono text-xs">{item.fileNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase md:hidden">
                    Yapılacaklar
                  </p>
                  <p className="text-sm font-medium">{item.workToDo}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase md:hidden">
                    Not
                  </p>
                  <p className="text-sm text-muted-foreground">{item.notes || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase md:hidden">
                    Görev
                  </p>
                  <p className="text-sm tabular-nums text-muted-foreground">{item.taskCount}</p>
                </div>
                <div className="flex flex-wrap gap-1 md:justify-end">
                  <Button asChild size="sm" variant="ghost" className="h-8 px-2 font-semibold">
                    <Link href={`/is-listesi/${item.id}`}>Aç</Link>
                  </Button>
                  {canAssign ? (
                    <Button asChild size="sm" variant="ghost" className="h-8 px-2 font-semibold">
                      <Link href={`/is-listesi/${item.id}/gorev`}>
                        <UserPlus className="size-3.5" />
                        Ata
                      </Link>
                    </Button>
                  ) : null}
                  {!currentUserId || item.ownerId === currentUserId ? (
                    <DeleteButton id={item.id} />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
