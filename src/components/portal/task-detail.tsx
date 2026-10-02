import { CommentThread } from "@/components/portal/comment-thread"
import { MarkRead } from "@/components/portal/mark-read"
import { StatusBadge } from "@/components/portal/status-badge"
import { TaskActions } from "@/components/portal/task-actions"
import { TaskTimeline } from "@/components/portal/task-timeline"
import type { TaskDetailDTO } from "@/lib/dto"
import { roleLabel } from "@/lib/workflow"
import { FileText } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

function FileAnchor({
  href,
  external,
  children,
}: {
  href: string | null
  external: boolean
  children: ReactNode
}) {
  if (!href) return <span className="font-bold">{children}</span>
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="font-bold underline underline-offset-4">
        {children}
      </a>
    )
  }
  return (
    <Link href={href} className="font-bold underline underline-offset-4">
      {children}
    </Link>
  )
}

export function TaskDetailView({
  task,
  currentUserId,
  drive,
}: {
  task: TaskDetailDTO
  currentUserId: string
  drive: { mode: "google" | "mock"; reason: string | null }
}) {
  const drafts = task.files.filter((file) => file.kind === "DRAFT")
  const instructions = task.files.filter((file) => file.kind === "INSTRUCTION")

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <MarkRead taskId={task.id} />
      <div>
        <Link href="/gorevler" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
          Görevlere dön
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge status={task.status} />
          <span className="text-xs font-semibold text-muted-foreground">{task.relationLabel}</span>
        </div>
        <h1 className="mt-2 text-3xl font-bold leading-tight md:text-4xl">{task.title}</h1>
        <p className="mt-2 text-sm font-semibold text-muted-foreground">
          {task.clientName}
          <span className="px-1.5 font-normal text-border">·</span>
          <span className="font-mono">{task.fileNumber}</span>
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4">
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase">Talimat</h2>
            <p className="mt-2 text-sm font-medium leading-relaxed whitespace-pre-wrap text-foreground">
              {task.description}
            </p>
          </section>

          <TaskActions
            taskId={task.id}
            myTurn={task.myTurn}
            nextStep={task.nextStep}
            canUpload={task.canUpload}
            canReview={task.canReview}
            canTriage={task.canTriage}
            canMoveToCheck={task.canMoveToCheck}
            canManageOps={task.canManageOps}
            canQueueSend={task.canQueueSend}
            canComplete={task.canComplete}
            canAccept={task.canAccept}
            canDelete={task.canDelete}
            status={task.status}
            expensePaid={task.expensePaid}
            clientCallStatus={task.clientCallStatus}
            drive={drive}
            latestDraft={task.latestDraft}
            trackingCode={task.trackingCode}
            completedLabel={task.completedLabel}
          />

          {task.assignerDrive ? (
            <section className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase">
                Avukat Drive klasörü
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {task.assignerName} klasörüne erişiminiz varsa belgeleri oradan açabilirsiniz.
              </p>
              <a
                href={task.assignerDrive.link}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex text-sm font-semibold text-primary underline underline-offset-4"
              >
                {task.assignerDrive.name} — Drive klasörünü aç
              </a>
            </section>
          ) : null}

          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-xl font-bold">Belgeler</h2>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {drive.mode === "google"
                ? "Dosyalar Google Drive klasöründe. Burada yalnızca bağlantı ve meta veri durur."
                : "Drive bağlı değil. İçerik saklanmaz; kayıt ad, boyut ve yükleyen bilgisinden ibarettir."}
            </p>
            {task.files.length === 0 ? (
              <p className="mt-4 text-sm font-medium text-muted-foreground">Henüz belge yok.</p>
            ) : (
              <ul className="mt-4 grid gap-2">
                {[...instructions, ...drafts].map((file) => {
                  const draftIndex = drafts.findIndex((item) => item.id === file.id)
                  const label =
                    file.kind === "INSTRUCTION" ? "Talimat eki" : `Taslak v${draftIndex + 1}`
                  return (
                    <li key={file.id} className="flex gap-3 rounded-lg bg-yellow-50 px-3 py-2">
                      <FileText className="mt-0.5 size-4 shrink-0 text-foreground" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                          {label}
                        </p>
                        <FileAnchor href={file.href} external={file.external}>
                          {file.name}
                        </FileAnchor>
                        <p className="text-xs font-medium text-muted-foreground">
                          {file.sizeLabel} · {file.uploadedByName} · {file.when}
                          {file.storageMode === "mock" ? " · Drive bekleniyor" : " · Google Drive"}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <CommentThread taskId={task.id} comments={task.comments} currentUserId={currentUserId} />
        </div>

        <aside className="grid gap-4">
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase">Taraflar</h2>
            <dl className="mt-3 grid gap-3 text-sm font-semibold">
              <div>
                <dt className="text-xs font-bold text-muted-foreground">Atayan</dt>
                <dd>
                  {task.assignerName}
                  <span className="block text-xs font-medium text-muted-foreground">
                    {task.assignerTitle || roleLabel(task.assignerRole)}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-muted-foreground">Yürüten</dt>
                <dd>
                  {task.assigneeName}
                  <span className="block text-xs font-medium text-muted-foreground">
                    {task.assigneeTitle || roleLabel(task.assigneeRole)}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-muted-foreground">Son teslim</dt>
                <dd>{task.dueLabel}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-muted-foreground">Açılış</dt>
                <dd>{task.createdLabel}</dd>
              </div>
            </dl>
          </section>
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-xl font-bold">İşlem geçmişi</h2>
            <div className="mt-3">
              <TaskTimeline events={task.logs} />
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
