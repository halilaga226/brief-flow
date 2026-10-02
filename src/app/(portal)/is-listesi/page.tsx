import { TaskWorkList } from "@/components/portal/task-work-list"
import { Button } from "@/components/ui/button"
import { requireUser } from "@/lib/session"
import {
  canAssignTask,
  isOnMyUnifiedWorkList,
  unifiedWorkListRank,
} from "@/lib/workflow"
import { listTasksCached } from "@/server/cached"
import { Plus } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "İş listesi" }
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function WorkListPage() {
  const user = await requireUser()
  const canAssign = canAssignTask(user.role)
  const tasks = await listTasksCached(user.id, user.role)

  const myTasks = tasks
    .filter((task) => isOnMyUnifiedWorkList(task, user.id))
    .sort((a, b) => {
      const rank = unifiedWorkListRank(a.status) - unifiedWorkListRank(b.status)
      if (rank !== 0) return rank
      return b.updatedAt.localeCompare(a.updatedAt)
    })

  const reviewCount = myTasks.filter((task) => task.status === "INCELEME_BEKLIYOR").length

  return (
    <div className="mx-auto w-full max-w-[80rem] space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            İş listesi
            {reviewCount > 0 ? (
              <span className="ml-2 text-base font-medium text-orange-600">
                ({reviewCount} inceleme)
              </span>
            ) : null}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {canAssign
              ? "Kendi işleriniz. Stajyere atayınca listeden düşer; geri gelince üste çıkar."
              : "Size atanan işler. Avukata gönderince listeden düşer."}
          </p>
        </div>
        {canAssign ? (
          <Button asChild className="font-semibold">
            <Link href="/gorevler/yeni">
              <Plus />
              İş ekle
            </Link>
          </Button>
        ) : null}
      </div>

      <TaskWorkList
        tasks={myTasks}
        canAssign={canAssign}
        userId={user.id}
        mode="unified"
      />
    </div>
  )
}
