import { TaskWorkList } from "@/components/portal/task-work-list"
import { requireUser } from "@/lib/session"
import { canAssignTask } from "@/lib/workflow"
import { listTasksCached } from "@/server/cached"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "İş listesi" }

export default async function WorkListPage() {
  const user = await requireUser()
  const canAssign = canAssignTask(user.role)
  const tasks = await listTasksCached(user.id, user.role)

  return (
    <div className="mx-auto grid max-w-[72rem] gap-4">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">İş listesi</h1>
      <TaskWorkList tasks={tasks} canAssign={canAssign} userId={user.id} />
    </div>
  )
}
