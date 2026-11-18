export type TuneId = "jingle" | "wish" | "deck" | "silent"

export const TUNES: { id: TuneId; label: string }[] = [
  { id: "jingle", label: "Jingle Bells" },
  { id: "wish", label: "Mutlu Yıllar" },
  { id: "deck", label: "Deck the Halls" },
  { id: "silent", label: "Sessiz Gece" },
]

type Note = { f: number; d: number; bass?: number }

const C3 = 130.81
const D3 = 146.83
const E3 = 164.81
const G3 = 196.0
const A3 = 220.0
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
  { f: E5, d: 0.22, bass: C4 },
  { f: E5, d: 0.22 },
  { f: E5, d: 0.44, bass: G3 },
  { f: E5, d: 0.22, bass: C4 },
  { f: E5, d: 0.22 },
  { f: E5, d: 0.44, bass: G3 },
  { f: E5, d: 0.22, bass: C4 },
  { f: G5, d: 0.22 },
  { f: C5, d: 0.28, bass: E3 },
  { f: D5, d: 0.18 },
  { f: E5, d: 0.72, bass: C4 },
  { f: F5, d: 0.22, bass: F4 },
  { f: F5, d: 0.22 },
  { f: F5, d: 0.22 },
  { f: F5, d: 0.22, bass: D3 },
  { f: F5, d: 0.22 },
  { f: E5, d: 0.22, bass: C4 },
  { f: E5, d: 0.22 },
  { f: E5, d: 0.12 },
  { f: E5, d: 0.12 },
  { f: E5, d: 0.22, bass: G3 },
  { f: D5, d: 0.22 },
  { f: D5, d: 0.22 },
  { f: E5, d: 0.22 },
  { f: D5, d: 0.44, bass: G3 },
  { f: G5, d: 0.44 },
  { f: E5, d: 0.22, bass: C4 },
  { f: E5, d: 0.22 },
  { f: E5, d: 0.44, bass: G3 },
  { f: E5, d: 0.22, bass: C4 },
  { f: E5, d: 0.22 },
  { f: E5, d: 0.44, bass: G3 },
  { f: E5, d: 0.22, bass: C4 },
  { f: G5, d: 0.22 },
  { f: C5, d: 0.28, bass: E3 },
  { f: D5, d: 0.18 },
  { f: E5, d: 0.72, bass: C4 },
  { f: F5, d: 0.22, bass: F4 },
  { f: F5, d: 0.22 },
  { f: F5, d: 0.22 },
  { f: F5, d: 0.22, bass: D3 },
  { f: F5, d: 0.22 },
  { f: E5, d: 0.22, bass: C4 },
  { f: E5, d: 0.22 },
  { f: E5, d: 0.12 },
  { f: E5, d: 0.12 },
  { f: G5, d: 0.22, bass: G3 },
  { f: G5, d: 0.22 },
  { f: F5, d: 0.22 },
  { f: D5, d: 0.22 },
  { f: C5, d: 0.9, bass: C4 },
]

const WISH: Note[] = [
  { f: D4, d: 0.28, bass: G3 },
  { f: G4, d: 0.28 },
  { f: G4, d: 0.14 },
  { f: A4, d: 0.14 },
  { f: G4, d: 0.14 },
  { f: F4, d: 0.14 },
  { f: E4, d: 0.28, bass: C4 },
  { f: E4, d: 0.28 },
  { f: E4, d: 0.28 },
  { f: A4, d: 0.28, bass: D3 },
  { f: A4, d: 0.14 },
  { f: B4, d: 0.14 },
  { f: A4, d: 0.14 },
  { f: G4, d: 0.14 },
  { f: F4, d: 0.28, bass: D3 },
  { f: D4, d: 0.28 },
  { f: D4, d: 0.28 },
  { f: B4, d: 0.28, bass: G3 },
  { f: B4, d: 0.14 },
  { f: C5, d: 0.14 },
  { f: B4, d: 0.14 },
  { f: A4, d: 0.14 },
  { f: G4, d: 0.28, bass: C4 },
  { f: E4, d: 0.28 },
  { f: D4, d: 0.14 },
  { f: D4, d: 0.14 },
  { f: E4, d: 0.28, bass: C4 },
  { f: A4, d: 0.28 },
  { f: F4, d: 0.28, bass: D3 },
  { f: G4, d: 0.7, bass: G3 },
]

