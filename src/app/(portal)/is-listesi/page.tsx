import { TaskWorkList } from "@/components/portal/task-work-list"
import { WorkItemAgenda } from "@/components/portal/work-item-agenda"
import { Button } from "@/components/ui/button"
import { requireUser } from "@/lib/session"
import {
  canAssignTask,
  canManageWorkItems,
  isOnAssigneeWorkList,
} from "@/lib/workflow"
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
  const isLawyerView = canAssign

  const [items, tasks] = await Promise.all([
    canManageFiles
      ? listWorkItems(user, isLawyerView ? "own" : "all")
      : Promise.resolve([]),
    listTasksCached(user.id, user.role),
  ])

  const given = tasks.filter((task) => task.assignerId === user.id)
  const incoming = tasks.filter(
    (task) => task.assigneeId === user.id && isOnAssigneeWorkList(task.status),
  )
  // Avukata gönderilmiş işler atayanın listesinde öne çıkar
  const awaitingMe = given.filter((task) => task.status === "INCELEME_BEKLIYOR")

  return (
    <div className="mx-auto w-full max-w-[80rem] space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">İş listesi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {canAssign
              ? "Size gelen işler ve sizin verdiğiniz işler. Müvekkil/dosya için Müvekkiller sekmesine bakın."
              : "Size atanan aktif işler. Avukata gönderince listeden düşer."}
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
            {canAssign ? "Bana gelen" : "Görevlerim"}
          </h2>
          <span className="text-sm text-muted-foreground tabular-nums">{incoming.length}</span>
        </div>
        <TaskWorkList tasks={incoming} canAssign={false} userId={user.id} />
      </section>

      {canAssign ? (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-base font-semibold">
              Verdiğim görevler
              {awaitingMe.length > 0 ? (
                <span className="ml-2 text-sm font-medium text-orange-600">
                  ({awaitingMe.length} inceleme)
                </span>
              ) : null}
            </h2>
            <span className="text-sm text-muted-foreground tabular-nums">{given.length}</span>
          </div>
          <TaskWorkList
            tasks={given}
            canAssign={canAssign}
            userId={user.id}
            mode="given"
          />
        </section>
      ) : null}

      {canManageFiles ? (
        <section className="space-y-3" id="is-ekle">
          <h2 className="text-base font-semibold">Dosya kayıtları</h2>
          <WorkItemAgenda
            items={items}
            canCreate
            canAssign={canAssign}
            currentUserId={user.id}
          />
        </section>
      ) : null}
    </div>
  )
}
