import { NewTaskForm } from "@/components/portal/new-task-form"
import { Button } from "@/components/ui/button"
import { getDriveStatus } from "@/lib/drive"
import { addDaysKey, istanbulDayKey } from "@/lib/format"
import { requireUser } from "@/lib/session"
import { canAssignTask } from "@/lib/workflow"
import { listAssignees } from "@/server/tasks"
import { getWorkItem } from "@/server/work-items"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "İş ata" }

export default async function AssignFromWorkItemPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireUser()
  const { id } = await params
  if (!canAssignTask(user.role)) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card px-6 py-12 text-center">
        <h1 className="text-2xl font-semibold">Yetki yok</h1>
        <Button asChild className="mt-5">
          <Link href="/gorevler">Görevlere dön</Link>
        </Button>
      </div>
    )
  }

  const item = await getWorkItem(user, id)
  const people = await listAssignees(user)
  const drive = getDriveStatus()
  const defaultDue = addDaysKey(istanbulDayKey(new Date()), 3)
  const description = [
    `Mahkeme: ${item.courtName}`,
    `Karşı taraf: ${item.opposingParty}`,
    `Dava dosyası: ${item.fileNumber}`,
    `Mahkeme dosyası: ${item.courtFile}`,
    "",
    `Yapılacak iş: ${item.workToDo}`,
    item.notes ? `Notlar: ${item.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n")

  return (
    <div className="mx-auto grid max-w-3xl gap-5">
      <div>
        <Link href="/is-listesi" className="text-sm text-muted-foreground hover:text-foreground">
          İş listesine dön
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Görev ver</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {item.clientName} · {item.fileNumber}
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4 md:p-6">
        {people.length === 0 ? (
          <p className="text-sm text-muted-foreground">Atanacak başka kullanıcı yok.</p>
        ) : (
          <NewTaskForm
            people={people}
            defaultDue={defaultDue}
            drive={drive}
            prefill={{
              workItemId: item.id,
              title: item.workToDo,
              clientName: item.clientName,
              fileNumber: item.fileNumber,
              description,
            }}
          />
        )}
      </div>
    </div>
  )
}