const DECK: Note[] = [
  { f: G4, d: 0.2, bass: C4 },
  { f: F4, d: 0.1 },
  { f: E4, d: 0.2 },
  { f: D4, d: 0.2, bass: G3 },
  { f: C4, d: 0.2 },
  { f: D4, d: 0.2 },
  { f: E4, d: 0.2, bass: C4 },
  { f: C4, d: 0.2 },
  { f: D4, d: 0.1, bass: G3 },
  { f: E4, d: 0.1 },
  { f: F4, d: 0.1 },
  { f: D4, d: 0.1 },
  { f: E4, d: 0.3, bass: C4 },
  { f: C4, d: 0.2 },
  { f: REST, d: 0.12 },
  { f: G4, d: 0.2, bass: C4 },
  { f: F4, d: 0.1 },
  { f: E4, d: 0.2 },
  { f: D4, d: 0.2, bass: G3 },
  { f: C4, d: 0.2 },
  { f: D4, d: 0.2 },
  { f: E4, d: 0.2, bass: C4 },
  { f: C4, d: 0.2 },
  { f: G4, d: 0.1, bass: G3 },
  { f: G4, d: 0.1 },
  { f: F4, d: 0.1 },
  { f: D4, d: 0.1 },
  { f: C4, d: 0.55, bass: C3 },
]

const SILENT: Note[] = [
  { f: G4, d: 0.36, bass: C3 },
  { f: A4, d: 0.18 },
  { f: G4, d: 0.36 },
  { f: E4, d: 0.7, bass: C4 },
  { f: G4, d: 0.36, bass: C3 },
  { f: A4, d: 0.18 },
  { f: G4, d: 0.36 },
  { f: E4, d: 0.7, bass: C4 },
  { f: D5, d: 0.45, bass: G3 },
  { f: D5, d: 0.45 },
  { f: B4, d: 0.7 },
  { f: C5, d: 0.45, bass: C4 },
  { f: C5, d: 0.45 },
  { f: G4, d: 0.7 },
  { f: A4, d: 0.45, bass: F4 },
  { f: A4, d: 0.45 },
  { f: C5, d: 0.32 },
  { f: B4, d: 0.18 },
  { f: A4, d: 0.36 },
  { f: G4, d: 0.36, bass: C4 },
  { f: A4, d: 0.18 },
  { f: G4, d: 0.36 },
  { f: E4, d: 0.7 },
  { f: D5, d: 0.36, bass: G3 },
  { f: D5, d: 0.18 },
  { f: F5, d: 0.32 },
  { f: D5, d: 0.18 },
  { f: B4, d: 0.36 },
  { f: C5, d: 0.55, bass: C4 },
  { f: E5, d: 0.45 },
  { f: C5, d: 0.28, bass: G3 },
  { f: G4, d: 0.28 },
  { f: E4, d: 0.28, bass: C4 },
  { f: G4, d: 0.28 },
  { f: F4, d: 0.36, bass: D3 },
  { f: D4, d: 0.36 },
  { f: C4, d: 1.05, bass: C3 },
]

const MELODIES: Record<TuneId, Note[]> = {
  jingle: JINGLE,
  wish: WISH,
  deck: DECK,
  silent: SILENT,
}

const THEME_KEY = "brief-flow:yilbasi"
const TUNE_KEY = "brief-flow:yilbasi-tune"
const MUSIC_KEY = "brief-flow:yilbasi-music"
const VOLUME_KEY = "brief-flow:yilbasi-volume"

