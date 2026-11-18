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

const FLAKES = Array.from({ length: 36 }, (_, i) => i)

export function HolidayLayer() {
  const [on, setOn] = useState(false)
  const [music, setMusic] = useState(false)
  const [tune, setTune] = useState<TuneId>("jingle")
  const [santa, setSanta] = useState(false)
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
    const intervalMs = music ? 70_000 : 28_000
    const tick = () => {
      setSanta(true)
      window.setTimeout(() => setSanta(false), 9000)
    }
    const first = window.setTimeout(tick, music ? 18_000 : 6000)
    const loop = window.setInterval(tick, intervalMs)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(loop)
    }
  }, [on, music])

  const flakes = useMemo(
    () =>
      FLAKES.map((i) => ({
        id: i,
        left: `${(i * 17) % 100}%`,
        delay: `${(i % 9) * 0.7}s`,
        dur: `${9 + (i % 6)}s`,
        size: 6 + (i % 7),
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
            <div className="yilbasi-santa">
              <span className="text-4xl drop-shadow" role="img" aria-label="Noel Baba">
                🎅🛷
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="fixed right-3 bottom-20 z-[80] md:bottom-4">
        <div
          className={cn(
            "rounded-2xl border border-red-800/30 bg-[#1a3c2a]/95 text-amber-50 shadow-xl backdrop-blur",
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
                      tune === item.id ? "bg-red-700 text-white" : "bg-white/10 hover:bg-white/15",
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
              <p className="text-[11px] leading-snug text-amber-100/70">
                Tarayıcı otomatik sesi engellerse tınıyı buradan açın. Ses kapalıyken Noel Baba daha sık geçer.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}
