import { TaskWorkList } from "@/components/portal/task-work-list"
import { Button } from "@/components/ui/button"
import { requireUser } from "@/lib/session"
import { canAssignTask, canCreateTask } from "@/lib/workflow"
import { listTasksCached } from "@/server/cached"
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
          Stajyer işleri yalnızca avukat ve yöneticilere açıktır.
        </p>
        <Button asChild className="mt-5">
          <Link href="/is-listesi">İş listesine dön</Link>
        </Button>
      </div>
    )
  }

  const canAssign = canAssignTask(user.role)
  const tasks = await listTasksCached(user.id, user.role)
  const internTasks = tasks
    .filter((task) => task.assigneeRole === "INTERN")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  return (
    <div className="mx-auto w-full max-w-[80rem] space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Stajyer işleri</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Stajyerlere atanmış tüm işler ve durumları. Müdahale yalnızca sizin atadığınız
            kayıtlarda mümkündür.
          </p>
        </div>
        <span className="text-sm text-muted-foreground tabular-nums">
          {internTasks.length} kayıt
        </span>
      </div>

      <TaskWorkList
        tasks={internTasks}
        canAssign={canAssign}
        userId={user.id}
        actOnlyOwnAssignments
      />
    </div>
  )
}
