"use client"

import { useHoliday } from "@/components/portal/holiday-layer"
import { TUNES } from "@/lib/christmas-tunes"
import { cn } from "@/lib/utils"
import { Pause, Play, Snowflake, Volume2, VolumeX } from "lucide-react"

export function HolidayDock({ tone = "header" }: { tone?: "header" | "login" }) {
  const { ready, on, music, tune, volume, setTheme, setMusic, setTune, setVolume } = useHoliday()
  if (!ready) return null

  const dark = tone === "login"

  return (
    <div
      className={cn(
        "flex max-w-full items-center gap-1.5 rounded-full border px-2 py-1",
        dark
          ? "border-white/20 bg-black/35 text-white backdrop-blur"
          : "border-border bg-background/80 text-foreground shadow-sm backdrop-blur",
        on && !dark && "border-rose-700/25 bg-rose-950/8",
      )}
    >
      <button
        type="button"
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          on ? "bg-rose-700 text-amber-50" : "bg-muted text-muted-foreground",
        )}
        aria-pressed={on}
        aria-label={on ? "Yılbaşı temasını kapat" : "Yılbaşı temasını aç"}
        onClick={() => setTheme(!on)}
      >
        <Snowflake className="size-3.5" />
      </button>
      <button
        type="button"
        className="flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-black/5"
        disabled={!on}
        aria-label={music ? "Müziği kapat" : "Müziği aç"}
        onClick={() => setMusic(!music)}
      >
        {music && on ? <Pause className="size-3.5" /> : <Play className="size-3.5 pl-0.5" />}
      </button>
      <select
        value={tune}
        disabled={!on}
        aria-label="Yılbaşı müziği"
        className={cn(
          "hidden h-8 max-w-[7.5rem] truncate rounded-full border-0 bg-transparent px-1 text-[11px] font-semibold outline-none sm:block",
          dark ? "text-white" : "text-foreground",
        )}
        onChange={(e) => setTune(e.target.value as typeof tune)}
      >
        {TUNES.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="flex size-7 shrink-0 items-center justify-center"
        disabled={!on}
        aria-label={volume === 0 ? "Sesi aç" : "Sesi kapat"}
        onClick={() => setVolume(volume === 0 ? 0.48 : 0)}
      >
        {volume === 0 || !music || !on ? (
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
        className="yilbasi-volume h-1.5 w-16 cursor-pointer appearance-none rounded-full bg-black/15 accent-amber-500 sm:w-24"
        onChange={(e) => setVolume(Number(e.target.value) / 100)}
      />
    </div>
  )
}
