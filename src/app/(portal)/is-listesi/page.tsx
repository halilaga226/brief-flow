import { TaskWorkList } from "@/components/portal/task-work-list"
import { WorkItemAgenda } from "@/components/portal/work-item-agenda"
import { Button } from "@/components/ui/button"
import { requireUser } from "@/lib/session"
import {
  canAssignTask,
  canManageWorkItems,
  isOnMyUnifiedWorkList,
  unifiedWorkListRank,
} from "@/lib/workflow"
import { listTasksCached } from "@/server/cached"
import { listClientsForPicker } from "@/server/clients"
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

  const [items, tasks, clients] = await Promise.all([
    canManageFiles ? listWorkItems(user, "own") : Promise.resolve([]),
    listTasksCached(user.id, user.role),
    canManageFiles ? listClientsForPicker(user) : Promise.resolve([]),
  ])

  // Tek liste: bana atanan aktif + bana geri gelen inceleme/ops (stajyerdeyken ATANDI düşer)
  const myTasks = tasks
    .filter((task) => isOnMyUnifiedWorkList(task, user.id))
    .sort((a, b) => {
      const rank = unifiedWorkListRank(a.status) - unifiedWorkListRank(b.status)
      if (rank !== 0) return rank
      return b.updatedAt.localeCompare(a.updatedAt)
    })

  // Stajyere aktif atanmış işlerin dosya kayıtları avukat listesinden gizlensin
  const outboundWorkItemIds = new Set(
    tasks
      .filter(
        (task) =>
          task.assignerId === user.id &&
          task.assigneeId !== user.id &&
          (task.status === "ATANDI" || task.status === "REVIZE_ISTENDI") &&
          task.workItemId,
      )
      .map((task) => task.workItemId as string),
  )
  const visibleItems = items.filter((item) => !outboundWorkItemIds.has(item.id))

  const reviewCount = myTasks.filter((task) => task.status === "INCELEME_BEKLIYOR").length

  return (
    <div className="mx-auto w-full max-w-[80rem] space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">İş listesi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {canAssign
              ? "Kendi işleriniz tek listede. Stajyere atayınca listeden düşer; stajyer gönderince en üste gelir."
              : "Size atanan işler. Avukata gönderince listeden düşer; açıklamanız avukata iletilir."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canAssign ? (
            <>
              <Button asChild variant="outline" className="font-semibold">
                <Link href="/muvekkiller">Müvekkiller</Link>
              </Button>
              <Button asChild variant="outline" className="font-semibold">
                <Link href="/stajyer-isleri">Stajyer işleri</Link>
              </Button>
            </>
          ) : null}
          {canManageFiles ? (
            <Button asChild className="font-semibold">
              <Link href="#is-ekle">
                <Plus />
                İş ekle
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold">
            Görevlerim
            {reviewCount > 0 ? (
              <span className="ml-2 text-sm font-medium text-orange-600">
                ({reviewCount} inceleme)
              </span>
            ) : null}
          </h2>
          <span className="text-sm text-muted-foreground tabular-nums">{myTasks.length}</span>
        </div>
        <TaskWorkList
          tasks={myTasks}
          canAssign={canAssign}
          userId={user.id}
          mode="unified"
        />
      </section>

      {canManageFiles ? (
        <section className="space-y-3" id="is-ekle">
          <h2 className="text-base font-semibold">Dosya kayıtları</h2>
          <WorkItemAgenda
            items={visibleItems}
            clients={clients}
            canCreate
            canAssign={canAssign}
            currentUserId={user.id}
          />
        </section>
      ) : null}
    </div>
  )
}
