import { IsListesiView } from "@/components/portal/is-listesi-view"
import { requireUser } from "@/lib/session"
import { canAssignTask, canCreateTask } from "@/lib/workflow"
import { listTasksCached } from "@/server/cached"
import { listWorkItems } from "@/server/work-items"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "İş listesi" }
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function WorkListPage() {
  const user = await requireUser()
  const canAssign = canAssignTask(user.role)
  const canManageFiles = canCreateTask(user.role)

  const [tasks, files] = await Promise.all([
    listTasksCached(user.id, user.role),
    canManageFiles ? listWorkItems(user) : Promise.resolve([]),
  ])

  return (
    <IsListesiView
      tasks={tasks}
      files={files}
      canAssign={canAssign}
      canManageFiles={canManageFiles}
      userId={user.id}
    />
  )
}
