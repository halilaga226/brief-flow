import { AppShell } from "@/components/portal/app-shell"
import { IntroTour } from "@/components/portal/intro-tour"
import { WelcomeSplash } from "@/components/portal/welcome-splash"
import { requireUser } from "@/lib/session"
import { listNotifications } from "@/server/tasks"

export const dynamic = "force-dynamic"

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  const notifications = await listNotifications(user.id)
  return (
    <AppShell user={user} notifications={notifications}>
      <WelcomeSplash name={user.name} />
      <IntroTour />
      {children}
    </AppShell>
  )
}
