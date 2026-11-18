"use client"

import { parseXpGain, XP_DROP_EVENT } from "@/lib/xp"
import { useEffect, useState } from "react"

type Drop = { id: number; points: number }

export function announceXpDrop(points: number) {
  if (typeof window === "undefined" || points < 1) return
  window.dispatchEvent(new CustomEvent(XP_DROP_EVENT, { detail: { points } }))
}

export function XpOrcDrop() {
  const [drop, setDrop] = useState<Drop | null>(null)

  useEffect(() => {
    const onDrop = (event: Event) => {
      const points = Number((event as CustomEvent<{ points?: number }>).detail?.points)
      if (!Number.isFinite(points) || points < 1) return
      setDrop({ id: Date.now(), points })
    }
    window.addEventListener(XP_DROP_EVENT, onDrop)
    return () => window.removeEventListener(XP_DROP_EVENT, onDrop)
  }, [])

  useEffect(() => {
    if (!drop) return
    const timer = window.setTimeout(() => setDrop(null), 5200)
    return () => window.clearTimeout(timer)
  }, [drop])

  if (!drop) return null

  return (
    <div className="xp-orc-stage" aria-live="assertive">
      <div key={drop.id} className="xp-orc">
        <span className="xp-orc-body" aria-hidden>
          🧌
        </span>
        <span className="xp-orc-chest" aria-hidden>
          🧰
        </span>
        <span className="xp-orc-burst">+{drop.points} XP</span>
      </div>
    </div>
  )
}

export function maybeAnnounceXp(title: string, body: string) {
  const points = parseXpGain(title, body)
  if (points) announceXpDrop(points)
}
