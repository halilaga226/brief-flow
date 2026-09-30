"use client"

import { saveDriveFolderAction } from "@/actions/clients"
import { useActionResult } from "@/components/portal/use-action-result"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useActionState } from "react"

export function DriveSettingsForm({
  folderId,
  orgConnected,
}: {
  folderId: string | null
  orgConnected: boolean
}) {
  const [state, action, pending] = useActionState(saveDriveFolderAction, null)
  useActionResult(state)

  return (
    <section className="glass rounded-2xl p-4 md:p-5">
      <h2 className="text-lg font-semibold">Google Drive (isteğe bağlı)</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Kendi Drive klasörünüzü bağlayabilirsiniz. Diğer avukatlar için zorunlu değildir. Klasörü büro
        servis hesabıyla <span className="font-semibold">Düzenleyici</span> olarak paylaşın; ardından
        klasör kimliğini yapıştırın.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Ortak Drive API: {orgConnected ? "açık" : "kapalı (mock)"} — klasör kimliği yalnızca sizin
        yüklemeleriniz için kullanılır.
      </p>
      <form action={action} className="mt-4 grid gap-3 sm:max-w-lg">
        <div className="grid gap-1">
          <Label htmlFor="driveFolderId">Drive klasör kimliği</Label>
          <Input
            id="driveFolderId"
            name="driveFolderId"
            defaultValue={folderId ?? ""}
            placeholder="1AbC…xyz"
            className="h-10 font-mono text-sm"
          />
        </div>
        {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        <Button type="submit" disabled={pending} className="font-semibold sm:w-fit">
          {pending ? "Kaydediliyor…" : "Kaydet"}
        </Button>
      </form>
    </section>
  )
}
