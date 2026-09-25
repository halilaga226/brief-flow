import type { DueTone, TaskStatus } from "./workflow"

const ISTANBUL = "Europe/Istanbul"

export function istanbulDayKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ISTANBUL,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

export function addDaysKey(key: string, days: number) {
  const [year, month, day] = key.split("-").map(Number)
  const utc = new Date(Date.UTC(year, month - 1, day + days))
  const yyyy = utc.getUTCFullYear()
  const mm = String(utc.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(utc.getUTCDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

export function dueTone(iso: string, status: TaskStatus, now = new Date()): DueTone {
  if (status === "TAMAMLANDI") return "done"
  const due = istanbulDayKey(new Date(iso))
  const today = istanbulDayKey(now)
  if (due < today) return "overdue"
  if (due === today) return "today"
  if (due <= addDaysKey(today, 2)) return "soon"
  return "later"
}

export function formatDay(iso: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: ISTANBUL,
  }).format(new Date(iso))
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: ISTANBUL,
  }).format(new Date(iso))
}

export function formatTodayLabel(now = new Date()) {
  return new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: ISTANBUL,
  }).format(now)
}

export function greeting(now = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat("tr-TR", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: ISTANBUL,
    }).format(now),
  )
  if (hour < 11) return "Günaydın"
  if (hour < 18) return "İyi günler"
  return "İyi akşamlar"
}

export function istanbulMonthKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ISTANBUL,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date)
  const year = parts.find((part) => part.type === "year")?.value ?? "0000"
  const month = parts.find((part) => part.type === "month")?.value ?? "00"
  return `${year}-${month}`
}

export function formatBytes(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function parseDueDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split("-").map(Number)
  if (year < 2000 || year > 2100) return null
  const date = new Date(Date.UTC(year, month - 1, day, 15, 0, 0))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }
  return date
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("tr")
}
