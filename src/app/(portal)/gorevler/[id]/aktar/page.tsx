import { ForwardInternForm } from "@/components/portal/forward-intern-form"
import { Button } from "@/components/ui/button"
import { requireUser } from "@/lib/session"
import { canForwardToIntern } from "@/lib/workflow"
import { getTask, listAssignees } from "@/server/tasks"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

export const metadata: Metadata = { title: "Stajyere aktar" }

export default async function ForwardTaskPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireUser()
  const { id } = await params
  const task = await getTask(user.id, user.role, id)
  if (!task) notFound()

  if (
    !canForwardToIntern(
      {
        status: task.status,
        assignerId: task.assignerId,
        assigneeId: task.assigneeId,
        assigneeRole: task.assigneeRole,
      },
      user.id,
      user.role,
    )
  ) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card px-6 py-12 text-center">
        <h1 className="text-2xl font-semibold">Aktarılamaz</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Yalnızca başka bir avukatın size atadığı açık işi stajyere aktarabilirsiniz.
        </p>
        <Button asChild className="mt-5">
          <Link href={`/gorevler/${id}`}>Göreve dön</Link>
        </Button>
      </div>
    )
  }

  const people = await listAssignees(user)
  const interns = people.filter((person) => person.role === "INTERN")

  return (
    <div className="mx-auto grid max-w-xl gap-5">
      <div>
        <Link
          href={`/gorevler/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Göreve dön
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Stajyere aktar</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {task.title} — esas avukat {task.assignerName}. Aktarım ona bildirilir; inceleme yine
          esas avukata döner.
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4 md:p-6">
        {interns.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aktarılacak stajyer hesabı yok.</p>
        ) : (
          <ForwardInternForm taskId={task.id} interns={interns} />
        )}
      </div>
    </div>
  )
}
