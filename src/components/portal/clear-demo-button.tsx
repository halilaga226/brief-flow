"use client"

import { clearDemoAction } from "@/actions/tasks"
import { Button } from "@/components/ui/button"
import { useActionResult } from "@/components/portal/use-action-result"
import { Trash2 } from "lucide-react"
import { useActionState, useState } from "react"

export function ClearDemoButton() {
  const [confirming, setConfirming] = useState(false)
  const [typed, setTyped] = useState("")
  const [state, action, pending] = useActionState(clearDemoAction, null)
  useActionResult(state, () => {
    setConfirming(false)
    setTyped("")
  })

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="outline"
        className="font-bold text-red-700 ring-red-200 hover:bg-red-50"
        onClick={() => setConfirming(true)}
      >
        <Trash2 />
        Yalnızca örnek işleri silinenlere taşı
      </Button>
    )
  }

  const unlocked = typed.trim().toLocaleUpperCase("tr") === "ORNEK SIL"

  return (
    <form action={action} className="grid gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/40">
      <div>
        <p className="text-sm font-bold text-red-950 dark:text-red-100">
          Yalnızca örnek (demo) hesaplara bağlı işler silinenlere taşınır
        </p>
        <p className="mt-1 text-xs text-red-900/80 dark:text-red-200/80">
          Gerçek büro işleri silinmez. Soft-delete yapılır; Silinenler’den geri yükleyebilirsiniz.
          Önce otomatik yedek alınır.
        </p>
      </div>
      <input type="hidden" name="confirm" value={typed} />
      <label className="grid gap-1 text-sm font-medium text-red-950 dark:text-red-100">
        Onay için <span className="font-mono">ORNEK SIL</span> yazın
        <input
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          name="confirmPhrase"
          className="h-9 rounded-md border border-red-300 bg-white px-3 font-mono text-sm dark:border-red-800 dark:bg-background"
          autoComplete="off"
          spellCheck={false}
        />
      </label>
      {state?.error ? <p className="text-sm font-medium text-destructive">{state.error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          disabled={pending || !unlocked}
          variant="destructive"
          className="font-bold"
        >
          {pending ? "Taşınıyor…" : "Evet, örnek işleri taşı"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="font-semibold"
          disabled={pending}
          onClick={() => {
            setConfirming(false)
            setTyped("")
          }}
        >
          Vazgeç
        </Button>
      </div>
    </form>
  )
}
