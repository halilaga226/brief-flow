"use client"

import { LiveAlertToasts } from "@/components/portal/live-alert-toasts"
import type { NotificationDTO } from "@/lib/dto"
import dynamic from "next/dynamic"

const WelcomeSplash = dynamic(
  () => import("@/components/portal/welcome-splash").then((mod) => mod.WelcomeSplash),
  { ssr: false },
)

const IntroTour = dynamic(
  () => import("@/components/portal/intro-tour").then((mod) => mod.IntroTour),
  { ssr: false },
)

export function PortalOverlays({
  name,
  notifications,
}: {
  name: string
  notifications: NotificationDTO[]
}) {
  return (
    <>
      <WelcomeSplash name={name} />
      <IntroTour />
      <LiveAlertToasts items={notifications} />
    </>
  )
}
