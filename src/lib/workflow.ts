export const ROLES = ["LAWYER", "INTERN"] as const
export type Role = (typeof ROLES)[number]

export const STATUSES = [
  "ATANDI",
  "INCELEME_BEKLIYOR",
  "REVIZE_ISTENDI",
  "GONDERIM_BEKLIYOR",
  "TAMAMLANDI",
] as const
export type TaskStatus = (typeof STATUSES)[number]

export type DueTone = "done" | "overdue" | "today" | "soon" | "later"

export const FILTERS = [
  "tum",
  "bekleyen",
  "geciken",
  "yaklasan",
  "inceleme",
  "tamam",
] as const
export type TaskFilter = (typeof FILTERS)[number]

export type TaskView = "pano" | "liste"

const ALLOWED_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "odt",
  "jpg",
  "jpeg",
  "png",
  "tif",
  "tiff",
  "udf",
])

const MAX_FILE_BYTES = 10 * 1024 * 1024

export class WorkflowError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "WorkflowError"
  }
}

export const STATUS_META: Record<
  TaskStatus,
  { label: string; hint: string }
> = {
  ATANDI: {
    label: "Atandı",
    hint: "İş atandı, taslak bekleniyor.",
  },
  INCELEME_BEKLIYOR: {
    label: "İnceleme bekliyor",
    hint: "Taslak yüklendi, avukat incelemesi bekleniyor.",
  },
  REVIZE_ISTENDI: {
    label: "Revize istendi",
    hint: "Avukat notuyla iş yürütücüye döndü.",
  },
  GONDERIM_BEKLIYOR: {
    label: "Gönderim bekliyor",
    hint: "Onaylandı. Evrak koduyla tamamlanacak.",
  },
  TAMAMLANDI: {
    label: "Tamamlandı",
    hint: "Gönderim kodu işlendi.",
  },
}

export const BOARD_COLUMNS: {
  status: TaskStatus
  title: string
  description: string
}[] = [
  { status: "ATANDI", title: "Atandı", description: "Taslak bekleniyor" },
  {
    status: "INCELEME_BEKLIYOR",
    title: "İnceleme",
    description: "Avukat bakacak",
  },
  {
    status: "REVIZE_ISTENDI",
    title: "Revize",
    description: "Düzeltme istendi",
  },
  {
    status: "GONDERIM_BEKLIYOR",
    title: "Gönderim",
    description: "Kod ile kapanır",
  },
  {
    status: "TAMAMLANDI",
    title: "Tamamlandı",
    description: "Evrak işlendi",
  },
]

export function roleLabel(role: Role) {
  return role === "LAWYER" ? "Avukat" : "Stajyer"
}

export function logLabel(type: string) {
  switch (type) {
    case "CREATED":
      return "Görev oluşturuldu"
    case "DRAFT_UPLOADED":
      return "Taslak yüklendi"
    case "REVISION_REQUESTED":
      return "Revizyon istendi"
    case "APPROVED":
      return "Onaylandı, gönderime hazır"
    case "COMPLETED":
      return "Gönderim tamamlandı"
    default:
      return "İşlem"
  }
}

export function isParticipant(
  task: { assignerId: string; assigneeId: string },
  userId: string,
) {
  return task.assignerId === userId || task.assigneeId === userId
}

export function canCreateTask(role: Role) {
  return role === "LAWYER"
}

export function needsMyAction(
  task: { status: TaskStatus; assignerId: string; assigneeId: string },
  userId: string,
) {
  if (
    task.assigneeId === userId &&
    (task.status === "ATANDI" ||
      task.status === "REVIZE_ISTENDI" ||
      task.status === "GONDERIM_BEKLIYOR")
  ) {
    return true
  }
  return task.assignerId === userId && task.status === "INCELEME_BEKLIYOR"
}

export function canUploadDraft(
  task: { status: TaskStatus; assigneeId: string },
  userId: string,
) {
  return (
    task.assigneeId === userId &&
    (task.status === "ATANDI" || task.status === "REVIZE_ISTENDI")
  )
}

