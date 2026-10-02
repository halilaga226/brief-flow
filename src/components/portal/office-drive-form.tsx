"use client"

import { saveOfficeDriveAction } from "@/actions/drive-office"
import { useActionResult } from "@/components/portal/use-action-result"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useActionState } from "react"

export function OfficeDriveAdminForm({
  connected,
  folderId,
  serviceEmail,
  envSet,
  reason,
}: {
  connected: boolean
  folderId: string | null
  serviceEmail: string | null
  envSet: boolean
  reason: string | null
}) {
  const [state, action, pending] = useActionState(saveOfficeDriveAction, null)
  useActionResult(state)

  return (
    <section className="glass rounded-2xl p-4 md:p-5">
      <h2 className="text-lg font-semibold">Büro Google Drive (Halil)</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Servis hesabı JSON + ortak klasör kimliği. Klasörü servis e-postasıyla{" "}
        <span className="font-semibold">Düzenleyici</span> paylaşın; ardından kaydedin.
        Bağlantı test edilmeden kaydedilmez.
      </p>
      {envSet ? (
        <p className="mt-2 text-xs text-emerald-700">
          Ortam değişkenlerinde Drive tanımlı — Vercel/env önceliklidir.
        </p>
      ) : null}
      <p className="mt-2 text-xs text-muted-foreground">
        Durum:{" "}
        {connected ? (
          <span className="font-semibold text-emerald-700">bağlı</span>
        ) : (
          <span className="font-semibold text-amber-700">kapalı (mock)</span>
        )}
        {serviceEmail ? ` · ${serviceEmail}` : null}
        {reason ? ` — ${reason}` : null}
      </p>
      <form action={action} className="mt-4 grid gap-3">
        <div className="grid gap-1">
          <Label htmlFor="officeFolderId">Büro Drive klasör kimliği</Label>
          <Input
            id="officeFolderId"
            name="driveFolderId"
            defaultValue={folderId ?? ""}
            placeholder="1AbC…xyz"
            className="h-10 font-mono text-sm"
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="serviceAccountJson">
            Servis hesabı JSON {folderId ? "(değiştirmek için yapıştırın)" : ""}
          </Label>
          <Textarea
            id="serviceAccountJson"
            name="serviceAccountJson"
            rows={6}
            placeholder='{"type":"service_account","client_email":"...","private_key":"...",...}'
            className="font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">
            JSON sunucuda şifrelenerek saklanır. Boş bırakırsanız mevcut anahtar korunur.
          </p>
        </div>
        {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={pending} className="font-semibold">
            {pending ? "Test ediliyor…" : "Bağla ve kaydet"}
          </Button>
          <Button
            type="submit"
            name="clearDrive"
            value="1"
            disabled={pending}
            variant="outline"
            className="font-semibold"
          >
            Bağlantıyı kaldır
          </Button>
        </div>
      </form>
    </section>
  )
}
