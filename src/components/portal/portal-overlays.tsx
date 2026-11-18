"use client"

import { DailyQuoteToast } from "@/components/portal/daily-quote-toast"
import { LiveAlertToasts } from "@/components/portal/live-alert-toasts"
import { XpOrcDrop } from "@/components/portal/xp-orc-drop"
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
      <DailyQuoteToast />
      <XpOrcDrop />
      <LiveAlertToasts items={notifications} />
    </>
  )
}