export function canReview(
  task: { status: TaskStatus; assignerId: string },
  userId: string,
  role: Role,
) {
  return (
    role === "LAWYER" &&
    task.assignerId === userId &&
    task.status === "INCELEME_BEKLIYOR"
  )
}

export function canComplete(
  task: { status: TaskStatus; assigneeId: string },
  userId: string,
) {
  return task.assigneeId === userId && task.status === "GONDERIM_BEKLIYOR"
}

export function canComment(
  task: { assignerId: string; assigneeId: string },
  userId: string,
) {
  return isParticipant(task, userId)
}

export function nextStepCopy(input: { status: TaskStatus; myTurn: boolean }) {
  if (input.status === "TAMAMLANDI") {
    return "Gönderim kodu işlendi. Bu iş kapanmış durumda."
  }
  if (input.myTurn) {
    if (input.status === "ATANDI") {
      return "Talimatı uygulayıp dilekçe veya belge taslağını yükleyin."
    }
    if (input.status === "REVIZE_ISTENDI") {
      return "Avukatın revizyon notuna göre taslağı güncelleyip yeniden yükleyin."
    }
    if (input.status === "GONDERIM_BEKLIYOR") {
      return "Onaylı evrakı UYAP, PTT veya ilgili merciye iletin. Barkod ya da evrak kodu olmadan iş kapanmaz."
    }
    if (input.status === "INCELEME_BEKLIYOR") {
      return "Taslağı bağlantısından inceleyin. Onaylayın veya not düşerek revize isteyin."
    }
  }
  if (input.status === "ATANDI" || input.status === "REVIZE_ISTENDI") {
    return "Taslak karşı taraftan bekleniyor."
  }
  if (input.status === "INCELEME_BEKLIYOR") {
    return "Atayan avukatın incelemesi bekleniyor."
  }
  if (input.status === "GONDERIM_BEKLIYOR") {
    return "Gönderim ve evrak kodu karşı taraftan bekleniyor."
  }
  return "Süreç devam ediyor."
}

export function cleanText(value: string) {
  return value.replace(/\u0000/g, "").trim()
}

export function validateTaskDraft(input: {
  title: string
  clientName: string
  fileNumber: string
  description: string
  dueDate: Date | null
  assigneeId: string
}) {
  const title = cleanText(input.title)
  const clientName = cleanText(input.clientName)
  const fileNumber = cleanText(input.fileNumber)
  const description = cleanText(input.description)

  if (title.length < 3) return "Başlık en az 3 karakter olmalı."
  if (title.length > 160) return "Başlık 160 karakteri aşamaz."
  if (clientName.length < 2) return "Müvekkil adını yazın."
  if (clientName.length > 120) return "Müvekkil adı çok uzun."
  if (fileNumber.length < 1) return "Dosya numarasını yazın."
  if (fileNumber.length > 60) return "Dosya numarası çok uzun."
  if (description.length < 8) return "Talimat en az 8 karakter olmalı."
  if (description.length > 4000) return "Talimat 4000 karakteri aşamaz."
  if (!input.dueDate || Number.isNaN(input.dueDate.getTime())) {
    return "Geçerli bir son teslim tarihi seçin."
  }
  if (!input.assigneeId) return "Görevi atayacağınız kişiyi seçin."
  return null
}

export function validateNote(raw: string, label: string) {
  const note = cleanText(raw)
  if (note.length < 8) return { ok: false as const, error: `${label} en az 8 karakter olmalı.` }
  if (note.length > 2000) return { ok: false as const, error: `${label} 2000 karakteri aşamaz.` }
  return { ok: true as const, note }
}

export function validateComment(raw: string) {
  const body = cleanText(raw)
  if (!body) return { ok: false as const, error: "Boş not gönderilemez." }
  if (body.length > 2000) return { ok: false as const, error: "Not 2000 karakteri aşamaz." }
  return { ok: true as const, body }
}

