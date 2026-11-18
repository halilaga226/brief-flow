export type TuneId = "snow" | "hearth" | "dusk" | "carol"

export const TUNES: { id: TuneId; label: string }[] = [
  { id: "snow", label: "Kar gecesi" },
  { id: "hearth", label: "Şömine" },
  { id: "dusk", label: "Akşam bürosu" },
  { id: "carol", label: "Usul yılbaşı" },
]

const THEME_KEY = "brief-flow:yilbasi"
const TUNE_KEY = "brief-flow:yilbasi-tune"
const MUSIC_KEY = "brief-flow:yilbasi-music"
const VOLUME_KEY = "brief-flow:yilbasi-volume"

const OUTPUT_GAIN = 0.11
const DEFAULT_VOLUME = 0.4

const CHORDS: Record<TuneId, number[][]> = {
  snow: [
    [392.0, 523.25, 659.25],
    [349.23, 523.25, 698.46],
    [329.63, 493.88, 659.25],
    [392.0, 587.33, 783.99],
  ],
  hearth: [
    [130.81, 196.0, 261.63],
    [146.83, 220.0, 293.66],
    [164.81, 196.0, 246.94],
    [123.47, 185.0, 246.94],
  ],
  dusk: [
    [261.63, 329.63, 392.0],
    [293.66, 349.23, 440.0],
    [246.94, 311.13, 392.0],
    [220.0, 329.63, 415.3],
  ],
  carol: [
    [261.63, 329.63, 392.0],
    [246.94, 311.13, 392.0],
    [220.0, 329.63, 440.0],
    [196.0, 293.66, 392.0],
  ],
}

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
    if (v === "snow" || v === "hearth" || v === "dusk" || v === "carol") return v
  } catch {
    /* ignore */
  }
  return "snow"
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
let chordIndex = 0

function outputLevel(slider: number) {
  return clampVolume(slider) * OUTPUT_GAIN
}

function applyVolume(value: number) {
  volume = clampVolume(value)
  if (master && ctx) {
    master.gain.setTargetAtTime(outputLevel(volume), ctx.currentTime, 0.12)
  }
}

function playChord(audio: AudioContext, dest: AudioNode, freqs: number[], start: number, dur: number) {
  for (const freq of freqs) {
    const osc = audio.createOscillator()
    const detune = audio.createOscillator()
    const env = audio.createGain()
    osc.type = "sine"
    detune.type = "sine"
    osc.frequency.setValueAtTime(freq, start)
    detune.frequency.setValueAtTime(freq * 1.003, start)
    const attack = Math.min(2.4, dur * 0.35)
    env.gain.setValueAtTime(0.0001, start)
    env.gain.exponentialRampToValueAtTime(0.045, start + attack)
    env.gain.exponentialRampToValueAtTime(0.0001, start + dur)
    osc.connect(env)
    detune.connect(env)
    env.connect(dest)
    osc.start(start)
    detune.start(start)
    osc.stop(start + dur + 0.05)
    detune.stop(start + dur + 0.05)
  }
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
  chordIndex = 0
  try {
    ctx = new Ctor()
    master = ctx.createGain()
    master.gain.value = outputLevel(volume)
    filter = ctx.createBiquadFilter()
    filter.type = "lowpass"
    filter.frequency.value = id === "hearth" ? 520 : 760
    filter.Q.value = 0.55
    filter.connect(master)
    master.connect(ctx.destination)
    if (ctx.state === "suspended") await ctx.resume()
    playing = id
    const chords = CHORDS[id]
    const hold = id === "hearth" ? 11 : 9.5
    const loop = () => {
      if (!ctx || !filter || playing !== id) return
      const chord = chords[chordIndex % chords.length]
      chordIndex += 1
      playChord(ctx, filter, chord, ctx.currentTime + 0.05, hold)
      timer = window.setTimeout(loop, (hold - 2.2) * 1000)
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
