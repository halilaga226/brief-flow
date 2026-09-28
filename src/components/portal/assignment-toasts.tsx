"use client"

import type { NotificationDTO } from "@/lib/dto"
import { useEffect } from "react"
import { toast } from "sonner"

const SEEN_KEY = "brief-flow:seen-assign-toasts"

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
    sessionStorage.setItem(SEEN_KEY, JSON.stringify([...ids].slice(-40)))
  } catch {
    /* ignore quota */
  }
}

/** Yeni iş atanınca ekranda toast gösterir (bir kez / oturum). */
export function AssignmentToasts({ items }: { items: NotificationDTO[] }) {
  useEffect(() => {
    const seen = loadSeen()
    let changed = false
    for (const item of items) {
      if (item.read) continue
      if (item.title !== "Yeni iş atandı") continue
      if (seen.has(item.id)) continue
      seen.add(item.id)
      changed = true
      toast.info(item.title, {
        description: item.body,
        duration: 8000,
        action: {
          label: "Aç",
          onClick: () => {
            window.location.href = `/gorevler/${item.taskId}`
          },
        },
      })
    }
    if (changed) saveSeen(seen)
  }, [items])

  return null
}
