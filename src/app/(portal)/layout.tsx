import { AppShell } from "@/components/portal/app-shell"
import { PortalOverlays } from "@/components/portal/portal-overlays"
import { requireUser } from "@/lib/session"
import { getNotificationsCached } from "@/server/cached"

export const dynamic = "force-dynamic"

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  const notifications = await getNotificationsCached(user.id)
  return (
    <AppShell user={user} notifications={notifications}>
      <PortalOverlays name={user.name} notifications={notifications} />
      {children}
    </AppShell>
  )
}
