"use client"

import type { NotificationDTO } from "@/lib/dto"
import { playNotificationBell } from "@/lib/welcome-sound"
import { cn } from "@/lib/utils"
import { Bell, X } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"

const SEEN_KEY = "brief-flow:seen-live-alerts-v2"
const POLL_MS = 6_000
const AUTO_DISMISS_MS = 12_000
const DEMO_EVENT = "brief-flow:demo-alert"

type AlertTone = "sky" | "amber" | "rose" | "emerald" | "violet" | "cyan" | "slate"

type LiveAlert = NotificationDTO & { tone: AlertTone }

function toneFor(title: string): AlertTone {
  const t = title.toLocaleLowerCase("tr")
  if (t.includes("yeni iş") || t.includes("atandı") || t.includes("kabul")) return "sky"
  if (t.includes("revizyon") || t.includes("revize")) return "rose"
  if (t.includes("onay") || t.includes("tamamland")) return "emerald"
  if (t.includes("gönderim") || t.includes("gonderim")) return "violet"
  if (
    t.includes("inceleme") ||
    t.includes("taslak") ||
    t.includes("bekliyor") ||
    t.includes("kontrol")
  ) {
    return "amber"
  }
  if (t.includes("not") || t.includes("dosya") || t.includes("güncelle")) return "cyan"
  return "slate"
}

const TONE_UI: Record<
  AlertTone,
  { panel: string; badge: string; label: string; bar: string }
> = {
  sky: {
    panel: "border-sky-300 bg-sky-50 text-sky-950 shadow-sky-500/20 dark:border-sky-700 dark:bg-sky-950 dark:text-sky-50",
    badge: "bg-sky-500 text-white",
    label: "Yeni iş",
    bar: "bg-sky-500",
  },
  amber: {
    panel:
      "border-amber-300 bg-amber-50 text-amber-950 shadow-amber-500/20 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-50",
    badge: "bg-amber-500 text-white",
    label: "İnceleme",
    bar: "bg-amber-500",
  },
  rose: {
    panel:
      "border-rose-300 bg-rose-50 text-rose-950 shadow-rose-500/20 dark:border-rose-700 dark:bg-rose-950 dark:text-rose-50",
    badge: "bg-rose-500 text-white",
    label: "Revizyon",
    bar: "bg-rose-500",
  },
  emerald: {
    panel:
      "border-emerald-300 bg-emerald-50 text-emerald-950 shadow-emerald-500/20 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-50",
    badge: "bg-emerald-500 text-white",
    label: "Tamamlandı",
    bar: "bg-emerald-500",
  },
  violet: {
    panel:
      "border-violet-300 bg-violet-50 text-violet-950 shadow-violet-500/20 dark:border-violet-700 dark:bg-violet-950 dark:text-violet-50",
    badge: "bg-violet-500 text-white",
    label: "Gönderim",
    bar: "bg-violet-500",
  },
  cyan: {
    panel:
      "border-cyan-300 bg-cyan-50 text-cyan-950 shadow-cyan-500/20 dark:border-cyan-700 dark:bg-cyan-950 dark:text-cyan-50",
    badge: "bg-cyan-500 text-white",
    label: "Dosya / not",
    bar: "bg-cyan-500",
  },
  slate: {
    panel:
      "border-slate-300 bg-white text-slate-950 shadow-slate-500/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50",
    badge: "bg-slate-600 text-white",
    label: "Bildirim",
    bar: "bg-slate-500",
  },
}

