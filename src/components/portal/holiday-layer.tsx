"use client"

import {
  getStoredTune,
  getStoredVolume,
  isHolidayOn,
  isMusicOn,
  setHolidayOn,
  setMusicOn,
  setStoredTune,
  setStoredVolume,
  startTune,
  stopTune,
  TUNES,
  type TuneId,
} from "@/lib/christmas-tunes"
import { cn } from "@/lib/utils"
import { Music2, Pause, Play, Snowflake, Volume2, VolumeX } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

const FLAKES = Array.from({ length: 22 }, (_, i) => i)
const LIGHTS = Array.from({ length: 32 }, (_, i) => i)
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
  const [volume, setVolume] = useState(0.38)
  const [santa, setSanta] = useState<SantaPass | null>(null)
  const [open, setOpen] = useState(false)
  const [ready, setReady] = useState(false)
  const musicRef = useRef(music)
  const tuneRef = useRef(tune)
  musicRef.current = music
  tuneRef.current = tune

  const apply = useCallback((enabled: boolean) => {
    document.documentElement.classList.toggle("yilbasi", enabled)
  }, [])

  useEffect(() => {
    const enabled = isHolidayOn()
    const wantMusic = isMusicOn()
    setOn(enabled)
    setTune(getStoredTune())
    setMusic(wantMusic)
    setVolume(getStoredVolume())
    apply(enabled)
    setReady(true)
  }, [apply])

  useEffect(() => {
    if (!ready) return
    if (!on || !music) {
      stopTune()
      return
    }
    void startTune(tune)
    const resume = () => {
      if (musicRef.current) void startTune(tuneRef.current)
    }
    window.addEventListener("pointerdown", resume, { once: true })
    window.addEventListener("keydown", resume, { once: true })
    return () => {
      window.removeEventListener("pointerdown", resume)
      window.removeEventListener("keydown", resume)
      stopTune()
    }
  }, [on, music, tune, ready])

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

  const currentLabel = TUNES.find((item) => item.id === tune)?.label ?? "Jingle Bells"

  if (!ready) return null

  if (!on && !open) {
    return (
      <button
        type="button"
        className="fixed right-3 bottom-20 z-[80] rounded-full border border-rose-700/30 bg-[#1a120c]/92 px-3 py-2 text-xs font-semibold text-amber-50 shadow-lg backdrop-blur md:bottom-4"
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
        <div className="overflow-hidden rounded-2xl border border-amber-200/25 bg-[#14110d]/94 text-amber-50 shadow-[0_12px_40px_rgba(80,20,10,0.45)] backdrop-blur-xl">
          <div className="flex items-center gap-2 px-2 py-2">
            <button
              type="button"
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-800/80 text-amber-50"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label="Yılbaşı paneli"
            >
              <Snowflake className="size-4" />
            </button>
            <button
              type="button"
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10"
              disabled={!on}
              aria-label={music ? "Müziği kapat" : "Müziği aç"}
              onClick={() => {
                const next = !music
                setMusicOn(next)
                setMusic(next)
              }}
            >
              {music ? <Pause className="size-4" /> : <Play className="size-4 pl-0.5" />}
            </button>
            <div className="min-w-0 flex-1 pr-1">
              <p className="truncate text-[11px] font-bold tracking-wide text-amber-100/90">
                {currentLabel}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <button
                  type="button"
                  className="text-amber-100/80"
                  disabled={!on}
                  aria-label={volume === 0 ? "Sesi aç" : "Sesi kapat"}
                  onClick={() => {
                    const next = volume === 0 ? 0.38 : 0
                    setVolume(setStoredVolume(next))
                    if (next === 0) {
                      setMusicOn(false)
                      setMusic(false)
                    } else if (!music) {
                      setMusicOn(true)
                      setMusic(true)
                    }
                  }}
                >
                  {volume === 0 || !music ? (
                    <VolumeX className="size-3.5" />
                  ) : (
                    <Volume2 className="size-3.5" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(volume * 100)}
                  disabled={!on}
                  aria-label="Ses düzeyi"
                  className="yilbasi-volume h-1.5 w-28 max-w-[42vw] cursor-pointer appearance-none rounded-full bg-white/15 accent-amber-400"
                  onChange={(e) => {
                    const next = Number(e.target.value) / 100
                    setVolume(setStoredVolume(next))
                    if (next > 0 && !music) {
                      setMusicOn(true)
                      setMusic(true)
                    }
                    if (next === 0) {
                      setMusicOn(false)
                      setMusic(false)
                    }
                  }}
                />
              </div>
            </div>
          </div>
          {open ? (
            <div className="grid gap-2 border-t border-white/10 px-3 py-3">
              <label className="flex items-center justify-between text-xs font-medium">
                Yılbaşı teması
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
              <p className="text-[11px] text-amber-100/65">Telifsiz çan melodileri · tarayıcıda üretilir</p>
              <div className="grid gap-1">
                {TUNES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!on}
                    className={cn(
                      "rounded-lg px-2 py-1.5 text-left text-xs font-semibold",
                      tune === item.id ? "bg-rose-800/90 text-white" : "bg-white/10 hover:bg-white/15",
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
                    <Music2 className="mr-1 inline size-3" />
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
