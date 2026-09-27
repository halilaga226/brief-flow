import { TaskWorkList } from "@/components/portal/task-work-list"
import { Button } from "@/components/ui/button"
import { requireUser } from "@/lib/session"
import { canAssignTask } from "@/lib/workflow"
import { listTasks } from "@/server/tasks"
import { Plus } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "İş listesi" }

export default async function WorkListPage() {
  const user = await requireUser()
  const canAssign = canAssignTask(user.role)
  const tasks = await listTasks(user.id, user.role)

  return (
    <div className="mx-auto grid max-w-6xl gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">İş listesi</h1>
        {canAssign ? (
          <Button asChild className="font-bold">
            <Link href="/gorevler/yeni">
              <Plus />
              Görev olarak ata
            </Link>
          </Button>
        ) : null}
      </div>
      <TaskWorkList tasks={tasks} canAssign={canAssign} />
    </div>
  )
}
