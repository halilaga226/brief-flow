import { HomeDashboard } from "@/components/portal/home-dashboard"
import { InternGameBoard } from "@/components/portal/intern-game-board"
import { greeting } from "@/lib/format"
import { requireUser } from "@/lib/session"
import { canCreateTask } from "@/lib/workflow"
import { getDashboardCached } from "@/server/cached"
import { listInternBoard } from "@/server/xp"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Ana sayfa" }

export default async function AnaSayfa() {
  const user = await requireUser()
  const [dashboard, board] = await Promise.all([
    getDashboardCached(user.id, user.role),
    listInternBoard(user),
  ])
  const firstName = user.name.split(" ")[0]
  const canAssign = canCreateTask(user.role)

  return (
    <HomeDashboard
      greeting={`${greeting()}, ${firstName}`}
      title={user.title}
      canAssign={canAssign}
      counts={dashboard.counts}
      awaiting={dashboard.awaiting.slice(0, 6)}
      activity={dashboard.activity.slice(0, 6)}
      gameBoard={<InternGameBoard rows={board} canAssign={canAssign} />}
    />
  )
}
