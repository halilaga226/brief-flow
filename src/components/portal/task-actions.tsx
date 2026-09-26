"use client"

import {
  approveTaskAction,
  completeTaskAction,
  markExpenseAction,
  queueSendAction,
  requestRevisionAction,
  setClientCallAction,
  uploadDraftAction,
} from "@/actions/tasks"
import { useActionResult } from "@/components/portal/use-action-result"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { ClientCallStatus } from "@/lib/workflow"
import { CLIENT_CALL_META } from "@/lib/workflow"
import { cn } from "@/lib/utils"
import { Banknote, Check, Copy, Phone, PhoneOff, RotateCcw, Send } from "lucide-react"
import { useActionState, useState } from "react"
import { toast } from "sonner"

function DriveNote({ drive }: { drive: { mode: "google" | "mock"; reason: string | null } }) {
  return (
    <p className="text-xs font-medium leading-relaxed text-zinc-500">
      {drive.mode === "google"
        ? "Dosya büronun Google Drive klasörüne gider. Sunucuda kopya tutulmaz."
        : drive.reason}
    </p>
  )
}

function UploadForm({
  taskId,
  drive,
}: {
  taskId: string
  drive: { mode: "google" | "mock"; reason: string | null }
}) {
  const [state, action, pending] = useActionState(uploadDraftAction, null)
  useActionResult(state)
  return (
    <form action={action} className="mt-3 grid gap-3">
      <input type="hidden" name="taskId" value={taskId} />
      <Input
        name="file"
        type="file"
        required
        accept=".pdf,.doc,.docx,.odt,.jpg,.jpeg,.png,.tif,.tiff,.udf"
        aria-label="Taslak dosyası"
        className="h-11"
      />
      <DriveNote drive={drive} />
      {state?.error ? <p className="text-sm font-medium text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending} className="bg-zinc-900 font-semibold">
        <Send />
        {pending ? "Yükleniyor…" : "Taslağı incelemeye gönder"}
      </Button>
    </form>
  )
}

function RevisionDialog({ taskId }: { taskId: string }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(requestRevisionAction, null)
  useActionResult(state, () => setOpen(false))
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant="outline" className="font-semibold" onClick={() => setOpen(true)}>
        <RotateCcw />
        Revize iste
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-semibold">Revizyon notu</DialogTitle>
          <DialogDescription>Not, işi yürüten kişinin önüne düşer.</DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-3">
          <input type="hidden" name="taskId" value={taskId} />
          <Textarea name="note" required minLength={8} rows={5} placeholder="Ne değişmeli?" />
          {state?.error ? <p className="text-sm font-medium text-destructive">{state.error}</p> : null}
          <DialogFooter>
            <Button type="submit" disabled={pending} variant="destructive" className="font-semibold">
              {pending ? "Gönderiliyor…" : "Revizyonu ilet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ApproveDialog({ taskId }: { taskId: string }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(approveTaskAction, null)
  useActionResult(state, () => setOpen(false))
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        className="bg-zinc-900 font-semibold text-white"
        onClick={() => setOpen(true)}
      >
        <Check />
        Onayla
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-semibold">Taslağı onayla</DialogTitle>
          <DialogDescription>
            Onaydan sonra masraf, müvekkil araması ve gönderim kararını siz verirsiniz.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-3">
          <input type="hidden" name="taskId" value={taskId} />
          <Textarea name="note" rows={4} placeholder="İsteğe bağlı onay notu" />
          {state?.error ? <p className="text-sm font-medium text-destructive">{state.error}</p> : null}
          <DialogFooter>
            <Button type="submit" disabled={pending} className="bg-zinc-900 font-semibold">
              {pending ? "Onaylanıyor…" : "Onayla"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function OpsControls({
  taskId,
  expensePaid,
  clientCallStatus,
  canQueueSend,
}: {
  taskId: string
  expensePaid: boolean
  clientCallStatus: ClientCallStatus
  canQueueSend: boolean
}) {
  const [expenseState, expenseAction, expensePending] = useActionState(markExpenseAction, null)
  const [callState, callAction, callPending] = useActionState(setClientCallAction, null)
  const [sendState, sendAction, sendPending] = useActionState(queueSendAction, null)
  useActionResult(expenseState)
  useActionResult(callState)
  useActionResult(sendState)

  return (
    <div className="mt-4 grid gap-3 rounded-xl border border-zinc-200 bg-white p-3">
      <p className="text-sm font-bold">Atayan avukat kararları</p>
      <div className="flex flex-wrap gap-2">
        <form action={expenseAction}>
          <input type="hidden" name="taskId" value={taskId} />
          <Button
            type="submit"
            disabled={expensePending || expensePaid}
            variant={expensePaid ? "secondary" : "outline"}
            className="font-semibold"
          >
            <Banknote />
            {expensePaid ? "Masraf yatırıldı" : "Masraf yatır"}
          </Button>
        </form>
        {clientCallStatus !== "ARANACAK" ? (
          <form action={callAction}>
            <input type="hidden" name="taskId" value={taskId} />
            <input type="hidden" name="status" value="ARANACAK" />
            <Button type="submit" disabled={callPending} variant="outline" className="font-semibold">
              <Phone />
              Arama yapılacak
            </Button>
          </form>
        ) : null}
        {clientCallStatus === "ARANACAK" ? (
          <form action={callAction}>
            <input type="hidden" name="taskId" value={taskId} />
            <input type="hidden" name="status" value="YAPILDI" />
            <Button type="submit" disabled={callPending} className="bg-red-600 font-semibold hover:bg-red-700">
              <PhoneOff />
              Arama yapıldı
            </Button>
          </form>
        ) : null}
        {clientCallStatus === "YAPILDI" ? (
          <span className="inline-flex items-center rounded-full bg-yellow-200 px-3 py-1 text-xs font-bold text-yellow-950">
            {CLIENT_CALL_META.YAPILDI}
          </span>
        ) : null}
      </div>
      {(expenseState?.error || callState?.error || sendState?.error) && (
        <p className="text-sm font-medium text-destructive">
          {expenseState?.error || callState?.error || sendState?.error}
        </p>
      )}
      {canQueueSend ? (
        <form action={sendAction}>
          <input type="hidden" name="taskId" value={taskId} />
          <Button type="submit" disabled={sendPending} className="w-full bg-zinc-900 font-semibold sm:w-auto">
            <Send />
            {sendPending ? "Alınıyor…" : "Gönderime al"}
          </Button>
        </form>
      ) : null}
    </div>
  )
}

function CompleteDialog({ taskId }: { taskId: string }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(completeTaskAction, null)
  useActionResult(state, () => setOpen(false))
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" className="mt-3 bg-zinc-900 font-semibold" onClick={() => setOpen(true)}>
        Gönderimi tamamla
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-semibold">Evrak takip kodu</DialogTitle>
          <DialogDescription>
            Kod girilmeden görev kapanmaz.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-3">
          <input type="hidden" name="taskId" value={taskId} />
          <Input
            name="trackingCode"
            maxLength={40}
            placeholder="2026-UYAP-18421"
            aria-label="Gönderim kodu"
            className="h-10 font-mono font-semibold"
            autoComplete="off"
          />
          {state?.error ? (
            <p className="text-sm font-medium text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={pending} className="font-semibold">
              {pending ? "Kaydediliyor…" : "Kodu işle ve kapat"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function TaskActions({
  taskId,
  myTurn,
  nextStep,
  canUpload,
  canReview,
  canManageOps,
  canQueueSend,
  canComplete,
  expensePaid,
  clientCallStatus,
  drive,
  latestDraft,
  trackingCode,
  completedLabel,
}: {
  taskId: string
  myTurn: boolean
  nextStep: string
  canUpload: boolean
  canReview: boolean
  canManageOps: boolean
  canQueueSend: boolean
  canComplete: boolean
  expensePaid: boolean
  clientCallStatus: ClientCallStatus
  drive: { mode: "google" | "mock"; reason: string | null }
  latestDraft: { name: string; href: string | null; external: boolean } | null
  trackingCode: string | null
  completedLabel: string | null
}) {
  return (
    <section
      className={cn(
        "rounded-xl border p-4",
        myTurn ? "border-yellow-300 bg-yellow-50" : "border-zinc-200 bg-white",
      )}
    >
      <p className="text-xs font-bold tracking-wide text-zinc-500 uppercase">Sıradaki adım</p>
      <p className="mt-1 text-sm font-semibold leading-relaxed text-zinc-900">{nextStep}</p>
      {latestDraft && canReview ? (
        <p className="mt-3 text-sm font-medium">
          Son taslak:{" "}
          {latestDraft.href ? (
            <a
              href={latestDraft.href}
              target={latestDraft.external ? "_blank" : undefined}
              rel={latestDraft.external ? "noreferrer" : undefined}
              className="font-bold underline underline-offset-4"
            >
              {latestDraft.name}
            </a>
          ) : (
            latestDraft.name
          )}
        </p>
      ) : null}
      {canUpload ? <UploadForm taskId={taskId} drive={drive} /> : null}
      {canReview ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <RevisionDialog taskId={taskId} />
          <ApproveDialog taskId={taskId} />
        </div>
      ) : null}
      {canManageOps ? (
        <OpsControls
          taskId={taskId}
          expensePaid={expensePaid}
          clientCallStatus={clientCallStatus}
          canQueueSend={canQueueSend}
        />
      ) : null}
      {canComplete ? <CompleteDialog taskId={taskId} /> : null}
      {trackingCode ? (
        <div className="mt-3 rounded-lg border border-yellow-300 bg-yellow-100 p-3">
          <p className="text-xs font-bold tracking-wide text-yellow-950 uppercase">Evrak takip kodu</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="font-mono text-base font-bold break-all">{trackingCode}</p>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Kodu kopyala"
              onClick={async () => {
                await navigator.clipboard.writeText(trackingCode)
                toast.success("Kod kopyalandı")
              }}
            >
              <Copy />
            </Button>
          </div>
          {completedLabel ? (
            <p className="mt-1 text-xs font-medium text-zinc-600">{completedLabel}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
