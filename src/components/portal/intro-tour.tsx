"use client"

import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

const KEY = "ak-intro-enabled"
const SEEN = "ak-intro-seen"

const STEPS = [
  {
    title: "Ana sayfa",
    body: "Geciken, yaklaşan ve sıradaki işlerinizi renkli bölgelerde görün.",
  },
  {
    title: "İş listesi",
    body: "Müvekkil ajandanızı tutun; satırdan İş ata ile görev verin.",
  },
  {
    title: "Görevler",
    body: "1 gün, 3 gün, 1 hafta ve 1 ay süzgeçleriyle teslimleri ayıklayın.",
  },
  {
    title: "Ayarlar",
    body: "Bu tanıtımı istediğiniz zaman yeniden açabilirsiniz.",
  },
]

export function useIntroEnabled() {
  const [enabled, setEnabled] = useState(false)
  useEffect(() => {
    try {
      setEnabled(localStorage.getItem(KEY) === "1")
    } catch {
      setEnabled(false)
    }
  }, [])
  return enabled
}

export function setIntroEnabled(value: boolean) {
  try {
    localStorage.setItem(KEY, value ? "1" : "0")
    if (value) localStorage.removeItem(SEEN)
  } catch {
    /* ignore */
  }
}

export function IntroTour() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) !== "1") return
      if (localStorage.getItem(SEEN) === "1") return
      setOpen(true)
    } catch {
      /* ignore */
    }
  }, [])

  if (!open) return null
  const current = STEPS[step]

  function finish() {
    try {
      localStorage.setItem(SEEN, "1")
    } catch {
      /* ignore */
    }
    setOpen(false)
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center">
      <div className="glass w-full max-w-md rounded-[1.6rem] p-5 sm:p-6">
        <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
          Tanıtım {step + 1}/{STEPS.length}
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">{current.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{current.body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={finish}>
            Kapat
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={() => setStep((value) => value + 1)}>
              İleri
            </Button>
          ) : (
            <Button type="button" onClick={finish}>
              Bitir
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export function IntroToggle() {
  const [on, setOn] = useState(false)
  useEffect(() => {
    try {
      setOn(localStorage.getItem(KEY) === "1")
    } catch {
      setOn(false)
    }
  }, [])

  return (
    <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
      <div>
        <p className="font-semibold">Tanıtım introsu</p>
      </div>
      <Button
        type="button"
        variant={on ? "default" : "secondary"}
        onClick={() => {
          const next = !on
          setIntroEnabled(next)
          setOn(next)
          if (next) window.location.assign("/ana")
        }}
      >
        {on ? "Açık" : "Kapalı"}
      </Button>
    </div>
  )
}
