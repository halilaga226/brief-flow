"use client"

import {
  completeCourthouseJobAction,
  createCourthouseAction,
  createCourthouseJobAction,
  deleteCourthouseAction,
  deleteCourthouseJobAction,
  reopenCourthouseJobAction,
} from "@/actions/courthouses"
import { useActionResult } from "@/components/portal/use-action-result"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ColleagueDTO } from "@/lib/dto"
import { cn } from "@/lib/utils"
import {
  courthouseJobKindLabel,
  type CourthouseDTO,
  type CourthouseJobDTO,
} from "@/server/courthouses"
import { Check, Landmark, Plus, RotateCcw, Trash2 } from "lucide-react"
import { useActionState, useMemo, useRef, useState } from "react"

function formatWhen(iso: string | null) {
  if (!iso) return null
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(iso))
}

function AddCourthouseForm() {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(createCourthouseAction, null)
  const formRef = useRef<HTMLFormElement>(null)
  useActionResult(state, () => {
    formRef.current?.reset()
    setOpen(false)
  })
  if (!open) {
    return (
      <Button type="button" size="sm" className="font-semibold" onClick={() => setOpen(true)}>
        <Plus />
        Adliye ekle
      </Button>
    )
  }
  return (
    <form
      ref={formRef}
      action={action}
      className="grid gap-3 rounded-xl border border-border bg-card p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">Yeni adliye</p>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Vazgeç
        </Button>
      </div>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1">
          <Label htmlFor="name">Adliye adı</Label>
          <Input id="name" name="name" required minLength={3} className="h-9" placeholder="İstanbul Anadolu Adliyesi" />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="city">İl / ilçe</Label>
          <Input id="city" name="city" className="h-9" placeholder="Kadıköy" />
        </div>
        <div className="grid gap-1 sm:col-span-2">
          <Label htmlFor="notes">Not (isteğe bağlı)</Label>
          <Input id="notes" name="notes" className="h-9" />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending} className="font-semibold">
          {pending ? "Kaydediliyor…" : "Kaydet"}
        </Button>
      </div>
    </form>
  )
}

