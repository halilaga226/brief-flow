import { TaskDetailView } from "@/components/portal/task-detail"
import { getDriveStatus } from "@/lib/drive"
import { requireUser } from "@/lib/session"
import { getTask } from "@/server/tasks"
import { getTaskScoreState } from "@/server/xp"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const user = await requireUser()
  const task = await getTask(user.id, user.role, id)
  return { title: task?.title ?? "Görev" }
}

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUser()
  const task = await getTask(user.id, user.role, id)
  if (!task) notFound()
  const [drive, scoreState] = await Promise.all([getDriveStatus(), getTaskScoreState(user, id)])
  return (
    <TaskDetailView
      task={{
        ...task,
        canScore: scoreState?.canScore ?? false,
        internName: scoreState?.internName ?? task.assigneeName,
        score: scoreState?.score ?? null,
      }}
      currentUserId={user.id}
      drive={drive}
    />
  )
}
