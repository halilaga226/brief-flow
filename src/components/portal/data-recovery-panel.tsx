"use client"

import { restoreClientPurgeAction } from "@/actions/clients"
import {
  restoreAllDeletedAction,
  restoreSnapshotAction,
} from "@/actions/tasks"
import { useActionResult } from "@/components/portal/use-action-result"
import { Button } from "@/components/ui/button"
import { Download, RotateCcw, ShieldCheck, Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import { useActionState, useRef, useState } from "react"
import { toast } from "sonner"

function filenameFromDisposition(header: string | null) {
  if (!header) return null
  const match = /filename="([^"]+)"/i.exec(header)
  return match?.[1] ?? null
}

function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

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
  const router = useRouter()
  const [allState, allAction, allPending] = useActionState(restoreAllDeletedAction, null)
  const [purgeState, purgeAction, purgePending] = useActionState(restoreClientPurgeAction, null)
  const [snapState, snapAction, snapPending] = useActionState(restoreSnapshotAction, null)
  const [downloading, setDownloading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  useActionResult(allState)
  useActionResult(purgeState)
  useActionResult(snapState)

  async function downloadFreshBackup() {
    setDownloading(true)
    try {
      const res = await fetch("/api/backups", { method: "GET", cache: "no-store" })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        toast.error(data?.error || "Yedek indirilemedi.")
        return
      }
      const blob = await res.blob()
      const filename =
        filenameFromDisposition(res.headers.get("Content-Disposition")) ||
        `atli-karakaya-yedek-${new Date().toISOString().slice(0, 10)}.json`
      triggerBrowserDownload(blob, filename)
      toast.success(`Yedek indirildi: ${filename}`)
      router.refresh()
    } catch {
      toast.error("İndirme sırasında hata oluştu.")
    } finally {
      setDownloading(false)
    }
  }

  async function downloadSnapshot(snapshotId: string) {
    try {
      const res = await fetch(`/api/backups?id=${encodeURIComponent(snapshotId)}`, {
        method: "GET",
        cache: "no-store",
      })
      if (!res.ok) {
        toast.error("Bu yedek indirilemedi.")
        return
      }
      const blob = await res.blob()
      const filename =
        filenameFromDisposition(res.headers.get("Content-Disposition")) ||
        `atli-karakaya-yedek-${snapshotId.slice(0, 8)}.json`
      triggerBrowserDownload(blob, filename)
      toast.success("Yedek indirildi.")
    } catch {
      toast.error("İndirme sırasında hata oluştu.")
    }
  }

  async function uploadRestore(file: File) {
    if (
      !window.confirm(
        `"${file.name}" yedeği mevcut portal verisinin üzerine yazılabilir. Devam etmek istiyor musunuz?`,
      )
    ) {
      return
    }
    setUploading(true)
    try {
      const body = new FormData()
      body.set("file", file)
      const res = await fetch("/api/backups", { method: "POST", body })
      const data = (await res.json()) as {
        ok?: boolean
        error?: string
        result?: { tasks: number; clients: number; files?: number }
      }
      if (!res.ok) {
        toast.error(data.error || "Geri yükleme başarısız.")
        return
      }
      toast.success(
        `Yedek yüklendi: ${data.result?.clients ?? 0} müvekkil, ${data.result?.tasks ?? 0} iş.`,
      )
      router.refresh()
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
        Anlık yedek tarayıcıya JSON olarak iner. Aynı dosyayı buradan geri yükleyebilirsiniz.
        Ofis PC’deki Yedek Ajanı isteğe bağlı ek güvencedir.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-background/50 p-3">
          <p className="text-sm font-semibold">1 · Anlık yedek indir</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Siteden taze yedek alır ve bilgisayarınıza otomatik indirir.
          </p>
          <Button
            type="button"
            className="mt-3 font-semibold"
            disabled={downloading}
            onClick={() => void downloadFreshBackup()}
          >
            <Download />
            {downloading ? "İndiriliyor…" : "Yedek al ve indir"}
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-background/50 p-3">
          <p className="text-sm font-semibold">2 · Yedekten yükle</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Daha önce indirdiğiniz <code className="text-[11px]">.json</code> dosyasını seçin;
            portal verisi bu yedekten geri gelir.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-3 font-semibold"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            <Upload />
            {uploading ? "Yükleniyor…" : "JSON yedek seç ve yükle"}
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
      </div>

      <p className="mt-3 rounded-xl border border-border/80 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">Masaüstü uygulama:</span> sitedeki
        portalun aynısını bilgisayarda açar ve yedek alır.{" "}
        <a
          className="font-semibold text-foreground underline underline-offset-2"
          href="https://github.com/halilaga226/brief-flow/releases/download/yedek-ajani-v1.1.0/Atli-Karakaya-Windows-Portable.zip"
        >
          Windows paketini indir
        </a>
        . Anahtar: <code className="text-xs">BACKUP_AGENT_TOKEN</code>.
      </p>

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
      {allState?.error || purgeState?.error || snapState?.error ? (
        <p className="mt-2 text-sm text-destructive">
          {allState?.error || purgeState?.error || snapState?.error}
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
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="font-semibold"
                      onClick={() => void downloadSnapshot(snap.id)}
                    >
                      <Download />
                      İndir
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
          Henüz sunucu yedeği yok — «Yedek al ve indir» ile ilkini oluşturun.
        </p>
      )}
    </section>
  )
}
