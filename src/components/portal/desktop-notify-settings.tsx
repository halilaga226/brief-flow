"use client"

import { Button } from "@/components/ui/button"
import { BellRing } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

type Permission = NotificationPermission | "unsupported"

export function DesktopNotifySettings() {
  const [permission, setPermission] = useState<Permission>("default")

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported")
      return
    }
    setPermission(Notification.permission)
  }, [])

  async function enable() {
    if (!("Notification" in window)) {
      toast.error("Bu tarayıcı masaüstü bildirimi desteklemiyor.")
      return
    }
    const result = await Notification.requestPermission()
    setPermission(result)
    if (result === "granted") {
      toast.success("Masaüstü bildirimleri açıldı.", {
        description: "Yeni iş ve dosya güncellemeleri popup olarak gelir.",
        className: "border-l-4 border-l-emerald-500 bg-emerald-50 text-emerald-950",
      })
      try {
        new Notification("Atlı Karakaya", {
          body: "Bildirimler hazır. Yeni iş geldiğinde buradan haber veririz.",
          icon: "/icon.svg",
          tag: "brief-flow-notify-test",
        })
      } catch {
        /* ignore */
      }
    } else if (result === "denied") {
      toast.error("Bildirim izni reddedildi.", {
        description: "Tarayıcı ayarlarından tekrar açabilirsiniz.",
        className: "border-l-4 border-l-rose-500 bg-rose-50 text-rose-950",
      })
    }
  }

  const label =
    permission === "granted"
      ? "Masaüstü bildirimleri açık"
      : permission === "denied"
        ? "Bildirim izni kapalı — tarayıcıdan açın"
        : permission === "unsupported"
          ? "Bu tarayıcı desteklemiyor"
          : "Masaüstü bildirimlerini aç"

  return (
    <section className="glass rounded-2xl p-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <BellRing className="size-5 text-sky-600" />
        Canlı bildirimler
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Yeni iş atandığında veya dosyada güncelleme olduğunda ekranda renkli popup ve (izin
        verirseniz) bilgisayar bildirimi gösterilir.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          className="font-semibold"
          disabled={permission === "granted" || permission === "unsupported"}
          onClick={() => void enable()}
        >
          <BellRing />
          {permission === "granted" ? "Açık" : "Bildirim izni ver"}
        </Button>
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <ul className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
        <li className="rounded-lg border-l-4 border-l-sky-500 bg-sky-50 px-3 py-2 text-sky-950 dark:bg-sky-950/40 dark:text-sky-100">
          Mavi — yeni iş
        </li>
        <li className="rounded-lg border-l-4 border-l-amber-500 bg-amber-50 px-3 py-2 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
          Amber — inceleme / taslak
        </li>
        <li className="rounded-lg border-l-4 border-l-rose-500 bg-rose-50 px-3 py-2 text-rose-950 dark:bg-rose-950/40 dark:text-rose-100">
          Kırmızı — revizyon
        </li>
        <li className="rounded-lg border-l-4 border-l-emerald-500 bg-emerald-50 px-3 py-2 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100">
          Yeşil — onay / tamamlandı
        </li>
        <li className="rounded-lg border-l-4 border-l-violet-500 bg-violet-50 px-3 py-2 text-violet-950 dark:bg-violet-950/40 dark:text-violet-100">
          Mor — gönderim
        </li>
        <li className="rounded-lg border-l-4 border-l-cyan-500 bg-cyan-50 px-3 py-2 text-cyan-950 dark:bg-cyan-950/40 dark:text-cyan-100">
          Cyan — not / dosya güncellemesi
        </li>
      </ul>
    </section>
  )
}