export function validateTrackingCode(raw: string) {
  const code = cleanText(raw).replace(/\s+/g, " ")
  if (!code) {
    return {
      ok: false as const,
      error: "Gönderim kodu olmadan görev tamamlanamaz.",
    }
  }
  if (code.length < 5) {
    return { ok: false as const, error: "Kod en az 5 karakter olmalı." }
  }
  if (code.length > 40) {
    return { ok: false as const, error: "Kod en fazla 40 karakter olabilir." }
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9\-/.\s]*$/.test(code)) {
    return {
      ok: false as const,
      error: "Kod yalnızca harf, rakam, boşluk, tire, nokta ve eğik çizgi içerebilir.",
    }
  }
  return { ok: true as const, code }
}

export function validateDraftFile(file: { name: string; size: number }) {
  if (!file.name || file.size <= 0) {
    return { ok: false as const, error: "Dosya seçin." }
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false as const, error: "Dosya 10 MB sınırını aşıyor." }
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return {
      ok: false as const,
      error: "Yalnızca pdf, doc, docx, odt, jpg, png, tif ve udf dosyaları yüklenebilir.",
    }
  }
  return { ok: true as const }
}

export function safeFileName(name: string) {
  const base = name.split(/[/\\]/).pop() ?? "dosya"
  const cleaned = base.replace(/[\u0000-\u001f]/g, "").replace(/\s+/g, " ").trim()
  return (cleaned || "dosya").slice(0, 140)
}

export function fileHref(link: string, mode: string) {
  if (mode === "mock" && link.startsWith("/onizleme/dosya/")) {
    return { href: link, external: false }
  }
  if (mode === "google") {
    try {
      const url = new URL(link)
      const hostOk =
        url.hostname === "drive.google.com" || url.hostname === "docs.google.com"
      if (url.protocol === "https:" && hostOk) {
        return { href: url.toString(), external: true }
      }
    } catch {
      return null
    }
  }
  return null
}

export function parseFilter(value: string | undefined): TaskFilter {
  if (value && (FILTERS as readonly string[]).includes(value)) {
    return value as TaskFilter
  }
  return "tum"
}

export function parseView(value: string | undefined): TaskView {
  return value === "liste" ? "liste" : "pano"
}

export function matchesFilter(
  task: { status: TaskStatus; dueTone: DueTone; needsAction: boolean },
  filter: TaskFilter,
) {
  switch (filter) {
    case "bekleyen":
      return task.needsAction
    case "geciken":
      return task.dueTone === "overdue"
    case "yaklasan":
      return task.dueTone === "today" || task.dueTone === "soon"
    case "inceleme":
      return task.status === "INCELEME_BEKLIYOR"
    case "tamam":
      return task.status === "TAMAMLANDI"
    default:
      return true
  }
}

function foldTr(value: string) {
  return value.replace(/\u0130/g, "i").replace(/\u0049/g, "ı").toLowerCase()
}

export function matchesQuery(
  task: {
    title: string
    clientName: string
    fileNumber: string
    trackingCode: string | null
    assigneeName: string
    assignerName: string
  },
  query: string,
) {
  const needle = foldTr(query.trim())
  if (!needle) return true
  const haystack = foldTr(
    [
      task.title,
      task.clientName,
      task.fileNumber,
      task.trackingCode ?? "",
      task.assigneeName,
      task.assignerName,
    ].join("\n"),
  )
  return haystack.includes(needle)
}

export function parseLogMeta(meta: string | null) {
  if (!meta) return { fileName: null as string | null, trackingCode: null as string | null }
  try {
    const value = JSON.parse(meta) as { fileName?: unknown; trackingCode?: unknown }
    return {
      fileName: typeof value.fileName === "string" ? value.fileName : null,
      trackingCode: typeof value.trackingCode === "string" ? value.trackingCode : null,
    }
  } catch {
    return { fileName: null, trackingCode: null }
  }
}
