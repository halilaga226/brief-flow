import { NewTaskForm } from "@/components/portal/new-task-form"
import { Button } from "@/components/ui/button"
import { getDriveStatus } from "@/lib/drive"
import { addDaysKey, istanbulDayKey } from "@/lib/format"
import { requireUser } from "@/lib/session"
import { canCreateTask } from "@/lib/workflow"
import { getTask, listAssignees } from "@/server/tasks"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Görev olarak ata" }

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; client?: string; file?: string }>
}) {
  const user = await requireUser()
  if (!canCreateTask(user.role)) {
    return (
      <div className="glass mx-auto max-w-lg rounded-2xl px-6 py-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Yetki yok</h1>
        <Button asChild className="mt-5">
          <Link href="/is-listesi">İş listesi</Link>
        </Button>
      </div>
    )
  }

  const params = await searchParams
  const people = await listAssignees(user)
  const drive = await getDriveStatus()
  const defaultDue = addDaysKey(istanbulDayKey(new Date()), 3)
  const source = params.from ? await getTask(user.id, user.role, params.from) : null

  const prefill = source
    ? {
        title: source.title,
        clientName: source.clientName,
        fileNumber: source.fileNumber,
        description: source.description,
      }
    : params.client || params.file
      ? {
          clientName: params.client ?? "",
          fileNumber: params.file ?? "",
        }
      : undefined

  return (
    <div className="mx-auto grid max-w-3xl gap-5">
      <div>
        <Link href="/is-listesi" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
          İş listesi
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Görev olarak ata</h1>
      </div>
      <div className="glass rounded-2xl p-4 md:p-6">
        {people.length === 0 ? (
          <p className="text-sm text-muted-foreground">Atanacak kullanıcı yok.</p>
        ) : (
          <NewTaskForm
            people={people}
            defaultDue={defaultDue}
            drive={drive}
            prefill={prefill}
          />
        )}
      </div>
    </div>
  )
}
