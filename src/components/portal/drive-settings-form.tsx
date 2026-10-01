"use client"

import { saveDriveFolderAction } from "@/actions/clients"
import { useActionResult } from "@/components/portal/use-action-result"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ExternalLink } from "lucide-react"
import { useActionState } from "react"

export function DriveSettingsForm({
  folderId,
  folderLink,
  orgConnected,
}: {
  folderId: string | null
  folderLink: string | null
  orgConnected: boolean
}) {
  const [state, action, pending] = useActionState(saveDriveFolderAction, null)
  useActionResult(state)

  return (
    <section className="glass rounded-2xl p-4 md:p-5">
      <h2 className="text-lg font-semibold">Google Drive hesabı</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Kendi Drive klasörünüzü bağlayın. Klasörü büro servis hesabıyla{" "}
        <span className="font-semibold">Düzenleyici</span> olarak paylaşın; klasör kimliğini
        yapıştırın. İsterseniz stajyerlere otomatik yazma erişimi verin.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Ortak Drive API: {orgConnected ? "açık" : "kapalı (mock)"} — klasör kimliği sizin
        yüklemeleriniz ve stajyer erişimi için kullanılır.
      </p>
      {folderLink ? (
        <p className="mt-3">
          <a
            href={folderLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline underline-offset-4"
          >
            Bağlı klasörü aç
            <ExternalLink className="size-3.5" />
          </a>
        </p>
      ) : null}
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
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="shareInterns"
            value="1"
            defaultChecked
            className="mt-1 size-4 accent-[var(--brand-accent)]"
          />
          <span>
            Kaydederken tüm stajyer e-postalarına bu klasöre{" "}
            <span className="font-semibold">yazma</span> erişimi ver (Drive API gerekir).
          </span>
        </label>
        {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        <Button type="submit" disabled={pending} className="font-semibold sm:w-fit">
          {pending ? "Kaydediliyor…" : "Kaydet"}
        </Button>
      </form>
    </section>
  )
}
