export const XP_PER_LEVEL = 25
export const MIN_POINTS = 1
export const MAX_POINTS = 10

export const RANK_TITLES = [
  "Kalem çırağı",
  "Dilekçe yazarı",
  "Dosya bekçisi",
  "Araştırma avcısı",
  "Duruşma asistanı",
  "Kıdemli stajyer",
  "Büro kahramanı",
  "Yargının yıldızı",
] as const

export const RANK_LADDER = RANK_TITLES.map((title, index) => {
  const fromXp = index * XP_PER_LEVEL
  const last = index === RANK_TITLES.length - 1
  return {
    level: index + 1,
    title,
    fromXp,
    toXp: last ? null : fromXp + XP_PER_LEVEL - 1,
  }
})

export type InternRank = {
  level: number
  xp: number
  into: number
  need: number
  remaining: number
  title: string
  nextTitle: string | null
  progress: number
}

export function internRank(xp: number): InternRank {
  const safe = Math.max(0, Math.floor(xp) || 0)
  const level = Math.floor(safe / XP_PER_LEVEL) + 1
  const into = safe % XP_PER_LEVEL
  const titleIndex = Math.min(level - 1, RANK_TITLES.length - 1)
  const nextTitle = level < RANK_TITLES.length ? RANK_TITLES[level] : null
  return {
    level,
    xp: safe,
    into,
    need: XP_PER_LEVEL,
    remaining: XP_PER_LEVEL - into,
    title: RANK_TITLES[titleIndex],
    nextTitle,
    progress: into / XP_PER_LEVEL,
  }
}

export function parseXpGain(title: string, body = ""): number | null {
  const text = `${title} ${body}`
  const match = text.match(/\+(\d+)\s*XP/i) || text.match(/(\d+)\s*ek XP/i)
  if (!match) return null
  const n = Number(match[1])
  if (!Number.isFinite(n) || n < 1 || n > 99) return null
  return n
}

export const XP_DROP_EVENT = "brief-flow:xp-drop"

export type QuestAnswerRow = {
  id: string
  internName: string
  internId: string
  body: string
  points: number | null
  when: string
}

export type QuestDTO = {
  id: string
  title: string
  prompt: string
  createdByName: string
  createdAt: string
  closed: boolean
  answerCount: number
  myAnswer: {
    body: string
    points: number | null
  } | null
  answers: QuestAnswerRow[]
}

export type InternBoardRow = {
  id: string
  name: string
  title: string
  xp: number
  level: number
  rankTitle: string
  into: number
  need: number
  progress: number
  jobCount: number
  questCount: number
  bonusCount: number
  isYou: boolean
}

export function parsePoints(raw: string | number): number | null {
  const n = typeof raw === "number" ? raw : Number.parseInt(String(raw).trim(), 10)
  if (!Number.isFinite(n)) return null
  if (n < MIN_POINTS || n > MAX_POINTS) return null
  return n
}
