"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef, useState, type ReactNode } from "react"

export function HolidayPageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const first = useRef(true)
  const [veil, setVeil] = useState(false)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (!document.documentElement.classList.contains("yilbasi")) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    setVeil(true)
    const hide = window.setTimeout(() => setVeil(false), 720)
    return () => window.clearTimeout(hide)
  }, [pathname])

  return (
    <>
      <div key={pathname} className="yilbasi-page">
        {children}
      </div>
      {veil ? (
        <div className="yilbasi-route-veil" aria-hidden>
          <span>❄</span>
          <span>✦</span>
          <span>❄</span>
        </div>
      ) : null}
    </>
  )
}
