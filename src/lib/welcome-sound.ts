export async function playWelcomeChime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const now = ctx.currentTime

    const master = ctx.createGain()
    master.gain.setValueAtTime(0.0001, now)
    master.gain.exponentialRampToValueAtTime(0.22, now + 0.04)
    master.gain.exponentialRampToValueAtTime(0.0001, now + 1.4)
    master.connect(ctx.destination)

    const tones = [523.25, 659.25, 783.99]
    tones.forEach((freq, index) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.value = freq
      const start = now + index * 0.12
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.35, start + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.7)
      osc.connect(gain)
      gain.connect(master)
      osc.start(start)
      osc.stop(start + 0.75)
    })

    window.setTimeout(() => {
      void ctx.close()
    }, 1800)
  } catch {
    /* autoplay / unavailable */
  }
}

const SOUND_MUTE_KEY = "brief-flow:notify-sound-muted"

export function isNotifySoundMuted() {
  try {
    return localStorage.getItem(SOUND_MUTE_KEY) === "1"
  } catch {
    return false
  }
}

export function setNotifySoundMuted(muted: boolean) {
  try {
    localStorage.setItem(SOUND_MUTE_KEY, muted ? "1" : "0")
  } catch {
    /* ignore */
  }
}

/** Kısa zil — bildirim popup’ı gelince. */
export async function playNotificationBell() {
  if (typeof window === "undefined") return
  if (isNotifySoundMuted()) return
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    if (ctx.state === "suspended") await ctx.resume()
    const now = ctx.currentTime

    const master = ctx.createGain()
    master.gain.setValueAtTime(0.0001, now)
    master.gain.exponentialRampToValueAtTime(0.28, now + 0.02)
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.85)
    master.connect(ctx.destination)

    // İki vuruşlu zil: ding-ding
    const strikes: { freq: number; at: number; dur: number }[] = [
      { freq: 1046.5, at: 0, dur: 0.55 },
      { freq: 1318.5, at: 0.16, dur: 0.65 },
    ]
    for (const strike of strikes) {
      const osc = ctx.createOscillator()
      const partial = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "triangle"
      partial.type = "sine"
      osc.frequency.value = strike.freq
      partial.frequency.value = strike.freq * 2.01
      const start = now + strike.at
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.45, start + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + strike.dur)
      osc.connect(gain)
      partial.connect(gain)
      gain.connect(master)
      osc.start(start)
      partial.start(start)
      osc.stop(start + strike.dur + 0.02)
      partial.stop(start + strike.dur + 0.02)
    }

    window.setTimeout(() => {
      void ctx.close()
    }, 1200)
  } catch {
    /* autoplay / unavailable */
  }
}
