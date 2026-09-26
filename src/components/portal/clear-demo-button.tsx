"use client"

import { clearDemoAction } from "@/actions/tasks"
import { Button } from "@/components/ui/button"
import { useActionResult } from "@/components/portal/use-action-result"
import { Trash2 } from "lucide-react"
import { useActionState, useState } from "react"

export function ClearDemoButton() {
  const [confirming, setConfirming] = useState(false)
  const [state, action, pending] = useActionState(clearDemoAction, null)
  useActionResult(state, () => setConfirming(false))

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="outline"
        className="font-bold text-red-700 ring-red-200 hover:bg-red-50"
        onClick={() => setConfirming(true)}
      >
        <Trash2 />
        Örnek işleri ve hesapları sil
      </Button>
    )
  }

  return (
    <form action={action} className="grid gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
      <p className="text-sm font-bold text-red-900">
        Tüm görevler ve @vekalet.local örnek hesaplar silinecek. Bu işlem geri alınamaz.
      </p>
      {state?.error ? <p className="text-sm font-medium text-destructive">{state.error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending} variant="destructive" className="font-bold">
          {pending ? "Siliniyor…" : "Evet, sıfırla"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="font-semibold"
          disabled={pending}
          onClick={() => setConfirming(false)}
        >
          Vazgeç
        </Button>
      </div>
    </form>
  )
}
