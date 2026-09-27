import { TaskWorkList } from "@/components/portal/task-work-list"
import { WorkItemAgenda } from "@/components/portal/work-item-agenda"
import { requireUser } from "@/lib/session"
import { canAssignTask, canCreateTask } from "@/lib/workflow"
import { listTasksCached } from "@/server/cached"
import { listWorkItems } from "@/server/work-items"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "İş listesi" }

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
      <div className="mx-auto grid max-w-[72rem] gap-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">İş listesi</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Atadığınız görevler ve mahkeme dosya kayıtları.
            </p>
          </div>
        </div>

        <section className="grid gap-3">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight">Verdiğim görevler</h2>
            <p className="text-sm font-medium text-muted-foreground tabular-nums">
              {given.length}
            </p>
          </div>
          <TaskWorkList
            tasks={given}
            canAssign={canAssign}
            userId={user.id}
            mode="given"
          />
        </section>

        <section className="grid gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Dosya kayıtları</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Mahkeme, dosya no, yapılacaklar ve özel not.
            </p>
          </div>
          <WorkItemAgenda items={items} canCreate showHeaderAction />
        </section>
      </div>
    )
  }

  const tasks = await listTasksCached(user.id, user.role)

  return (
    <div className="mx-auto grid max-w-[72rem] gap-4">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">İş listesi</h1>
      <TaskWorkList tasks={tasks} canAssign={false} userId={user.id} />
    </div>
  )
}
