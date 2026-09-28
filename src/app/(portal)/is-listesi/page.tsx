import { TaskWorkList } from "@/components/portal/task-work-list"
import { WorkItemAgenda } from "@/components/portal/work-item-agenda"
import { Button } from "@/components/ui/button"
import { requireUser } from "@/lib/session"
import { canAssignTask, canManageWorkItems } from "@/lib/workflow"
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
  const canManageFiles = canManageWorkItems(user.role)

  const [items, tasks] = await Promise.all([
    canManageFiles ? listWorkItems(user) : Promise.resolve([]),
    listTasksCached(user.id, user.role),
  ])

  const given = tasks.filter((task) => task.assignerId === user.id)
  const mine = tasks.filter((task) => task.assigneeId === user.id)

  const showGiven = canAssign
  const taskSection = showGiven ? given : mine

  return (
    <div className="mx-auto w-full max-w-[80rem] space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">İş listesi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {canAssign
              ? "Verdiğiniz görevler ve dosya kayıtları (stajyer kayıtları dahil)."
              : "Size gelen görevler ve dosya kayıtlarınız."}
          </p>
        </div>
        {canManageFiles ? (
          <Button asChild className="font-semibold">
            <Link href="#is-ekle">
              <Plus />
              İş ekle
            </Link>
          </Button>
        ) : null}
      </div>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold">
            {showGiven ? "Verdiğim görevler" : "Görevlerim"}
          </h2>
          <span className="text-sm text-muted-foreground tabular-nums">{taskSection.length}</span>
        </div>
        <TaskWorkList
          tasks={taskSection}
          canAssign={canAssign}
          userId={user.id}
          mode={showGiven ? "given" : "all"}
        />
      </section>

      {canManageFiles ? (
        <section className="space-y-3" id="is-ekle">
          <h2 className="text-base font-semibold">Dosya kayıtları</h2>
          <WorkItemAgenda items={items} canCreate canAssign={canAssign} />
        </section>
      ) : null}
    </div>
  )
}
