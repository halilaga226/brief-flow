"use client"

import {
  approveTaskAction,
  completeDirectlyAction,
  completeTaskAction,
  markExpenseAction,
  moveToCheckFolderAction,
  queueSendAction,
  requestRevisionAction,
  sendToLawyerAction,
  setClientCallAction,
} from "@/actions/tasks"
import { AcceptTaskButton, DeleteTaskButton } from "@/components/portal/task-lifecycle-buttons"
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
import {
  Banknote,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Phone,
  PhoneOff,
  RotateCcw,
  Send,
} from "lucide-react"
import { useActionState, useState } from "react"
import { toast } from "sonner"

function SendToLawyerForm({ taskId }: { taskId: string }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(sendToLawyerAction, null)
  useActionResult(state, () => setOpen(false))
  return (
    <div className="mt-3 grid gap-3">
      <p className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm leading-relaxed text-muted-foreground">
        İşi bitirdiğinizde avukata gönderin. Siteye veya Drive’a taslak yüklemeniz gerekmez; yaptığınız
        işi kısaca yazmanız yeterlidir.
      </p>
      <Button
        type="button"
        className="bg-primary font-semibold"
        onClick={() => setOpen(true)}
      >
        <Send />
        Avukata gönder
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-semibold">Avukata gönder</DialogTitle>
            <DialogDescription>
              Yapılanları yazın. Bu not avukata gider; iş sizin listeden kalkıp avukatın listesine düşer.
            </DialogDescription>
          </DialogHeader>
          <form action={action} className="grid gap-3">
            <input type="hidden" name="taskId" value={taskId} />
            <Textarea
              name="note"
              required
              minLength={8}
              rows={5}
              placeholder="Ne yaptınız? Hangi belge / işlem tamamlandı?"
            />
            {state?.error ? (
              <p className="text-sm font-medium text-destructive">{state.error}</p>
            ) : null}
            <DialogFooter>
              <Button type="submit" disabled={pending} className="font-semibold">
                {pending ? "Gönderiliyor…" : "Gönder"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
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
        className="bg-primary font-semibold text-primary-foreground"
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
            <Button type="submit" disabled={pending} className="bg-primary font-semibold">
              {pending ? "Onaylanıyor…" : "Onayla"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function TriageControls({
  taskId,
  status,
}: {
  taskId: string
  status: string
}) {
  const [checkState, checkAction, checkPending] = useActionState(moveToCheckFolderAction, null)
  const [doneOpen, setDoneOpen] = useState(false)
  const [doneState, doneAction, donePending] = useActionState(completeDirectlyAction, null)
  useActionResult(checkState)
  useActionResult(doneState, () => setDoneOpen(false))
  const inCheck = status === "KONTROL_EDILECEK"

  return (
    <div className="mt-3 grid gap-2 rounded-xl border border-border bg-muted/30 p-3">
      <p className="text-sm font-bold">Gelen işi yönlendir</p>
      <p className="text-xs text-muted-foreground">
        Kontrol edilecek klasörüne koyun (tamamlananlardan ayrı tutulur) veya doğrudan tamamlananlara alın.
      </p>
      <div className="flex flex-wrap gap-2">
        {!inCheck ? (
          <form action={checkAction}>
            <input type="hidden" name="taskId" value={taskId} />
            <Button
              type="submit"
              disabled={checkPending}
              variant="outline"
              className="font-semibold"
            >
              <ClipboardCheck />
              {checkPending ? "…" : "Kontrol edilecek"}
            </Button>
          </form>
        ) : (
          <span className="inline-flex items-center rounded-full bg-fuchsia-100 px-3 py-1 text-xs font-bold text-fuchsia-900">
            Kontrol klasöründe
          </span>
        )}
        <Button
          type="button"
          className="bg-emerald-600 font-semibold hover:bg-emerald-700"
          onClick={() => setDoneOpen(true)}
        >
          <CheckCircle2 />
          Tamamlananlara al
        </Button>
      </div>
      {checkState?.error ? (
        <p className="text-sm font-medium text-destructive">{checkState.error}</p>
      ) : null}
      <Dialog open={doneOpen} onOpenChange={setDoneOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-semibold">Tamamlananlara al</DialogTitle>
            <DialogDescription>
              İş doğrudan tamamlandı sayılır. İsteğe bağlı kısa bir not bırakabilirsiniz.
            </DialogDescription>
          </DialogHeader>
          <form action={doneAction} className="grid gap-3">
            <input type="hidden" name="taskId" value={taskId} />
            <Textarea name="note" rows={3} placeholder="İsteğe bağlı not" />
            {doneState?.error ? (
              <p className="text-sm font-medium text-destructive">{doneState.error}</p>
            ) : null}
            <DialogFooter>
              <Button type="submit" disabled={donePending} className="font-semibold">
                {donePending ? "Kaydediliyor…" : "Tamamla"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MoveCompletedToCheck({ taskId }: { taskId: string }) {
  const [state, action, pending] = useActionState(moveToCheckFolderAction, null)
  useActionResult(state)

  return (
    <div className="mt-3 grid gap-2 rounded-xl border border-border bg-muted/30 p-3">
      <p className="text-sm font-bold">Kontrol edileceklere al</p>
      <p className="text-xs text-muted-foreground">
        Bu iş tamamlananlardan çıkarılıp kontrol edilecek klasörüne taşınır.
      </p>
      <form action={action}>
        <input type="hidden" name="taskId" value={taskId} />
        <Button type="submit" disabled={pending} variant="outline" className="font-semibold">
          <ClipboardCheck />
          {pending ? "…" : "Kontrol edileceklere taşı"}
        </Button>
      </form>
      {state?.error ? (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      ) : null}
    </div>
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
    <div className="mt-4 grid gap-3 rounded-xl border border-border bg-card p-3">
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
          <Button type="submit" disabled={sendPending} className="w-full bg-primary font-semibold sm:w-auto">
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
      <Button type="button" className="mt-3 bg-primary font-semibold" onClick={() => setOpen(true)}>
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
  canTriage,
  canMoveToCheck,
  canManageOps,
  canQueueSend,
  canComplete,
  canAccept,
  canDelete,
  status,
  expensePaid,
  clientCallStatus,
  latestDraft,
  trackingCode,
  completedLabel,
}: {
  taskId: string
  myTurn: boolean
  nextStep: string
  canUpload: boolean
  canReview: boolean
  canTriage: boolean
  canMoveToCheck: boolean
  canManageOps: boolean
  canQueueSend: boolean
  canComplete: boolean
  canAccept: boolean
  canDelete: boolean
  status: string
  expensePaid: boolean
  clientCallStatus: ClientCallStatus
  drive?: { mode: "google" | "mock"; reason: string | null }
  latestDraft: { name: string; href: string | null; external: boolean } | null
  trackingCode: string | null
  completedLabel: string | null
}) {
  return (
    <section
      className={cn(
        "rounded-xl border p-4",
        myTurn || canAccept ? "border-[var(--brand-accent)]/40 bg-accent" : "border-border bg-card",
      )}
    >
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Sıradaki adım</p>
      <p className="mt-1 text-sm font-medium leading-relaxed text-foreground">{nextStep}</p>
      {canAccept ? (
        <div className="mt-3">
          <AcceptTaskButton taskId={taskId} />
        </div>
      ) : null}
      {latestDraft && canReview ? (
        <p className="mt-3 text-sm font-medium">
          Son taslak:{" "}
          {latestDraft.href ? (
            <a
              href={latestDraft.href}
              target={latestDraft.external ? "_blank" : undefined}
              rel={latestDraft.external ? "noreferrer" : undefined}
              className="font-semibold underline underline-offset-4"
            >
              {latestDraft.name}
            </a>
          ) : (
            latestDraft.name
          )}
        </p>
      ) : null}
      {canUpload ? <SendToLawyerForm taskId={taskId} /> : null}
      {canTriage ? <TriageControls taskId={taskId} status={status} /> : null}
      {!canTriage && canMoveToCheck && status === "TAMAMLANDI" ? (
        <MoveCompletedToCheck taskId={taskId} />
      ) : null}
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
          <p className="text-xs font-semibold tracking-wide text-yellow-950 uppercase">Evrak takip kodu</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="font-mono text-base font-semibold break-all">{trackingCode}</p>
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
            <p className="mt-1 text-xs font-medium text-muted-foreground">{completedLabel}</p>
          ) : null}
        </div>
      ) : null}
      {canDelete ? (
        <div className="mt-4 border-t border-border/60 pt-3">
          <DeleteTaskButton taskId={taskId} completed={status === "TAMAMLANDI"} />
        </div>
      ) : null}
    </section>
  )
}
