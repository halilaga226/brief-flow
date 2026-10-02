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

/** Güçlü, metalik zil — bildirim popup’ı gelince. */
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
    master.gain.exponentialRampToValueAtTime(0.55, now + 0.01)
    master.gain.exponentialRampToValueAtTime(0.0001, now + 1.55)
    master.connect(ctx.destination)

    // Bandpass: metalik “çan” rengi
    const filter = ctx.createBiquadFilter()
    filter.type = "bandpass"
    filter.frequency.value = 1800
    filter.Q.value = 2.2
    filter.connect(master)

    const shimmer = ctx.createBiquadFilter()
    shimmer.type = "highshelf"
    shimmer.frequency.value = 3200
    shimmer.gain.value = 8
    shimmer.connect(filter)

    type Partial = { ratio: number; amp: number; type: OscillatorType }
    const bellPartials: Partial[] = [
      { ratio: 1, amp: 0.55, type: "sine" },
      { ratio: 2.0, amp: 0.28, type: "triangle" },
      { ratio: 2.76, amp: 0.22, type: "sine" }, // inharmonic — çan hissi
      { ratio: 4.07, amp: 0.14, type: "sine" },
      { ratio: 5.4, amp: 0.09, type: "triangle" },
    ]

    // Üç vuruş: tok — tok — tinnng
    const strikes = [
      { fund: 587.33, at: 0.0, dur: 0.7, punch: 0.9 }, // D5
      { fund: 880.0, at: 0.22, dur: 0.85, punch: 1.0 }, // A5
      { fund: 1174.66, at: 0.48, dur: 1.05, punch: 1.15 }, // D6
    ]

    for (const strike of strikes) {
      const start = now + strike.at
      // Kısa gürültü “vuruş” (tok)
      const noiseDur = 0.045
      const noiseBuf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * noiseDur), ctx.sampleRate)
      const data = noiseBuf.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
      }
      const noise = ctx.createBufferSource()
      noise.buffer = noiseBuf
      const noiseGain = ctx.createGain()
      const noiseFilter = ctx.createBiquadFilter()
      noiseFilter.type = "bandpass"
      noiseFilter.frequency.value = strike.fund * 1.6
      noiseFilter.Q.value = 1.1
      noiseGain.gain.setValueAtTime(0.0001, start)
      noiseGain.gain.exponentialRampToValueAtTime(0.7 * strike.punch, start + 0.004)
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, start + noiseDur)
      noise.connect(noiseFilter)
      noiseFilter.connect(noiseGain)
      noiseGain.connect(shimmer)
      noise.start(start)
      noise.stop(start + noiseDur + 0.01)

      for (const partial of bellPartials) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = partial.type
        osc.frequency.value = strike.fund * partial.ratio
        const peak = 0.55 * partial.amp * strike.punch
        gain.gain.setValueAtTime(0.0001, start)
        gain.gain.exponentialRampToValueAtTime(peak, start + 0.012)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + strike.dur)
        osc.connect(gain)
        gain.connect(shimmer)
        osc.start(start)
        osc.stop(start + strike.dur + 0.03)
      }
    }

    window.setTimeout(() => {
      void ctx.close()
    }, 1900)
  } catch {
    /* autoplay / unavailable */
  }
}
