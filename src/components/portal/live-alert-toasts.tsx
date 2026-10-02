"use client"

import type { NotificationDTO } from "@/lib/dto"
import { useEffect, useRef } from "react"
import { toast } from "sonner"

const SEEN_KEY = "brief-flow:seen-live-alerts"
const POLL_MS = 18_000

type AlertTone = "sky" | "amber" | "rose" | "emerald" | "violet" | "cyan" | "slate"

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

const TONE_CLASS: Record<AlertTone, string> = {
  sky: "border-l-4 border-l-sky-500 bg-sky-50 text-sky-950 dark:bg-sky-950/50 dark:text-sky-50",
  amber:
    "border-l-4 border-l-amber-500 bg-amber-50 text-amber-950 dark:bg-amber-950/50 dark:text-amber-50",
  rose: "border-l-4 border-l-rose-500 bg-rose-50 text-rose-950 dark:bg-rose-950/50 dark:text-rose-50",
  emerald:
    "border-l-4 border-l-emerald-500 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-50",
  violet:
    "border-l-4 border-l-violet-500 bg-violet-50 text-violet-950 dark:bg-violet-950/50 dark:text-violet-50",
  cyan: "border-l-4 border-l-cyan-500 bg-cyan-50 text-cyan-950 dark:bg-cyan-950/50 dark:text-cyan-50",
  slate:
    "border-l-4 border-l-slate-400 bg-slate-50 text-slate-950 dark:bg-slate-900/60 dark:text-slate-50",
}

const TONE_ICON: Record<AlertTone, "info" | "warning" | "error" | "success" | "message"> = {
  sky: "info",
  amber: "warning",
  rose: "error",
  emerald: "success",
  violet: "info",
  cyan: "message",
  slate: "message",
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
    sessionStorage.setItem(SEEN_KEY, JSON.stringify([...ids].slice(-80)))
  } catch {
    /* ignore */
  }
}

function showDesktop(item: NotificationDTO) {
  if (typeof window === "undefined" || !("Notification" in window)) return
  if (Notification.permission !== "granted") return
  if (document.hasFocus()) return
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

function popup(item: NotificationDTO) {
  const tone = toneFor(item.title)
  const method = TONE_ICON[tone]
  const opts = {
    description: item.body,
    duration: 9000,
    className: `${TONE_CLASS[tone]} shadow-lg`,
    action: {
      label: "Aç",
      onClick: () => {
        window.location.href = `/gorevler/${item.taskId}`
      },
    },
  }
  if (method === "success") toast.success(item.title, opts)
  else if (method === "warning") toast.warning(item.title, opts)
  else if (method === "error") toast.error(item.title, opts)
  else if (method === "info") toast.info(item.title, opts)
  else toast.message(item.title, opts)
  showDesktop(item)
}

function announce(items: NotificationDTO[], seen: Set<string>) {
  let changed = false
  // En eski önce — popup sırası doğal
  const fresh = [...items].filter((item) => !item.read && !seen.has(item.id)).reverse()
  for (const item of fresh) {
    seen.add(item.id)
    changed = true
    popup(item)
  }
  if (changed) saveSeen(seen)
  return changed
}

/** Okunmamış bildirimler için renkli popup + (izinliyse) masaüstü bildirimi; periyodik yoklama. */
export function LiveAlertToasts({ items }: { items: NotificationDTO[] }) {
  const bootstrapped = useRef(false)

  useEffect(() => {
    const seen = loadSeen()
    if (!bootstrapped.current) {
      bootstrapped.current = true
      // İlk yüklemede yalnızca son 2 dakikadaki / okunmamışları göster — eski gürültüyü kes
      const recent = items.filter((item) => !item.read)
      announce(recent.slice(0, 4), seen)
    } else {
      announce(items, seen)
    }
  }, [items])

  useEffect(() => {
    let cancelled = false
    const tick = async () => {
      if (document.visibilityState === "hidden") return
      try {
        const res = await fetch("/api/notifications", { cache: "no-store" })
        if (!res.ok || cancelled) return
        const data = (await res.json()) as { items?: NotificationDTO[] }
        if (!data.items?.length || cancelled) return
        announce(data.items, loadSeen())
      } catch {
        /* network */
      }
    }
    const id = window.setInterval(() => void tick(), POLL_MS)
    const onFocus = () => void tick()
    window.addEventListener("focus", onFocus)
    return () => {
      cancelled = true
      window.clearInterval(id)
      window.removeEventListener("focus", onFocus)
    }
  }, [])

  return null
}
