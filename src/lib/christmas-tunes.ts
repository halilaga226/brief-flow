export type TuneId = "jingle" | "wish" | "deck"

export const TUNES: { id: TuneId; label: string }[] = [
  { id: "jingle", label: "Jingle Bells" },
  { id: "wish", label: "Mutlu Yıllar" },
  { id: "deck", label: "Deck the Halls" },
]

type Note = { f: number; d: number }

const C4 = 261.63
const D4 = 293.66
const E4 = 329.63
const F4 = 349.23
const G4 = 392.0
const A4 = 440.0
const B4 = 493.88
const C5 = 523.25
const D5 = 587.33
const E5 = 659.25
const F5 = 698.46
const G5 = 783.99
const REST = 0

const JINGLE: Note[] = [
  { f: E5, d: 0.22 },
  { f: E5, d: 0.22 },
  { f: E5, d: 0.44 },
  { f: E5, d: 0.22 },
  { f: E5, d: 0.22 },
  { f: E5, d: 0.44 },
  { f: E5, d: 0.22 },
  { f: G5, d: 0.22 },
  { f: C5, d: 0.22 },
  { f: D5, d: 0.22 },
  { f: E5, d: 0.7 },
  { f: F5, d: 0.22 },
  { f: F5, d: 0.22 },
  { f: F5, d: 0.22 },
  { f: F5, d: 0.22 },
  { f: F5, d: 0.22 },
  { f: E5, d: 0.22 },
  { f: E5, d: 0.22 },
  { f: E5, d: 0.12 },
  { f: E5, d: 0.12 },
  { f: E5, d: 0.22 },
  { f: D5, d: 0.22 },
  { f: D5, d: 0.22 },
  { f: E5, d: 0.22 },
  { f: D5, d: 0.44 },
  { f: G5, d: 0.44 },
]

const WISH: Note[] = [
  { f: D4, d: 0.28 },
  { f: G4, d: 0.28 },
  { f: G4, d: 0.14 },
  { f: A4, d: 0.14 },
  { f: G4, d: 0.14 },
  { f: F4, d: 0.14 },
  { f: E4, d: 0.28 },
  { f: E4, d: 0.28 },
  { f: E4, d: 0.28 },
  { f: A4, d: 0.28 },
  { f: A4, d: 0.14 },
  { f: B4, d: 0.14 },
  { f: A4, d: 0.14 },
  { f: G4, d: 0.14 },
  { f: F4, d: 0.28 },
  { f: D4, d: 0.28 },
  { f: D4, d: 0.28 },
  { f: B4, d: 0.28 },
  { f: B4, d: 0.14 },
  { f: C5, d: 0.14 },
  { f: B4, d: 0.14 },
  { f: A4, d: 0.14 },
  { f: G4, d: 0.28 },
  { f: E4, d: 0.28 },
  { f: D4, d: 0.14 },
  { f: D4, d: 0.14 },
  { f: E4, d: 0.28 },
  { f: A4, d: 0.28 },
  { f: F4, d: 0.28 },
  { f: G4, d: 0.55 },
]

const DECK: Note[] = [
  { f: G4, d: 0.18 },
  { f: F4, d: 0.09 },
  { f: E4, d: 0.18 },
  { f: D4, d: 0.18 },
  { f: C4, d: 0.18 },
  { f: D4, d: 0.18 },
  { f: E4, d: 0.18 },
  { f: C4, d: 0.18 },
  { f: D4, d: 0.09 },
  { f: E4, d: 0.09 },
  { f: F4, d: 0.09 },
  { f: D4, d: 0.09 },
  { f: E4, d: 0.28 },
  { f: C4, d: 0.18 },
  { f: REST, d: 0.12 },
  { f: G4, d: 0.18 },
  { f: F4, d: 0.09 },
  { f: E4, d: 0.18 },
  { f: D4, d: 0.18 },
  { f: C4, d: 0.18 },
  { f: D4, d: 0.18 },
  { f: E4, d: 0.18 },
  { f: C4, d: 0.18 },
  { f: D4, d: 0.09 },
  { f: E4, d: 0.09 },
  { f: F4, d: 0.09 },
  { f: D4, d: 0.09 },
  { f: C4, d: 0.4 },
]

const MELODIES: Record<TuneId, Note[]> = {
  jingle: JINGLE,
  wish: WISH,
  deck: DECK,
}

const THEME_KEY = "brief-flow:yilbasi"
const TUNE_KEY = "brief-flow:yilbasi-tune"
const MUSIC_KEY = "brief-flow:yilbasi-music"

export function isHolidayOn() {
  try {
    return localStorage.getItem(THEME_KEY) !== "0"
  } catch {
    return true
  }
}

export function setHolidayOn(on: boolean) {
  try {
    localStorage.setItem(THEME_KEY, on ? "1" : "0")
  } catch {
    /* ignore */
  }
}

export function getStoredTune(): TuneId {
  try {
    const v = localStorage.getItem(TUNE_KEY)
    if (v === "jingle" || v === "wish" || v === "deck") return v
  } catch {
    /* ignore */
  }
  return "jingle"
}

export function setStoredTune(id: TuneId) {
  try {
    localStorage.setItem(TUNE_KEY, id)
  } catch {
    /* ignore */
  }
}

export function isMusicOn() {
  try {
    return localStorage.getItem(MUSIC_KEY) === "1"
  } catch {
    return false
  }
}

export function setMusicOn(on: boolean) {
  try {
    localStorage.setItem(MUSIC_KEY, on ? "1" : "0")
  } catch {
    /* ignore */
  }
}

let ctx: AudioContext | null = null
let timer: number | null = null
let playing: TuneId | null = null

function playNote(audio: AudioContext, freq: number, start: number, dur: number) {
  if (freq <= 0) return
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = "triangle"
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(0.08, start + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur * 0.92)
  osc.connect(gain)
  gain.connect(audio.destination)
  osc.start(start)
  osc.stop(start + dur)
}

export async function startTune(id: TuneId) {
  stopTune()
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  ctx = new Ctx()
  if (ctx.state === "suspended") await ctx.resume()
  playing = id
  const melody = MELODIES[id]
  const loop = () => {
    if (!ctx || playing !== id) return
    let t = ctx.currentTime + 0.04
    for (const note of melody) {
      playNote(ctx, note.f, t, Math.max(0.08, note.d * 0.92))
      t += note.d
    }
    const waitMs = Math.max(400, (t - ctx.currentTime) * 1000 + 280)
    timer = window.setTimeout(loop, waitMs)
  }
  loop()
}

export function stopTune() {
  if (timer) {
    window.clearTimeout(timer)
    timer = null
  }
  playing = null
  if (ctx) {
    const closing = ctx
    ctx = null
    void closing.close()
  }
}
