"use client"

import { importPartiesAction } from "@/actions/party-import"
import { useActionResult } from "@/components/portal/use-action-result"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useActionState } from "react"

export function PartyImportForm() {
  const [state, action, pending] = useActionState(importPartiesAction, null)
  useActionResult(state)

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-base font-semibold">Taraf JSON içe aktar (Halil)</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Aynı kişi tekrar eklenmez. Yeniden yüklediğinizde yalnızca yeni veya değişen
        kayıtlar işlenir; dosyalar müvekkil altında toplanır.
      </p>
      <form action={action} className="mt-3 grid gap-3">
        <div className="grid gap-1">
          <Label htmlFor="party-file">JSON dosyası</Label>
          <input
            id="party-file"
            name="file"
            type="file"
            accept="application/json,.json"
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-primary-foreground"
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="jsonText">veya JSON yapıştır</Label>
          <Textarea
            id="jsonText"
            name="jsonText"
            rows={5}
            placeholder='[{"ad":"Deniz Acar","dosyalar":[{"dosyaNo":"2026/1","mahkeme":"Ankara"}]}]'
            className="font-mono text-xs"
          />
        </div>
        {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        <Button type="submit" disabled={pending} className="font-semibold sm:w-fit">
          {pending ? "Aktarılıyor…" : "İçe aktar"}
        </Button>
      </form>
    </section>
  )
}