function loadSeen(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SEEN_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as string[]
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

function saveSeen(ids: Set<string>) {
  try {
    sessionStorage.setItem(SEEN_KEY, JSON.stringify([...ids].slice(-120)))
  } catch {
    /* ignore */
  }
}

function showDesktop(item: NotificationDTO) {
  if (typeof window === "undefined" || !("Notification" in window)) return
  if (Notification.permission !== "granted") return
  try {
    const note = new Notification(item.title, {
      body: item.body,
      icon: "/icon.svg",
      tag: `brief-flow-${item.id}`,
    })
    note.onclick = () => {
      window.focus()
      window.location.href = `/gorevler/${item.taskId}`
      note.close()
    }
  } catch {
    /* ignore */
  }
}

/** Tüm bildirimler için büyük renkli popup + (izinliyse) masaüstü bildirimi. */
export function LiveAlertToasts({ items }: { items: NotificationDTO[] }) {
  const [queue, setQueue] = useState<LiveAlert[]>([])
  const seenRef = useRef<Set<string>>(new Set())
  const timersRef = useRef<Map<string, number>>(new Map())
  const readyRef = useRef(false)

  const dismiss = useCallback((id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const enqueue = useCallback(
    (incoming: NotificationDTO[]) => {
      if (!incoming.length) return
      const seen = seenRef.current
      const fresh = incoming.filter((item) => !seen.has(item.id))
      if (!fresh.length) return

      for (const item of fresh) {
        seen.add(item.id)
        showDesktop(item)
      }
      saveSeen(seen)
      void playNotificationBell()

      // En eski önce; ekranda en fazla 5 popup
      const alerts: LiveAlert[] = [...fresh]
        .reverse()
        .map((item) => ({ ...item, tone: toneFor(item.title) }))

      setQueue((prev) => {
        const ids = new Set(prev.map((p) => p.id))
        const merged = [...prev]
        for (const alert of alerts) {
          if (ids.has(alert.id)) continue
          merged.push(alert)
          ids.add(alert.id)
        }
        return merged.slice(-5)
      })

      for (const alert of alerts) {
        if (timersRef.current.has(alert.id)) continue
        const timer = window.setTimeout(() => dismiss(alert.id), AUTO_DISMISS_MS)
        timersRef.current.set(alert.id, timer)
      }
    },
    [dismiss],
  )

  useEffect(() => {
    seenRef.current = loadSeen()
    readyRef.current = true
    // İlk açılışta okunmamışların hepsini göster (okunmuşları atla)
    enqueue(items.filter((item) => !item.read))
  }, [enqueue, items])

  useEffect(() => {
    let cancelled = false
    const tick = async () => {
      try {
        const res = await fetch("/api/notifications", { cache: "no-store" })
        if (!res.ok || cancelled) return
        const data = (await res.json()) as { items?: NotificationDTO[] }
        if (!data.items?.length || cancelled) return
        // Polling: okunmamış + henüz görülmemiş her bildirim
        enqueue(data.items.filter((item) => !item.read))
      } catch {
        /* network */
      }
    }
    const id = window.setInterval(() => void tick(), POLL_MS)
    const onFocus = () => void tick()
    const onVis = () => {
      if (document.visibilityState === "visible") void tick()
    }
    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onVis)
    const onDemo = () => {
      const demo: NotificationDTO = {
        id: `demo-${Date.now()}`,
        title: "Yeni iş atandı",
        body: "Örnek bildirim — popup tasarımı böyle görünür.",
        read: false,
        when: "şimdi",
        taskId: "",
      }
      enqueue([demo])
    }
    window.addEventListener(DEMO_EVENT, onDemo)
    // Hemen bir kez daha çek (SSR listesi ile poll arasında kaçanlar)
    const boot = window.setTimeout(() => void tick(), 1200)
    return () => {
      cancelled = true
      window.clearInterval(id)
      window.clearTimeout(boot)
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onVis)
      window.removeEventListener(DEMO_EVENT, onDemo)
      for (const timer of timersRef.current.values()) window.clearTimeout(timer)
      timersRef.current.clear()
    }
  }, [enqueue])

  if (queue.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] flex flex-col items-end gap-3 p-3 sm:p-5"
      aria-live="polite"
    >
      {queue.map((item) => {
        const ui = TONE_UI[item.tone]
        return (
          <article
            key={item.id}
            role="alertdialog"
            aria-label={item.title}
            className={cn(
              "pointer-events-auto w-full max-w-md animate-in slide-in-from-top-3 fade-in overflow-hidden rounded-2xl border shadow-2xl duration-300",
              ui.panel,
            )}
          >
            <div className={cn("h-1.5 w-full", ui.bar)} />
            <div className="flex gap-3 p-4">
              <span
                className={cn(
                  "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl",
                  ui.badge,
                )}
              >
                <Bell className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase",
                      ui.badge,
                    )}
                  >
                    {ui.label}
                  </span>
                  <button
                    type="button"
                    className="rounded-md p-1 opacity-70 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
                    aria-label="Kapat"
                    onClick={() => dismiss(item.id)}
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <p className="mt-1.5 text-base font-bold leading-snug">{item.title}</p>
                <p className="mt-1 text-sm leading-relaxed opacity-90">{item.body}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Link
                    href={item.taskId ? `/gorevler/${item.taskId}` : "/gorevler"}
                    className={cn(
                      "inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-bold text-white",
                      ui.bar,
                    )}
                    onClick={() => dismiss(item.id)}
                  >
                    {item.taskId ? "Görevi aç" : "Görevler"}
                  </Link>
                  <button
                    type="button"
                    className="rounded-lg px-3 py-1.5 text-sm font-semibold opacity-80 hover:bg-black/5 dark:hover:bg-white/10"
                    onClick={() => dismiss(item.id)}
                  >
                    Sonra
                  </button>
                  <span className="ml-auto text-[11px] font-medium opacity-60">{item.when}</span>
                </div>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
