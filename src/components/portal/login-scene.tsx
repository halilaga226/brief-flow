"use client"

import { LoginForm } from "@/components/portal/login-form"
import { ThemeToggle } from "@/components/theme-toggle"
import { BRAND } from "@/lib/brand"
import { useEffect, useState } from "react"

export function LoginScene({ showDemo = false }: { showDemo?: boolean }) {
  const [showVideo, setShowVideo] = useState(false)

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const saveData = "connection" in navigator && Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData)
    if (reduce || saveData) return
    const idle = window.setTimeout(() => setShowVideo(true), 400)
    return () => window.clearTimeout(idle)
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 scale-105 bg-cover bg-center"
          style={{ backgroundImage: "url(/media/horses-poster.jpg)" }}
          aria-hidden
        />
        {showVideo ? (
          <video
            className="absolute inset-0 h-full w-full scale-105 object-cover opacity-80"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/media/horses-poster.jpg"
            aria-hidden
          >
            <source src="/media/horses.mp4" type="video/mp4" />
          </video>
        ) : null}
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/45" />
      </div>

      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-5 py-12">
        <h1 className="mb-8 text-center font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {BRAND.portalName}
        </h1>
        <div className="w-full rounded-[1.6rem] border border-white/15 bg-white/12 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
          <div className="rounded-2xl bg-white/90 p-4 text-zinc-900 dark:bg-zinc-900/90 dark:text-zinc-50">
            <LoginForm showDemo={showDemo} />
          </div>
        </div>
      </div>
    </div>
  )
}
