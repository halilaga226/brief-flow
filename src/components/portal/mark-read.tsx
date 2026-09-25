"use client"

import { markTaskReadAction } from "@/actions/auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function MarkRead({ taskId }: { taskId: string }) {
  const router = useRouter()
  useEffect(() => {
    let live = true
    markTaskReadAction(taskId).then((count) => {
      if (live && count > 0) router.refresh()
    })
    return () => {
      live = false
    }
  }, [taskId, router])
  return null
}
