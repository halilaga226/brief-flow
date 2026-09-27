import { TaskWorkList } from "@/components/portal/task-work-list"
import { WorkItemAgenda } from "@/components/portal/work-item-agenda"
import { Button } from "@/components/ui/button"
import { requireUser } from "@/lib/session"
import { canAssignTask, canCreateTask } from "@/lib/workflow"
import { listTasksCached } from "@/server/cached"
import { listWorkItems } from "@/server/work-items"
import { Plus } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "İş listesi" }
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function WorkListPage() {
  const user = await requireUser()
  const canAssign = canAssignTask(user.role)
  const canManageWork = canCreateTask(user.role)

  if (canManageWork) {
    const [items, tasks] = await Promise.all([
      listWorkItems(user),
      listTasksCached(user.id, user.role),
    ])
    const given = tasks.filter((task) => task.assignerId === user.id)

    return (
      <div className="mx-auto w-full max-w-[80rem] space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">İş listesi</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Verdiğiniz görevler ve dosya kayıtları — satır satır liste.
            </p>
          </div>
          <Button asChild className="font-semibold">
            <Link href="#is-ekle">
              <Plus />
              İş ekle
            </Link>
          </Button>
        </div>

        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-base font-semibold">Verdiğim görevler</h2>
            <span className="text-sm text-muted-foreground tabular-nums">{given.length}</span>
          </div>
          <TaskWorkList tasks={given} canAssign={canAssign} userId={user.id} mode="given" />
        </section>

        <section className="space-y-3" id="is-ekle">
          <h2 className="text-base font-semibold">Dosya kayıtları</h2>
          <WorkItemAgenda items={items} canCreate />
        </section>
      </div>
    )
  }

  const tasks = await listTasksCached(user.id, user.role)

  return (
    <div className="mx-auto w-full max-w-[80rem] space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">İş listesi</h1>
      <TaskWorkList tasks={tasks} canAssign={false} userId={user.id} />
    </div>
  )
}
