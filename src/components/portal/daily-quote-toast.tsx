"use client"

import { quoteForDate } from "@/lib/legal-quotes"
import { playNotificationBell } from "@/lib/welcome-sound"
import { Scale, X } from "lucide-react"
import { useEffect, useState } from "react"

const KEY = "brief-flow:daily-legal-quote"

export function DailyQuoteToast() {
  const [open, setOpen] = useState(false)
  const quote = quoteForDate()

  useEffect(() => {
    try {
      if (sessionStorage.getItem(`${KEY}:${quote.dayKey}`) === "1") return
      sessionStorage.setItem(`${KEY}:${quote.dayKey}`, "1")
    } catch {
      /* ignore */
    }
    setOpen(true)
    void playNotificationBell()
  }, [quote.dayKey])

  if (!open) return null

  return (
    <aside
      role="status"
      className="pointer-events-auto fixed top-3 left-3 z-[190] w-[min(24rem,calc(100vw-1.5rem))] animate-in slide-in-from-left-3 fade-in rounded-2xl border border-amber-400/50 bg-amber-50 p-4 text-amber-950 shadow-2xl dark:border-amber-700 dark:bg-amber-950 dark:text-amber-50"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-700 text-white">
          <Scale className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold tracking-[0.16em] text-red-800 uppercase dark:text-red-300">
            Günün hukuk sözü
          </p>
          <p className="mt-1 text-sm font-semibold leading-relaxed">“{quote.text}”</p>
          <p className="mt-2 text-xs font-medium opacity-70">{quote.source}</p>
        </div>
        <button
          type="button"
          className="rounded-md p-1 opacity-70 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
          aria-label="Kapat"
          onClick={() => setOpen(false)}
        >
          <X className="size-4" />
        </button>
      </div>
    </aside>
  )
}
