"use client"

import { playWelcomeChime } from "@/lib/welcome-sound"
import { useEffect, useState } from "react"

const FLAG = "ak-welcome"

export function markWelcomePending() {
  try {
    sessionStorage.setItem(FLAG, "1")
  } catch {
    /* ignore */
  }
}

export function WelcomeSplash({ name }: { name: string }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(FLAG) !== "1") return
      sessionStorage.removeItem(FLAG)
    } catch {
      return
    }
    setShow(true)
    void playWelcomeChime()
    const timer = window.setTimeout(() => setShow(false), 3000)
    return () => window.clearTimeout(timer)
  }, [])

  if (!show) return null

  const first = name.split(" ")[0] || name

  return (
    <div className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center bg-black/35 backdrop-blur-md">
      <div className="animate-[welcome-in_3s_ease-in-out_forwards] rounded-[2rem] border border-white/20 bg-white/15 px-10 py-8 text-center shadow-2xl backdrop-blur-2xl dark:bg-white/10">
        <p className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Hoş geldin
        </p>
        <p className="mt-2 text-lg font-medium text-white/85">{first}</p>
      </div>
    </div>
  )
}
