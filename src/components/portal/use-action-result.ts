"use client"

import type { ActionState } from "@/lib/dto"
import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"
import { toast } from "sonner"

export function useActionResult(state: ActionState, onOk?: () => void) {
  const router = useRouter()
  const onOkRef = useRef(onOk)
  onOkRef.current = onOk

  useEffect(() => {
    if (!state) return
    if (state.error) toast.error(state.error)
    if (state.ok) {
      toast.success(state.message || "Kaydedildi")
      onOkRef.current?.()
      router.refresh()
    }
  }, [state, router])
}