export function clampVolume(raw: number) {
  if (!Number.isFinite(raw)) return 0.38
  return Math.min(1, Math.max(0, raw))
}

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
    if (v === "jingle" || v === "wish" || v === "deck" || v === "silent") return v
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
    return localStorage.getItem(MUSIC_KEY) !== "0"
  } catch {
    return true
  }
}

export function setMusicOn(on: boolean) {
  try {
    localStorage.setItem(MUSIC_KEY, on ? "1" : "0")
  } catch {
    /* ignore */
  }
}

export function getStoredVolume() {
  try {
    const v = Number(localStorage.getItem(VOLUME_KEY))
    if (Number.isFinite(v)) return clampVolume(v)
  } catch {
    /* ignore */
  }
  return 0.38
}

export function setStoredVolume(value: number) {
  const next = clampVolume(value)
  try {
    localStorage.setItem(VOLUME_KEY, String(next))
  } catch {
    /* ignore */
  }
  applyVolume(next)
  return next
}

let ctx: AudioContext | null = null
let master: GainNode | null = null
let timer: number | null = null
let playing: TuneId | null = null
let volume = 0.38

function applyVolume(value: number) {
  volume = clampVolume(value)
  if (master && ctx) {
    master.gain.setTargetAtTime(volume, ctx.currentTime, 0.04)
  }
}

function playBell(audio: AudioContext, dest: GainNode, freq: number, start: number, dur: number, gain = 0.11) {
  if (freq <= 0) return
  const osc = audio.createOscillator()
  const sparkle = audio.createOscillator()
  const env = audio.createGain()
  osc.type = "sine"
  sparkle.type = "triangle"
  osc.frequency.setValueAtTime(freq, start)
  sparkle.frequency.setValueAtTime(freq * 2.005, start)
  env.gain.setValueAtTime(0.0001, start)
  env.gain.exponentialRampToValueAtTime(gain, start + 0.018)
  env.gain.exponentialRampToValueAtTime(0.0001, start + Math.max(0.12, dur * 0.98))
  osc.connect(env)
  sparkle.connect(env)
  env.connect(dest)
  osc.start(start)
  sparkle.start(start)
  osc.stop(start + dur + 0.04)
  sparkle.stop(start + dur + 0.04)
}

function playBass(audio: AudioContext, dest: GainNode, freq: number, start: number, dur: number) {
  if (freq <= 0) return
  const osc = audio.createOscillator()
  const env = audio.createGain()
  osc.type = "sine"
  osc.frequency.setValueAtTime(freq, start)
  env.gain.setValueAtTime(0.0001, start)
  env.gain.exponentialRampToValueAtTime(0.07, start + 0.03)
  env.gain.exponentialRampToValueAtTime(0.0001, start + dur * 0.9)
  osc.connect(env)
  env.connect(dest)
  osc.start(start)
  osc.stop(start + dur)
}

export async function startTune(id: TuneId) {
  stopTune()
  volume = getStoredVolume()
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  ctx = new Ctx()
  master = ctx.createGain()
  master.gain.value = volume
  master.connect(ctx.destination)
  if (ctx.state === "suspended") await ctx.resume()
  playing = id
  const melody = MELODIES[id]
  const loop = () => {
    if (!ctx || !master || playing !== id) return
    let t = ctx.currentTime + 0.05
    for (const note of melody) {
      playBell(ctx, master, note.f, t, Math.max(0.1, note.d * 0.94))
      if (note.bass) playBass(ctx, master, note.bass, t, Math.max(0.16, note.d * 1.15))
      t += note.d
    }
    const waitMs = Math.max(500, (t - ctx.currentTime) * 1000 + 420)
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
  master = null
  if (ctx) {
    const closing = ctx
    ctx = null
    void closing.close()
  }
}

export function isTunePlaying() {
  return playing != null
}
