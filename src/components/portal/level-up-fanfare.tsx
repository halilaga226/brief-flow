"use client"

import { LEVEL_UP_EVENT, parseLevelUp } from "@/lib/xp"
import { useEffect, useState } from "react"

type Fanfare = { id: number; rankTitle: string; level: number }

export function announceLevelUp(payload: { rankTitle: string; level: number }) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(LEVEL_UP_EVENT, { detail: payload }))
}

export function maybeAnnounceLevelUp(title: string, body = "") {
  const parsed = parseLevelUp(title, body)
  if (parsed) announceLevelUp(parsed)
}

export function LevelUpFanfare() {
  const [show, setShow] = useState<Fanfare | null>(null)

  useEffect(() => {
    let lastAt = 0
    const onUp = (event: Event) => {
      const detail = (event as CustomEvent<Partial<Fanfare>>).detail
      if (!detail?.rankTitle) return
      const now = Date.now()
      if (now - lastAt < 7000) return
      lastAt = now
      setShow({
        id: now,
        rankTitle: detail.rankTitle,
        level: Number(detail.level) || 1,
      })
    }
    window.addEventListener(LEVEL_UP_EVENT, onUp)
    return () => window.removeEventListener(LEVEL_UP_EVENT, onUp)
  }, [])

  useEffect(() => {
    if (!show) return
    const timer = window.setTimeout(() => setShow(null), 5200)
    return () => window.clearTimeout(timer)
  }, [show])

  if (!show) return null

  return (
    <div className="level-up-fanfare" role="status" aria-live="assertive">
      <div key={show.id} className="level-up-card">
        <p className="text-[11px] font-bold tracking-[0.22em] text-amber-200 uppercase">Başarı</p>
        <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-white">
          Seviye {show.level}
        </p>
        <p className="mt-1 text-lg font-semibold text-amber-100">{show.rankTitle}</p>
        <p className="mt-3 text-sm text-white/75">İş tamamlandı. Unvan yükseldi.</p>
        <div className="level-up-burst" aria-hidden>
          {Array.from({ length: 14 }, (_, i) => (
            <span key={i} style={{ ["--i" as string]: i }} />
          ))}
        </div>
      </div>
    </div>
  )
}
