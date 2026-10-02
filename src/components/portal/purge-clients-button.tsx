"use client"

import { purgeAllClientsAction } from "@/actions/clients"
import { useActionResult } from "@/components/portal/use-action-result"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useActionState, useState } from "react"

export function PurgeClientsButton() {
  const [confirming, setConfirming] = useState(false)
  const [typed, setTyped] = useState("")
  const [state, action, pending] = useActionState(purgeAllClientsAction, null)
  useActionResult(state, () => {
    setConfirming(false)
    setTyped("")
  })

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="outline"
        className="font-semibold text-red-700 ring-red-200 hover:bg-red-50 dark:text-red-300"
        onClick={() => setConfirming(true)}
      >
        <Trash2 />
        Müvekkilleri sil
      </Button>
    )
  }

  const unlocked = typed.trim().toLocaleUpperCase("tr") === "SIL"

  return (
    <form action={action} className="grid gap-3 rounded-xl border border-red-300 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/40">
      <div>
        <p className="text-sm font-bold text-red-950 dark:text-red-100">
          Tüm müvekkiller ve dosyalar kalıcı silinir
        </p>
        <p className="mt-1 text-xs text-red-900/80 dark:text-red-200/80">
          Silinenler klasörüne gitmez. İçe aktarım izleri temizlenir; taraf JSON’unu tekrar
          yükleyebilirsiniz. Görevler silinmez, yalnızca dosya bağlantısı kopar.
        </p>
      </div>
      <label className="grid gap-1 text-sm font-medium text-red-950 dark:text-red-100">
        Onay için <span className="font-mono">SIL</span> yazın
        <input
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
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
          className="font-semibold"
        >
          {pending ? "Siliniyor…" : "Evet, tüm müvekkilleri sil"}
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
