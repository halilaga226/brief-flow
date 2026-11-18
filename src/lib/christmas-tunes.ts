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

const SLOW = 2.7
const PITCH = 0.5
const OUTPUT_GAIN = 0.22
const DEFAULT_VOLUME = 0.48

export function clampVolume(raw: number) {
  if (!Number.isFinite(raw)) return DEFAULT_VOLUME
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
  return DEFAULT_VOLUME
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
let filter: BiquadFilterNode | null = null
let timer: number | null = null
let playing: TuneId | null = null
let volume = DEFAULT_VOLUME

function outputLevel(slider: number) {
  return clampVolume(slider) * OUTPUT_GAIN
}

function applyVolume(value: number) {
  volume = clampVolume(value)
  if (master && ctx) {
    master.gain.setTargetAtTime(outputLevel(volume), ctx.currentTime, 0.08)
  }
}

function playPad(
  audio: AudioContext,
  dest: AudioNode,
  freq: number,
  start: number,
  dur: number,
  gain: number,
) {
  if (freq <= 0) return
  const osc = audio.createOscillator()
  const warm = audio.createOscillator()
  const env = audio.createGain()
  osc.type = "sine"
  warm.type = "triangle"
  osc.frequency.setValueAtTime(freq, start)
  warm.frequency.setValueAtTime(freq * 0.5, start)
  const attack = Math.min(0.42, dur * 0.28)
  env.gain.setValueAtTime(0.0001, start)
  env.gain.exponentialRampToValueAtTime(gain, start + attack)
  env.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  osc.connect(env)
  warm.connect(env)
  env.connect(dest)
  osc.start(start)
  warm.start(start)
  osc.stop(start + dur + 0.05)
  warm.stop(start + dur + 0.05)
}

function schedulePass(audio: AudioContext, dest: AudioNode, melody: Note[], t: number) {
  let cursor = t
  for (const note of melody) {
    const dur = Math.max(0.28, note.d * SLOW)
    playPad(audio, dest, note.f * PITCH, cursor, dur * 1.55, 0.05)
    if (note.bass) playPad(audio, dest, note.bass * PITCH, cursor, dur * 1.8, 0.028)
    cursor += dur
  }
  return cursor
}

function getContextCtor() {
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  )
}

export async function startTune(id: TuneId) {
  stopTune()
  const Ctor = getContextCtor()
  if (!Ctor) return
  volume = getStoredVolume()
  try {
    ctx = new Ctor()
    master = ctx.createGain()
    master.gain.value = outputLevel(volume)
    filter = ctx.createBiquadFilter()
    filter.type = "lowpass"
    filter.frequency.value = 980
    filter.Q.value = 0.7
    filter.connect(master)
    master.connect(ctx.destination)
    if (ctx.state === "suspended") await ctx.resume()
    playing = id
    const melody = MELODIES[id]
    const loop = () => {
      if (!ctx || !filter || playing !== id) return
      let t = ctx.currentTime + 0.08
      t = schedulePass(ctx, filter, melody, t)
      t += 0.55
      t = schedulePass(ctx, filter, melody, t)
      t += 3.2
      const waitMs = Math.max(1200, (t - ctx.currentTime) * 1000)
      timer = window.setTimeout(loop, waitMs)
    }
    loop()
  } catch {
    stopTune()
  }
}

export async function ensureTune(id: TuneId) {
  if (playing === id && ctx) {
    await resumeAudio()
    return
  }
  await startTune(id)
}

export async function resumeAudio() {
  if (!ctx) return
  try {
    if (ctx.state === "suspended") await ctx.resume()
  } catch {
    /* ignore */
  }
}

export function stopTune() {
  if (timer) {
    window.clearTimeout(timer)
    timer = null
  }
  playing = null
  filter = null
  master = null
  if (ctx) {
    const closing = ctx
    ctx = null
    void closing.close().catch(() => undefined)
  }
}

export function isTunePlaying() {
  return playing != null
}
