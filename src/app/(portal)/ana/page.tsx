import { HomeDashboard } from "@/components/portal/home-dashboard"
import { greeting } from "@/lib/format"
import { requireUser } from "@/lib/session"
import { canCreateTask } from "@/lib/workflow"
import { getDashboardCached } from "@/server/cached"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Ana sayfa" }

export default async function AnaSayfa() {
  const user = await requireUser()
  const dashboard = await getDashboardCached(user.id, user.role)
  const firstName = user.name.split(" ")[0]

  return (
    <HomeDashboard
      greeting={`${greeting()}, ${firstName}`}
      title={user.title}
      canAssign={canCreateTask(user.role)}
      counts={dashboard.counts}
      awaiting={dashboard.awaiting.slice(0, 6)}
      activity={dashboard.activity.slice(0, 6)}
    />
  )
}