function AssignJobForm({
  courthouses,
  interns,
}: {
  courthouses: CourthouseDTO[]
  interns: ColleagueDTO[]
}) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(createCourthouseJobAction, null)
  const formRef = useRef<HTMLFormElement>(null)
  useActionResult(state, () => {
    formRef.current?.reset()
    setOpen(false)
  })
  if (courthouses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Önce yönetici en az bir adliye eklemeli.
      </p>
    )
  }
  if (!open) {
    return (
      <Button type="button" size="sm" className="font-semibold" onClick={() => setOpen(true)}>
        <Plus />
        Adliye işi ata
      </Button>
    )
  }
  return (
    <form
      ref={formRef}
      action={action}
      className="grid gap-3 rounded-xl border border-border bg-card p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-semibold">Adliyeye iş ata</p>
          <p className="text-xs text-muted-foreground">
            Stajyer adliyede tüm açık işleri görür ve tamamlayabilir.
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Vazgeç
        </Button>
      </div>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1">
          <Label htmlFor="courthouseId">Adliye</Label>
          <select
            id="courthouseId"
            name="courthouseId"
            required
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Adliye seçin…</option>
            {courthouses.map((court) => (
              <option key={court.id} value={court.id}>
                {court.name}
                {court.city ? ` · ${court.city}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1">
          <Label htmlFor="kind">Tür</Label>
          <select
            id="kind"
            name="kind"
            defaultValue="IS"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="IS">Adliye işi</option>
            <option value="GORUSME">Görüşme</option>
          </select>
        </div>
        <div className="grid gap-1 sm:col-span-2">
          <Label htmlFor="title">Yapılacak iş</Label>
          <Input id="title" name="title" required minLength={3} className="h-9" placeholder="Duruşma takip / evrak teslim" />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="clientName">Müvekkil (isteğe bağlı)</Label>
          <Input id="clientName" name="clientName" className="h-9" />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="fileNumber">Dosya no (isteğe bağlı)</Label>
          <Input id="fileNumber" name="fileNumber" className="h-9" />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="dueDate">Tarih</Label>
          <Input id="dueDate" name="dueDate" type="date" className="h-9" />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="assigneeId">Stajyer (isteğe bağlı)</Label>
          <select
            id="assigneeId"
            name="assigneeId"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Havuz — tüm stajyerler görür</option>
            {interns.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1 sm:col-span-2">
          <Label htmlFor="description">Not</Label>
          <Textarea id="description" name="description" rows={2} />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending} className="font-semibold">
          {pending ? "Atanıyor…" : "Ata"}
        </Button>
      </div>
    </form>
  )
}

function JobRow({
  job,
  canComplete,
  canReopen,
  canDelete,
}: {
  job: CourthouseJobDTO
  canComplete: boolean
  canReopen: boolean
  canDelete: boolean
}) {
  const [completeState, completeAction, completing] = useActionState(
    completeCourthouseJobAction,
    null,
  )
  const [reopenState, reopenAction, reopening] = useActionState(reopenCourthouseJobAction, null)
  const [deleteState, deleteAction, deleting] = useActionState(deleteCourthouseJobAction, null)
  useActionResult(completeState)
  useActionResult(reopenState)
  useActionResult(deleteState)
  const done = Boolean(job.completedAt)

  return (
    <li className="grid gap-2 border-b border-border px-3 py-3 last:border-b-0 md:grid-cols-[minmax(8rem,1.1fr)_minmax(10rem,1.4fr)_minmax(7rem,1fr)_auto] md:items-start">
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase md:hidden">Adliye</p>
        <p className="text-sm font-semibold">{job.courthouseName}</p>
        {job.courthouseCity ? (
          <p className="text-[11px] text-muted-foreground">{job.courthouseCity}</p>
        ) : null}
        <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
          {courthouseJobKindLabel(job.kind)}
        </p>
      </div>
      <div>
        <p className="text-sm font-medium">{job.title}</p>
        {job.clientName ? (
          <p className="text-xs text-muted-foreground">
            {job.clientName}
            {job.fileNumber ? ` · ${job.fileNumber}` : ""}
          </p>
        ) : job.fileNumber ? (
          <p className="text-xs text-muted-foreground">{job.fileNumber}</p>
        ) : null}
        {job.description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{job.description}</p>
        ) : null}
      </div>
      <div className="text-sm">
        <p>{job.assigneeName ?? "Havuz"}</p>
        <p className="text-[11px] text-muted-foreground">
          {job.dueDate ? formatWhen(job.dueDate) : "Tarih yok"}
        </p>
        {done ? (
          <p className="mt-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            Tamamlayan: {job.completedByName ?? "—"}
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground">Atayan: {job.assignerName}</p>
        )}
      </div>
      <div className="flex flex-wrap gap-1 md:justify-end">
        {canComplete && !done ? (
          <form action={completeAction}>
            <input type="hidden" name="jobId" value={job.id} />
            <Button type="submit" size="sm" disabled={completing} className="h-8 font-semibold">
              <Check className="size-3.5" />
              Tamamla
            </Button>
          </form>
        ) : null}
        {canReopen && done ? (
          <form action={reopenAction}>
            <input type="hidden" name="jobId" value={job.id} />
            <Button type="submit" size="sm" variant="ghost" disabled={reopening} className="h-8">
              <RotateCcw className="size-3.5" />
              Yeniden aç
            </Button>
          </form>
        ) : null}
        {canDelete ? (
          <form action={deleteAction}>
            <input type="hidden" name="jobId" value={job.id} />
            <Button
              type="submit"
              size="icon-sm"
              variant="ghost"
              disabled={deleting}
              aria-label="Sil"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 />
            </Button>
          </form>
        ) : null}
      </div>
    </li>
  )
}

export function CourthouseBoard({
  courthouses,
  jobs,
  interns,
  canAssign,
  canManageCourts,
  canComplete,
  canReopen,
  currentUserId,
}: {
  courthouses: CourthouseDTO[]
  jobs: CourthouseJobDTO[]
  interns: ColleagueDTO[]
  canAssign: boolean
  canManageCourts: boolean
  canComplete: boolean
  canReopen: boolean
  currentUserId: string
}) {
  const [courtId, setCourtId] = useState<string>("all")
  const openJobs = useMemo(
    () =>
      jobs.filter(
        (job) =>
          !job.completedAt && (courtId === "all" || job.courthouseId === courtId),
      ),
    [jobs, courtId],
  )
  const doneJobs = useMemo(
    () =>
      jobs.filter(
        (job) =>
          Boolean(job.completedAt) && (courtId === "all" || job.courthouseId === courtId),
      ),
    [jobs, courtId],
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCourtId("all")}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm ring-1 transition",
              courtId === "all"
                ? "bg-primary font-semibold text-primary-foreground ring-primary"
                : "bg-card font-medium ring-border hover:bg-muted",
            )}
          >
            Tüm adliyeler
          </button>
          {courthouses.map((court) => (
            <button
              key={court.id}
              type="button"
              onClick={() => setCourtId(court.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm ring-1 transition",
                courtId === court.id
                  ? "bg-primary font-semibold text-primary-foreground ring-primary"
                  : "bg-card font-medium ring-border hover:bg-muted",
              )}
            >
              {court.name}
              {court.openJobCount > 0 ? (
                <span className="ml-1.5 opacity-70 tabular-nums">({court.openJobCount})</span>
              ) : null}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {canManageCourts ? <AddCourthouseForm /> : null}
          {canAssign ? <AssignJobForm courthouses={courthouses} interns={interns} /> : null}
        </div>
      </div>

      {canManageCourts && courthouses.length > 0 ? (
        <ul className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {courthouses.map((court) => (
            <li key={`admin-${court.id}`} className="flex items-center gap-1 rounded-md border border-border px-2 py-1">
              <Landmark className="size-3.5" />
              {court.name}
              <DeleteCourtButton id={court.id} />
            </li>
          ))}
        </ul>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-base font-semibold">Açık işler</h2>
        {openJobs.length === 0 ? (
          <p className="border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            Bu adliyede açık iş yok.
          </p>
        ) : (
          <ul className="rounded-lg border border-border bg-card">
            {openJobs.map((job) => (
              <JobRow
                key={job.id}
                job={job}
                canComplete={canComplete}
                canReopen={false}
                canDelete={canAssign && (job.assignerId === currentUserId || canManageCourts)}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">Tamamlanan işler</h2>
        {doneJobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Henüz tamamlanan adliye işi yok.</p>
        ) : (
          <ul className="rounded-lg border border-border bg-muted/20">
            {doneJobs.map((job) => (
              <JobRow
                key={job.id}
                job={job}
                canComplete={false}
                canReopen={canReopen}
                canDelete={canAssign && (job.assignerId === currentUserId || canManageCourts)}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function DeleteCourtButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(deleteCourthouseAction, null)
  useActionResult(state)
  return (
    <form action={action}>
      <input type="hidden" name="courthouseId" value={id} />
      <Button
        type="submit"
        variant="ghost"
        size="icon-sm"
        disabled={pending}
        aria-label="Adliyeyi sil"
        className="size-6 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="size-3" />
      </Button>
    </form>
  )
}
