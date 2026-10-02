"use client"

import { restoreClientPurgeAction } from "@/actions/clients"
import {
  createOfficeBackupAction,
  restoreAllDeletedAction,
  restoreSnapshotAction,
} from "@/actions/tasks"
import { useActionResult } from "@/components/portal/use-action-result"
import { Button } from "@/components/ui/button"
import { Download, RotateCcw, ShieldCheck, Upload } from "lucide-react"
import { useActionState, useRef, useState } from "react"
import { toast } from "sonner"

export function DataRecoveryPanel({
  snapshots,
}: {
  snapshots: {
    id: string
    kind: string
    label: string
    createdAt: string
    restoredAt: string | null
  }[]
}) {
  const [allState, allAction, allPending] = useActionState(restoreAllDeletedAction, null)
  const [purgeState, purgeAction, purgePending] = useActionState(restoreClientPurgeAction, null)
  const [snapState, snapAction, snapPending] = useActionState(restoreSnapshotAction, null)
  const [backupState, backupAction, backupPending] = useActionState(createOfficeBackupAction, null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  useActionResult(allState)
  useActionResult(purgeState)
  useActionResult(snapState)
  useActionResult(backupState)

  async function uploadRestore(file: File) {
    setUploading(true)
    try {
      const body = new FormData()
      body.set("file", file)
      const res = await fetch("/api/backups", { method: "POST", body })
      const data = (await res.json()) as { ok?: boolean; error?: string; result?: { tasks: number; clients: number } }
      if (!res.ok) {
        toast.error(data.error || "Geri yükleme başarısız.")
        return
      }
      toast.success(
        `Yedek yüklendi: ${data.result?.clients ?? 0} müvekkil, ${data.result?.tasks ?? 0} iş.`,
      )
      window.location.reload()
    } catch {
      toast.error("Yükleme sırasında hata oluştu.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <section className="glass rounded-2xl p-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <ShieldCheck className="size-5 text-emerald-600" />
        Yedekleme ve geri getirme
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Günlük otomatik yedek + elle yedek/indirme. Ofis bilgisayarında{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">desktop/</code> Yedek Ajanı ile
        yedekler diske de yazılır — site + bilgisayar birlikte güvence. Pahalı PITR şart değil.
      </p>
      <p className="mt-2 rounded-xl border border-border/80 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">Masaüstü ajan:</span> bilgisayarda{" "}
        <code className="text-xs">cd desktop && npm install && npm start</code> — portal URL +
        Vercel’deki <code className="text-xs">BACKUP_AGENT_TOKEN</code> ile bağlanır; klasöre
        otomatik JSON kaydeder.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <form action={backupAction}>
          <Button type="submit" disabled={backupPending} className="font-semibold">
            <ShieldCheck />
            {backupPending ? "Yedekleniyor…" : "Şimdi yedek al"}
          </Button>
        </form>
        <Button asChild variant="outline" className="font-semibold">
          <a href="/api/backups" download>
            <Download />
            Yedek indir (JSON)
          </a>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="font-semibold"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          <Upload />
          {uploading ? "Yükleniyor…" : "JSON’dan geri yükle"}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ""
            if (file) void uploadRestore(file)
          }}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <form action={allAction}>
          <Button type="submit" disabled={allPending} variant="secondary" className="font-semibold">
            <RotateCcw />
            {allPending ? "…" : "Silinenlerdekilerin tümünü geri getir"}
          </Button>
        </form>
        <form action={purgeAction}>
          <Button type="submit" disabled={purgePending} variant="outline" className="font-semibold">
            {purgePending ? "…" : "Son müvekkil yedeğini geri getir"}
          </Button>
        </form>
      </div>
      {allState?.error || purgeState?.error || snapState?.error || backupState?.error ? (
        <p className="mt-2 text-sm text-destructive">
          {allState?.error || purgeState?.error || snapState?.error || backupState?.error}
        </p>
      ) : null}

      {snapshots.length > 0 ? (
        <ul className="mt-4 divide-y divide-border rounded-xl border border-border">
          {snapshots.map((snap) => (
            <li
              key={snap.id}
              className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">{snap.label}</p>
                <p className="text-xs text-muted-foreground">
                  {snap.kind} · {new Date(snap.createdAt).toLocaleString("tr-TR")}
                  {snap.restoredAt ? " · geri yüklendi" : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {snap.kind === "office_backup" ? (
                  <>
                    <Button asChild size="sm" variant="outline" className="font-semibold">
                      <a href={`/api/backups?id=${snap.id}`} download>
                        <Download />
                        İndir
                      </a>
                    </Button>
                    <form action={snapAction}>
                      <input type="hidden" name="snapshotId" value={snap.id} />
                      <input type="hidden" name="kind" value="office_backup" />
                      <Button
                        type="submit"
                        size="sm"
                        variant="outline"
                        disabled={snapPending}
                        className="font-semibold"
                        onClick={(event) => {
                          if (
                            !window.confirm(
                              "Bu yedek mevcut verilerin üzerine yazılabilir. Devam?",
                            )
                          ) {
                            event.preventDefault()
                          }
                        }}
                      >
                        Geri yükle
                      </Button>
                    </form>
                  </>
                ) : null}
                {snap.kind === "clear_demo" ? (
                  <form action={snapAction}>
                    <input type="hidden" name="snapshotId" value={snap.id} />
                    <input type="hidden" name="kind" value="clear_demo" />
                    <Button
                      type="submit"
                      size="sm"
                      variant="outline"
                      disabled={snapPending}
                      className="font-semibold"
                    >
                      Geri yükle
                    </Button>
                  </form>
                ) : null}
                {snap.kind === "purge_clients" ? (
                  <form action={purgeAction}>
                    <input type="hidden" name="snapshotId" value={snap.id} />
                    <Button
                      type="submit"
                      size="sm"
                      variant="outline"
                      disabled={purgePending}
                      className="font-semibold"
                    >
                      Geri yükle
                    </Button>
                  </form>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Henüz yedek yok — “Şimdi yedek al” ile ilkini oluşturun.
        </p>
      )}
    </section>
  )
}
