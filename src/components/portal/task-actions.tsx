"use client"

import {
  approveTaskAction,
  completeTaskAction,
  requestRevisionAction,
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
import { cn } from "@/lib/utils"
import { Check, Copy, RotateCcw, Send } from "lucide-react"
import { useActionState, useState } from "react"
import { toast } from "sonner"

function DriveNote({ drive }: { drive: { mode: "google" | "mock"; reason: string | null } }) {
  return (
    <p className="text-xs leading-relaxed text-muted-foreground">
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
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending} className="bg-[#16324f] hover:bg-[#16324f]/90">
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
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <RotateCcw />
        Revize iste
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Revizyon notu</DialogTitle>
          <DialogDescription>
            Not, işi yürüten kişinin önüne düşer ve işlem geçmişine saatle yazılır.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-3">
          <input type="hidden" name="taskId" value={taskId} />
          <Textarea name="note" required minLength={8} rows={5} placeholder="Ne değişmeli?" />
          {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <DialogFooter>
            <Button type="submit" disabled={pending} variant="destructive">
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
      <Button type="button" className="bg-[#0f6e56] text-white hover:bg-[#0c5b48]" onClick={() => setOpen(true)}>
        <Check />
        Onayla
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Taslağı onayla</DialogTitle>
          <DialogDescription>
            İş gönderim adımına geçer. Karşı taraf evrak kodu girmeden kapatamaz.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-3">
          <input type="hidden" name="taskId" value={taskId} />
          <Textarea name="note" rows={4} placeholder="İsteğe bağlı onay notu" />
          {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <DialogFooter>
            <Button type="submit" disabled={pending} className="bg-[#0f6e56] text-white hover:bg-[#0c5b48]">
              {pending ? "Onaylanıyor…" : "Gönderime al"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CompleteDialog({ taskId }: { taskId: string }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(completeTaskAction, null)
  useActionResult(state, () => setOpen(false))
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" className="mt-3 bg-[#16324f]" onClick={() => setOpen(true)}>
        Gönderimi tamamla
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Evrak takip kodu</DialogTitle>
          <DialogDescription>
            UYAP evrak numarası, PTT barkodu veya merci işlem kodu zorunludur. Kod girilmeden görev kapanmaz.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-3">
          <input type="hidden" name="taskId" value={taskId} />
          <Input
            name="trackingCode"
            maxLength={40}
            placeholder="2026-UYAP-18421"
            aria-label="Gönderim kodu"
            className="h-10 font-mono"
            autoComplete="off"
          />
          {state?.error ? (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
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
  canComplete,
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
  canComplete: boolean
  drive: { mode: "google" | "mock"; reason: string | null }
  latestDraft: { name: string; href: string | null; external: boolean } | null
  trackingCode: string | null
  completedLabel: string | null
}) {
  return (
    <section
      className={cn(
        "rounded-xl p-4 ring-1",
        myTurn ? "bg-[#f4faf7] ring-[#b7d7c8]" : "bg-card ring-foreground/10",
      )}
    >
      <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">Sıradaki adım</p>
      <p className="mt-1 text-sm leading-relaxed">{nextStep}</p>
      {latestDraft && canReview ? (
        <p className="mt-3 text-sm">
          Son taslak:{" "}
          {latestDraft.href ? (
            <a
              href={latestDraft.href}
              target={latestDraft.external ? "_blank" : undefined}
              rel={latestDraft.external ? "noreferrer" : undefined}
              className="font-medium underline underline-offset-4"
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
      {canComplete ? <CompleteDialog taskId={taskId} /> : null}
      {trackingCode ? (
        <div className="mt-3 rounded-lg bg-white/80 p-3 ring-1 ring-[#bfe0d2]">
          <p className="text-xs tracking-[0.14em] text-[#0f5c45] uppercase">Evrak takip kodu</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="font-mono text-base break-all">{trackingCode}</p>
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
            <p className="mt-1 text-xs text-muted-foreground">{completedLabel}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
