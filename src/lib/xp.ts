export const XP_PER_LEVEL = 25
export const MIN_POINTS = 1
export const MAX_POINTS = 10

const TITLES = [
  "Kalem çırağı",
  "Dilekçe yazarı",
  "Dosya bekçisi",
  "Araştırma avcısı",
  "Duruşma asistanı",
  "Kıdemli stajyer",
  "Büro kahramanı",
  "Yargının yıldızı",
] as const

export type InternRank = {
  level: number
  xp: number
  into: number
  need: number
  title: string
  progress: number
}

export function internRank(xp: number): InternRank {
  const safe = Math.max(0, Math.floor(xp) || 0)
  const level = Math.floor(safe / XP_PER_LEVEL) + 1
  const into = safe % XP_PER_LEVEL
  const titleIndex = Math.min(level - 1, TITLES.length - 1)
  return {
    level,
    xp: safe,
    into,
    need: XP_PER_LEVEL,
    title: TITLES[titleIndex],
    progress: into / XP_PER_LEVEL,
  }
}

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
  isYou: boolean
}

export function parsePoints(raw: string | number): number | null {
  const n = typeof raw === "number" ? raw : Number.parseInt(String(raw).trim(), 10)
  if (!Number.isFinite(n)) return null
  if (n < MIN_POINTS || n > MAX_POINTS) return null
  return n
}
