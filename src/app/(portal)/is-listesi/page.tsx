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

  const myTasks = tasks
    .filter((task) => isOnMyUnifiedWorkList(task, user.id))
    .sort((a, b) => {
      const rank = unifiedWorkListRank(a.status) - unifiedWorkListRank(b.status)
      if (rank !== 0) return rank
      return b.updatedAt.localeCompare(a.updatedAt)
    })

  const reviewCount = myTasks.filter((task) => task.status === "INCELEME_BEKLIYOR").length
  const openPersonal = items.filter((item) => !item.completedAt).length

  return (
    <div className="mx-auto w-full max-w-[80rem] space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            İş listem
            {reviewCount > 0 ? (
              <span className="ml-2 text-base font-medium text-orange-600">
                ({reviewCount} inceleme)
              </span>
            ) : null}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {canAssign
              ? "Kişisel listeniz — iş ekleyin, kendiniz tamamlayın. Stajyere atama isteğe bağlıdır. Stajyer listeleri «Stajyer işleri»nde."
              : "Kişisel iş listeniz ve size atanan görevler. Avukata gönderince görev listeden düşer."}
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

      {canManageFiles ? (
        <section className="space-y-3" id="is-ekle">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold">Kişisel işlerim</h2>
              <p className="text-sm text-muted-foreground">
                {canAssign
                  ? "İsterseniz müvekkil bağlayın. Atama zorunlu değil — «Tamamla» veya isteğe bağlı «Stajyere ata»."
                  : "Kendi işlerinizi ekleyin; müvekkil bağlamak isteğe bağlıdır."}
              </p>
            </div>
            <span className="text-sm text-muted-foreground tabular-nums">
              {openPersonal} açık / {items.length}
            </span>
          </div>
          <WorkItemAgenda
            items={items}
            clients={clients}
            canCreate
            canAssign={canAssign}
            currentUserId={user.id}
          />
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-base font-semibold">
          {canAssign ? "Üzerimdeki / inceleme görevleri" : "Görevlerim"}
        </h2>
        <TaskWorkList
          tasks={myTasks}
          canAssign={canAssign}
          userId={user.id}
          mode="unified"
        />
      </section>
    </div>
  )
}
