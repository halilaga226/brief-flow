"use client"

import dynamic from "next/dynamic"

const WelcomeSplash = dynamic(
  () => import("@/components/portal/welcome-splash").then((mod) => mod.WelcomeSplash),
  { ssr: false },
)

const IntroTour = dynamic(
  () => import("@/components/portal/intro-tour").then((mod) => mod.IntroTour),
  { ssr: false },
)

export function PortalOverlays({ name }: { name: string }) {
  return (
    <>
      <WelcomeSplash name={name} />
      <IntroTour />
    </>
  )
}
