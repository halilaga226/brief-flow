import { CaseFileEditor } from "@/components/portal/clients-view"
import { StatusBadge } from "@/components/portal/status-badge"
import { Button } from "@/components/ui/button"
import { requireUser } from "@/lib/session"
import { canCreateTask, type TaskStatus } from "@/lib/workflow"
import { getCaseFileDetail } from "@/server/clients"
import { UserPlus } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Dosya" }
export const dynamic = "force-dynamic"

export default async function CaseFilePage({
  params,
}: {
  params: Promise<{ id: string; dosyaId: string }>
}) {
  const user = await requireUser()
  const { id, dosyaId } = await params
  if (!canCreateTask(user.role)) {
    return (
      <div className="mx-auto max-w-lg px-6 py-12 text-center">
        <h1 className="text-2xl font-semibold">Yetki yok</h1>
        <Button asChild className="mt-5">
          <Link href="/is-listesi">İş listesi</Link>
        </Button>
      </div>
    )
  }

  const file = await getCaseFileDetail(user, dosyaId)

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <Link
          href={`/muvekkiller/${id}`}
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          {file.clientName}
        </Link>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-mono text-2xl font-semibold tracking-tight sm:text-3xl">
              {file.fileNumber}
            </h1>
            {file.courtName ? (
              <p className="mt-1 text-sm text-muted-foreground">{file.courtName}</p>
            ) : null}
          </div>
          <Button asChild className="font-semibold">
            <Link
              href={`/gorevler/yeni?client=${encodeURIComponent(file.clientName)}&file=${encodeURIComponent(file.fileNumber)}&caseFileId=${file.id}`}
            >
              <UserPlus />
              Bu dosyadan iş ata
            </Link>
          </Button>
        </div>
        {file.notes ? (
          <p className="mt-3 text-sm whitespace-pre-wrap text-muted-foreground">{file.notes}</p>
        ) : null}
        <div className="mt-4">
          <CaseFileEditor
            clientId={id}
            file={{
              id: file.id,
              fileNumber: file.fileNumber,
              courtName: file.courtName,
              notes: file.notes,
            }}
          />
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Bu dosyadaki işler</h2>
        {file.tasks.length === 0 ? (
          <p className="border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            Henüz iş yok
          </p>
        ) : (
          <ul className="overflow-hidden rounded-lg border border-border">
            {file.tasks.map((task) => (
              <li
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 last:border-b-0"
              >
                <div className="min-w-0">
                  <Link href={`/gorevler/${task.id}`} className="font-bold hover:underline">
                    {task.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {task.assignerName} → {task.assigneeName} · {task.dueLabel}
                  </p>
                </div>
                <StatusBadge status={task.status as TaskStatus} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
