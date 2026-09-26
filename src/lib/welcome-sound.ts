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
