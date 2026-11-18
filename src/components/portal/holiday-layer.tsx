"use client"

import {
  ensureTune,
  getStoredTune,
  getStoredVolume,
  isHolidayOn,
  isMusicOn,
  resumeAudio,
  setHolidayOn,
  setMusicOn,
  setStoredTune,
  setStoredVolume,
  stopTune,
  type TuneId,
} from "@/lib/christmas-tunes"
import { cn } from "@/lib/utils"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

const FLAKES = Array.from({ length: 28 }, (_, i) => i)
const LIGHTS = Array.from({ length: 36 }, (_, i) => i)
const ORNAMENTS = ["●", "◆", "●", "✦", "●"]
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

type HolidayApi = {
  ready: boolean
  on: boolean
  music: boolean
  tune: TuneId
  volume: number
  setTheme: (next: boolean) => void
  setMusic: (next: boolean) => void
  setTune: (id: TuneId) => void
  setVolume: (next: number) => void
}

const HolidayContext = createContext<HolidayApi | null>(null)

function nextSanta(id: number): SantaPass {
  const from = (["left", "right", "top"] as const)[Math.floor(Math.random() * 3)]
  return {
    id,
    from,
    top: from === "top" ? -8 : 8 + Math.random() * 78,
    left: from === "left" ? -10 : from === "right" ? 108 : 10 + Math.random() * 80,
    dur: 11 + Math.random() * 7,
    size: 14 + Math.random() * 8,
    opacity: 0.22 + Math.random() * 0.16,
  }
}

export function useHoliday() {
  const ctx = useContext(HolidayContext)
  if (!ctx) {
    throw new Error("HolidayProvider missing")
  }
  return ctx
}

export function HolidayProvider({ children }: { children: ReactNode }) {
  const [on, setOn] = useState(false)
  const [music, setMusicState] = useState(false)
  const [tune, setTuneState] = useState<TuneId>("snow")
  const [volume, setVolumeState] = useState(0.48)
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
    setOn(enabled)
    setTuneState(getStoredTune())
    setMusicState(isMusicOn())
    setVolumeState(getStoredVolume())
    apply(enabled)
    setReady(true)
  }, [apply])

  useEffect(() => () => stopTune(), [])

  useEffect(() => {
    if (!ready) return
    if (!on || !music) {
      stopTune()
      return
    }
    void ensureTune(tune)
    const resume = () => {
      if (musicRef.current) void resumeAudio()
    }
    window.addEventListener("pointerdown", resume)
    window.addEventListener("keydown", resume)
    return () => {
      window.removeEventListener("pointerdown", resume)
      window.removeEventListener("keydown", resume)
    }
  }, [on, music, tune, ready])

  const api = useMemo<HolidayApi>(
    () => ({
      ready,
      on,
      music,
      tune,
      volume,
      setTheme: (next) => {
        setHolidayOn(next)
        setOn(next)
        apply(next)
        if (!next) {
          setMusicOn(false)
          setMusicState(false)
          stopTune()
        }
      },
      setMusic: (next) => {
        setMusicOn(next)
        setMusicState(next)
      },
      setTune: (id) => {
        setStoredTune(id)
        setTuneState(id)
        if (!musicRef.current) {
          setMusicOn(true)
          setMusicState(true)
        }
      },
      setVolume: (next) => {
        const value = setStoredVolume(next)
        setVolumeState(value)
        if (value === 0) {
          setMusicOn(false)
          setMusicState(false)
        } else if (!musicRef.current) {
          setMusicOn(true)
          setMusicState(true)
        }
      },
    }),
    [apply, music, on, ready, tune, volume],
  )

  return (
    <HolidayContext.Provider value={api}>
      {children}
      {ready && on ? <HolidayAtmosphere /> : null}
    </HolidayContext.Provider>
  )
}

function HolidayAtmosphere() {
  const [santa, setSanta] = useState<SantaPass | null>(null)
  const flakes = useMemo(
    () =>
      FLAKES.map((i) => ({
        id: i,
        left: `${(i * 23 + 7) % 100}%`,
        delay: `${(i % 11) * 0.85}s`,
        dur: `${16 + (i % 8)}s`,
        size: 3 + (i % 4),
      })),
    [],
  )

  useEffect(() => {
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
    const first = window.setTimeout(spawn, 14_000 + Math.random() * 18_000)
    const loop = window.setInterval(
      () => {
        if (Math.random() < 0.45) spawn()
      },
      48_000 + Math.random() * 24_000,
    )
    return () => {
      window.clearTimeout(first)
      window.clearInterval(loop)
      if (hide) window.clearTimeout(hide)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-[5] overflow-hidden" aria-hidden>
      <div className="yilbasi-vignette" />
      <div className="yilbasi-lights">
        {LIGHTS.map((i) => (
          <span
            key={i}
            className={cn("yilbasi-bulb", BULB[i % BULB.length])}
            style={{ animationDelay: `${(i % 8) * 0.18}s` }}
          />
        ))}
      </div>
      <div className="yilbasi-garland">
        {ORNAMENTS.map((mark, i) => (
          <span key={i} className={cn("yilbasi-ornament", BULB[i % BULB.length])}>
            {mark}
          </span>
        ))}
      </div>
      {flakes.map((flake) => (
        <span
          key={flake.id}
          className={cn("yilbasi-flake", flake.id % 3 === 0 && "yilbasi-flake-star")}
          style={{
            left: flake.left,
            animationDelay: flake.delay,
            animationDuration: flake.dur,
            width: flake.size + (flake.id % 3 === 0 ? 4 : 0),
            height: flake.size + (flake.id % 3 === 0 ? 4 : 0),
          }}
        >
          {flake.id % 3 === 0 ? "❄" : ""}
        </span>
      ))}
      <div className="yilbasi-tree">🎄</div>
      <div className="yilbasi-hearth" />
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
  )
}

export function HolidayLayer({ children }: { children: ReactNode }) {
  return <HolidayProvider>{children}</HolidayProvider>
}
