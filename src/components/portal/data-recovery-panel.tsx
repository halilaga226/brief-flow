"use client"

import { restoreClientPurgeAction } from "@/actions/clients"
import { restoreAllDeletedAction, restoreSnapshotAction } from "@/actions/tasks"
import { useActionResult } from "@/components/portal/use-action-result"
import { Button } from "@/components/ui/button"
import { RotateCcw } from "lucide-react"
import { useActionState } from "react"

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
  useActionResult(allState)
  useActionResult(purgeState)
  useActionResult(snapState)

  return (
    <section className="glass rounded-2xl p-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <RotateCcw className="size-5 text-emerald-600" />
        Veri geri getirme
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Soft-delete edilen kayıtları veya son yedekleri geri yükleyin. Eski “örnek sil”
        tüm işleri kalıcı silerdi; artık yalnızca örnek işler silinenlere taşınır.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <form action={allAction}>
          <Button type="submit" disabled={allPending} className="font-semibold">
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
              {snap.kind === "clear_demo" ? (
                <form action={snapAction}>
                  <input type="hidden" name="snapshotId" value={snap.id} />
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
              ) : snap.kind === "purge_clients" ? (
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
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Henüz yedek yok.</p>
      )}
    </section>
  )
}
