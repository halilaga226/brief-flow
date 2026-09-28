import { TaskWorkList } from "@/components/portal/task-work-list"
import { WorkItemAgenda } from "@/components/portal/work-item-agenda"
import { Button } from "@/components/ui/button"
import { requireUser } from "@/lib/session"
import { canAssignTask, canCreateTask } from "@/lib/workflow"
import { listTasksCached } from "@/server/cached"
import { listWorkItems } from "@/server/work-items"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Stajyer işleri" }
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function InternWorkPage() {
  const user = await requireUser()

  if (!canCreateTask(user.role)) {
    return (
      <div className="mx-auto max-w-lg px-6 py-12 text-center">
        <h1 className="text-2xl font-semibold">Yetki yok</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Stajyer iş listesi yalnızca avukat ve yöneticilere açıktır.
        </p>
        <Button asChild className="mt-5">
          <Link href="/is-listesi">İş listesine dön</Link>
        </Button>
      </div>
    )
  }

  const canAssign = canAssignTask(user.role)
  const [items, tasks] = await Promise.all([
    listWorkItems(user, "intern"),
    listTasksCached(user.id, user.role),
  ])

  const internTasks = tasks.filter((task) => task.assigneeRole === "INTERN")

  return (
    <div className="mx-auto w-full max-w-[80rem] space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Stajyer işleri</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Stajyerlerin dosya kayıtları ve görevleri. Müdahale yalnızca sizin atadığınız işlerde
          mümkündür; diğerlerini yalnızca görüntüleyebilirsiniz.
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold">Stajyer görevleri</h2>
          <span className="text-sm text-muted-foreground tabular-nums">{internTasks.length}</span>
        </div>
        <TaskWorkList
          tasks={internTasks}
          canAssign={canAssign}
          userId={user.id}
          actOnlyOwnAssignments
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold">Stajyer dosya kayıtları</h2>
          <span className="text-sm text-muted-foreground tabular-nums">{items.length}</span>
        </div>
        <WorkItemAgenda
          items={items}
          canCreate={false}
          canAssign={canAssign}
          currentUserId={user.id}
        />
      </section>
    </div>
  )
}
