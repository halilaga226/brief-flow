"use client"

import {
  completeWorkItemAction,
  createWorkItemAction,
  deleteWorkItemAction,
  reopenWorkItemAction,
} from "@/actions/work-items"
import { useActionResult } from "@/components/portal/use-action-result"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ClientPickerDTO } from "@/server/clients"
import type { WorkItemDTO } from "@/server/work-items"
import { cn } from "@/lib/utils"
import { Check, Plus, RotateCcw, Trash2, UserPlus } from "lucide-react"
import Link from "next/link"
import { useActionState, useEffect, useMemo, useRef, useState } from "react"

function CreateWorkItemForm({
  open,
  onClose,
  clients,
}: {
  open: boolean
  onClose: () => void
  clients: ClientPickerDTO[]
}) {
  const [state, action, pending] = useActionState(createWorkItemAction, null)
  const formRef = useRef<HTMLFormElement>(null)
  const [clientId, setClientId] = useState("")
  const [caseFileId, setCaseFileId] = useState("")
  useActionResult(state, () => {
    formRef.current?.reset()
    setClientId("")
    setCaseFileId("")
    onClose()
  })

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === clientId) ?? null,
    [clients, clientId],
  )
  const selectedFile = useMemo(
    () => selectedClient?.caseFiles.find((f) => f.id === caseFileId) ?? null,
    [selectedClient, caseFileId],
  )

  if (!open) return null

  return (
    <form
      ref={formRef}
      action={action}
      className="grid gap-3 border border-border bg-card p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold">Kendi işime ekle</p>
          <p className="text-xs text-muted-foreground">
            Kayıt sizin listenizde kalır. İsterseniz sonra stajyere atayabilirsiniz.
          </p>
        </div>
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
          <Label htmlFor="clientId">Müvekkil (isteğe bağlı)</Label>
          {clients.length > 0 ? (
            <>
              <select
                id="clientId"
                name="clientId"
                value={clientId}
                onChange={(e) => {
                  setClientId(e.target.value)
                  setCaseFileId("")
                }}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Müvekkil yok / sonra ekle</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              <input type="hidden" name="clientName" value={selectedClient?.name ?? ""} />
            </>
          ) : (
            <Input
              id="clientName"
              name="clientName"
              className="h-9"
              placeholder="Müvekkil adı (opsiyonel)"
            />
          )}
        </div>
        {clients.length > 0 ? (
          <div className="grid gap-1 sm:col-span-2">
            <Label htmlFor="caseFileId">Dosya (varsa)</Label>
            <select
              id="caseFileId"
              name="caseFileId"
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
          <Label htmlFor="courtName">Mahkeme</Label>
          <Input
            id="courtName"
            name="courtName"
            required
            className="h-9"
            key={`court-${caseFileId || "x"}`}
            defaultValue={selectedFile?.courtName ?? ""}
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="fileNumber">Dosya no</Label>
          <Input
            id="fileNumber"
            name="fileNumber"
            required
            className="h-9"
            key={`file-${caseFileId || "x"}`}
            defaultValue={selectedFile?.fileNumber ?? ""}
          />
        </div>
        <div className="grid gap-1 sm:col-span-2">
          <Label htmlFor="workToDo">Yapılacaklar</Label>
          <Textarea id="workToDo" name="workToDo" required rows={2} />
        </div>
        <div className="grid gap-1 sm:col-span-2">
          <Label htmlFor="notes">Özel not / açıklama</Label>
          <Textarea id="notes" name="notes" rows={2} />
        </div>
        <input type="hidden" name="opposingParty" value="" />
        <input type="hidden" name="courtFile" value={selectedFile?.fileNumber ?? ""} />
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

function CompleteToggle({ id, completed }: { id: string; completed: boolean }) {
  const [state, action, pending] = useActionState(
    completed ? reopenWorkItemAction : completeWorkItemAction,
    null,
  )
  useActionResult(state)
  return (
    <form action={action}>
      <input type="hidden" name="workItemId" value={id} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        disabled={pending}
        className="h-8 px-2 font-semibold"
        title={completed ? "Yeniden aç" : "Kendim tamamladım"}
      >
        {completed ? <RotateCcw className="size-3.5" /> : <Check className="size-3.5" />}
        {completed ? "Yeniden aç" : "Tamamla"}
      </Button>
    </form>
  )
}

const COL =
  "grid grid-cols-1 gap-2 border-b border-border px-3 py-3 md:grid-cols-[minmax(7rem,1fr)_minmax(8rem,1.2fr)_6rem_minmax(8rem,1.4fr)_minmax(5rem,0.9fr)_minmax(5rem,0.8fr)_auto] md:items-start md:gap-2 md:py-2.5"

export function WorkItemAgenda({
  items,
  clients = [],
  canCreate = true,
  canAssign = false,
  currentUserId,
  showOwner = false,
  emptyMessage,
}: {
  items: WorkItemDTO[]
  clients?: ClientPickerDTO[]
  canCreate?: boolean
  canAssign?: boolean
  currentUserId?: string
  showOwner?: boolean
  emptyMessage?: string
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
        <CreateWorkItemForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          clients={clients}
        />
      ) : null}

      {items.length === 0 ? (
        <p className="border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          {emptyMessage ??
            (canCreate
              ? "Listeniz boş — «İş ekle» ile kendi işinizi ekleyin. Müvekkil bağlamak zorunlu değil."
              : "Bu listede henüz kayıt yok.")}
        </p>
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <div
            className={cn(
              COL,
              "hidden bg-muted/50 text-[10px] font-bold tracking-wide text-muted-foreground uppercase md:grid",
            )}
          >
            <span>Müvekkil</span>
            <span>Mahkeme</span>
            <span>Dosya no</span>
            <span>Yapılacaklar</span>
            <span>Durum</span>
            <span>Atama</span>
            <span />
          </div>
          <ul>
            {items.map((item) => {
              const isOwner = !currentUserId || item.ownerId === currentUserId
              const done = Boolean(item.completedAt)
              return (
                <li
                  key={item.id}
                  className={cn(COL, done && "bg-muted/30 opacity-80")}
                >
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase md:hidden">
                      Müvekkil
                    </p>
                    <p className="text-sm font-semibold">{item.clientName || "—"}</p>
                    {showOwner || item.ownerRole === "INTERN" ? (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {item.ownerRole === "INTERN" ? "Stajyer" : "Sahip"} · {item.ownerName}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase md:hidden">
                      Mahkeme
                    </p>
                    <Link
                      href={`/is-listesi/${item.id}`}
                      className="text-sm font-bold hover:underline"
                    >
                      {item.courtName}
                    </Link>
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
                    {item.notes ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">{item.notes}</p>
                    ) : null}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase md:hidden">
                      Durum
                    </p>
                    {done ? (
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                        Tamamlandı
                      </p>
                    ) : item.latestTaskStatusLabel ? (
                      <div>
                        <p className="text-sm font-semibold">{item.latestTaskStatusLabel}</p>
                        {item.latestTaskAssignee ? (
                          <p className="text-[11px] text-muted-foreground">
                            {item.latestTaskAssignee}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Kişisel iş</p>
                    )}
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
                    {isOwner ? <CompleteToggle id={item.id} completed={done} /> : null}
                    {canAssign && isOwner && !done ? (
                      <Button asChild size="sm" variant="ghost" className="h-8 px-2 font-semibold">
                        <Link href={`/is-listesi/${item.id}/gorev`}>
                          <UserPlus className="size-3.5" />
                          Stajyere ata
                        </Link>
                      </Button>
                    ) : null}
                    {isOwner ? <DeleteButton id={item.id} /> : null}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
