"use client"

import {
  getStoredTune,
  isHolidayOn,
  isMusicOn,
  setHolidayOn,
  setMusicOn,
  setStoredTune,
  startTune,
  stopTune,
  TUNES,
  type TuneId,
} from "@/lib/christmas-tunes"
import { cn } from "@/lib/utils"
import { Music, Music2, Snowflake, VolumeX } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

const FLAKES = Array.from({ length: 18 }, (_, i) => i)
const LIGHTS = Array.from({ length: 28 }, (_, i) => i)
const BULB = ["yilbasi-bulb-red", "yilbasi-bulb-gold", "yilbasi-bulb-green", "yilbasi-bulb-ice"] as const

type SantaPass = {
  id: number
  from: "left" | "right" | "top"
  top: number
  left: number
  dur: number
  size: number
  opacity: number
}

function nextSanta(id: number): SantaPass {
  const from = (["left", "right", "top"] as const)[Math.floor(Math.random() * 3)]
  return {
    id,
    from,
    top: from === "top" ? -8 : 8 + Math.random() * 78,
    left: from === "left" ? -10 : from === "right" ? 108 : 10 + Math.random() * 80,
    dur: 11 + Math.random() * 7,
    size: 14 + Math.random() * 8,
    opacity: 0.28 + Math.random() * 0.18,
  }
}

export function HolidayLayer() {
  const [on, setOn] = useState(false)
  const [music, setMusic] = useState(false)
  const [tune, setTune] = useState<TuneId>("jingle")
  const [santa, setSanta] = useState<SantaPass | null>(null)
  const [open, setOpen] = useState(false)

  const apply = useCallback((enabled: boolean) => {
    document.documentElement.classList.toggle("yilbasi", enabled)
  }, [])

  useEffect(() => {
    const enabled = isHolidayOn()
    const wantMusic = isMusicOn()
    const stored = getStoredTune()
    setOn(enabled)
    setTune(stored)
    setMusic(wantMusic)
    apply(enabled)
  }, [apply])

  useEffect(() => {
    if (!on) {
      stopTune()
      return
    }
    if (music) {
      void startTune(tune)
    } else {
      stopTune()
    }
    return () => stopTune()
  }, [on, music, tune])

  useEffect(() => {
    if (!on) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) return
    let n = 0
    let hide: number | undefined
    const spawn = () => {
      n += 1
      const pass = nextSanta(n)
      setSanta(pass)
      hide = window.setTimeout(() => setSanta(null), pass.dur * 1000)
    }
    const first = window.setTimeout(spawn, 12_000 + Math.random() * 16_000)
    const loop = window.setInterval(
      () => {
        if (Math.random() < 0.55) spawn()
      },
      42_000 + Math.random() * 28_000,
    )
    return () => {
      window.clearTimeout(first)
      window.clearInterval(loop)
      if (hide) window.clearTimeout(hide)
    }
  }, [on])

  const flakes = useMemo(
    () =>
      FLAKES.map((i) => ({
        id: i,
        left: `${(i * 23 + 7) % 100}%`,
        delay: `${(i % 11) * 0.85}s`,
        dur: `${14 + (i % 8)}s`,
        size: 3 + (i % 4),
      })),
    [],
  )

  if (!on && !open) {
    return (
      <button
        type="button"
        className="fixed right-3 bottom-20 z-[80] rounded-full border border-border bg-card/90 px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur md:bottom-4"
        onClick={() => {
          setHolidayOn(true)
          setOn(true)
          apply(true)
        }}
      >
        Yılbaşı teması
      </button>
    )
  }

  return (
    <>
      {on ? (
        <div className="pointer-events-none fixed inset-0 z-[30] overflow-hidden" aria-hidden>
          <div className="yilbasi-lights">
            {LIGHTS.map((i) => (
              <span
                key={i}
                className={cn("yilbasi-bulb", BULB[i % BULB.length])}
                style={{ animationDelay: `${(i % 8) * 0.18}s` }}
              />
            ))}
          </div>
          {flakes.map((flake) => (
            <span
              key={flake.id}
              className="yilbasi-flake"
              style={{
                left: flake.left,
                animationDelay: flake.delay,
                animationDuration: flake.dur,
                width: flake.size,
                height: flake.size,
              }}
            />
          ))}
          {santa ? (
            <div
              className={cn("yilbasi-santa", `yilbasi-santa-${santa.from}`)}
              style={{
                top: `${santa.top}%`,
                left: `${santa.left}%`,
                fontSize: santa.size,
                opacity: santa.opacity,
                animationDuration: `${santa.dur}s`,
              }}
            >
              🎅
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="fixed right-3 bottom-20 z-[80] md:bottom-4">
        <div
          className={cn(
            "rounded-2xl border border-red-800/25 bg-[#12241c]/92 text-amber-50 shadow-lg backdrop-blur",
            open ? "w-[min(18rem,calc(100vw-1.5rem))] p-3" : "p-0",
          )}
        >
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            <Snowflake className="size-4 text-red-300" />
            Yılbaşı
          </button>
          {open ? (
            <div className="grid gap-2 border-t border-white/10 pt-2">
              <label className="flex items-center justify-between text-xs font-medium">
                Tema
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) => {
                    const next = e.target.checked
                    setHolidayOn(next)
                    setOn(next)
                    apply(next)
                    if (!next) {
                      setMusicOn(false)
                      setMusic(false)
                      stopTune()
                    }
                  }}
                />
              </label>
              <label className="flex items-center justify-between text-xs font-medium">
                Tını
                <span className="flex items-center gap-1">
                  {music ? <Music2 className="size-3" /> : <VolumeX className="size-3" />}
                  <input
                    type="checkbox"
                    checked={music}
                    disabled={!on}
                    onChange={(e) => {
                      const next = e.target.checked
                      setMusicOn(next)
                      setMusic(next)
                    }}
                  />
                </span>
              </label>
              <div className="grid gap-1">
                {TUNES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!on}
                    className={cn(
                      "rounded-lg px-2 py-1.5 text-left text-xs font-semibold",
                      tune === item.id ? "bg-red-800/90 text-white" : "bg-white/10 hover:bg-white/15",
                    )}
                    onClick={() => {
                      setStoredTune(item.id)
                      setTune(item.id)
                      if (!music) {
                        setMusicOn(true)
                        setMusic(true)
                      }
                    }}
                  >
                    <Music className="mr-1 inline size-3" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}
