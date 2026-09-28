export const ROLES = ["LAWYER", "INTERN", "ADMIN"] as const
export type Role = (typeof ROLES)[number]

export const STATUSES = [
  "ATANDI",
  "INCELEME_BEKLIYOR",
  "REVIZE_ISTENDI",
  "ONAYLANDI",
  "GONDERIM_BEKLIYOR",
  "TAMAMLANDI",
] as const
export type TaskStatus = (typeof STATUSES)[number]

export const CLIENT_CALL_STATUSES = ["YOK", "ARANACAK", "YAPILDI"] as const
export type ClientCallStatus = (typeof CLIENT_CALL_STATUSES)[number]

export type DueTone = "done" | "overdue" | "today" | "soon" | "later"
export type VisualTone = "yellow" | "red" | "neutral"

export const FILTERS = [
  "tum",
  "atanan",
  "atadigim",
  "bekleyen",
  "inceleme",
  "onay",
  "gonderim",
  "arama",
  "geciken",
  "tamam",
  "atandi",
  "gonderilecek",
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
    hint: "Taslak WhatsApp ile gönderildi, avukat incelemesi bekleniyor.",
  },
  REVIZE_ISTENDI: {
    label: "Revize istendi",
    hint: "Avukat notuyla iş yürütücüye döndü.",
  },
  ONAYLANDI: {
    label: "Onaylandı",
    hint: "Atayan avukat masraf, arama ve gönderim kararını verir.",
  },
  GONDERIM_BEKLIYOR: {
    label: "Gönderim bekliyor",
    hint: "Atayan avukat gönderime aldı. Evrak kodu girilecek.",
  },
  TAMAMLANDI: {
    label: "Tamamlandı",
    hint: "Gönderim kodu işlendi.",
  },
}

export const CLIENT_CALL_META: Record<ClientCallStatus, string> = {
  YOK: "Arama yok",
  ARANACAK: "Arama yapılacak",
  YAPILDI: "Arama yapıldı",
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
    status: "ONAYLANDI",
    title: "Onaylandı",
    description: "Masraf / arama / gönderim",
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
  if (role === "ADMIN") return "Yönetici"
  if (role === "LAWYER") return "Avukat"
  return "Stajyer"
}

export function isAdmin(role: Role) {
  return role === "ADMIN"
}

export function canManageUsers(role: Role) {
  return role === "ADMIN" || role === "LAWYER"
}

export function logLabel(type: string) {
  switch (type) {
    case "CREATED":
      return "Görev oluşturuldu"
    case "ACCEPTED":
      return "İş kabul edildi"
    case "DRAFT_UPLOADED":
      return "Taslak gönderildi (WhatsApp)"
    case "REVISION_REQUESTED":
      return "Revizyon istendi"
    case "APPROVED":
      return "Taslak onaylandı"
    case "EXPENSE_MARKED":
      return "Masraf yatırıldı"
    case "CLIENT_CALL_UPDATED":
      return "Müvekkil araması güncellendi"
    case "SEND_QUEUED":
      return "Gönderime alındı"
    case "COMPLETED":
      return "Gönderim tamamlandı"
    case "DELETED":
      return "İş silindi"
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

export function canViewTask(
  task: {
    assignerId: string
    assigneeId: string
    /** Avukat, stajyere atanmış tüm işleri görebilir. */
    assigneeRole?: Role
  },
  userId: string,
  role: Role,
) {
  if (isAdmin(role) || isParticipant(task, userId)) return true
  if (role === "LAWYER" && task.assigneeRole === "INTERN") return true
  return false
}

export function canCreateTask(role: Role) {
  return role === "LAWYER" || role === "ADMIN"
}

/** Dosya kaydı (iş ekle) — stajyer dahil herkes. */
export function canManageWorkItems(_role: Role) {
  return true
}

export function canAccessWorkList(_role: Role) {
  return true
}

export function canAssignTask(role: Role) {
  return role === "LAWYER" || role === "ADMIN"
}

export function needsMyAction(
  task: { status: TaskStatus; assignerId: string; assigneeId: string },
  userId: string,
  role?: Role,
) {
  if (role === "ADMIN") {
    return task.status !== "TAMAMLANDI"
  }
  if (
    task.assigneeId === userId &&
    (task.status === "ATANDI" ||
      task.status === "REVIZE_ISTENDI" ||
      task.status === "GONDERIM_BEKLIYOR")
  ) {
    return true
  }
  if (task.assignerId === userId) {
    return task.status === "INCELEME_BEKLIYOR" || task.status === "ONAYLANDI"
  }
  return false
}

export function canUploadDraft(
  task: { status: TaskStatus; assigneeId: string; acceptedAt?: Date | string | null },
  userId: string,
  role?: Role,
) {
  if (!(task.status === "ATANDI" || task.status === "REVIZE_ISTENDI")) return false
  if (!task.acceptedAt && task.assigneeId === userId && !isAdmin(role ?? "INTERN")) return false
  return isAdmin(role ?? "INTERN") || task.assigneeId === userId
}

export function canAcceptTask(
  task: { assigneeId: string; acceptedAt?: Date | string | null; status: TaskStatus },
  userId: string,
  role?: Role,
) {
  if (task.status === "TAMAMLANDI") return false
  if (task.acceptedAt) return false
  return task.assigneeId === userId || isAdmin(role ?? "INTERN")
}

export function canDeleteTask(
  task: { assignerId: string; assigneeId: string; status: TaskStatus },
  userId: string,
  role: Role,
) {
  if (role === "ADMIN") return true
  if (role !== "LAWYER") return false
  // Avukat kendi verdiği veya kendine gelen işi silebilir; tamamlanınca da silinebilir.
  return task.assignerId === userId || task.assigneeId === userId
}

/** Ana sayfada gösterilecek işler: kabul bekleyen + son günlü (yaklaşan/gecikmiş). */
export function showsOnHome(
  task: {
    assigneeId: string
    assignerId: string
    acceptedAt: Date | string | null
    status: TaskStatus
    dueTone: DueTone
    needsAction: boolean
  },
  userId: string,
  role: Role,
) {
  if (task.status === "TAMAMLANDI") {
    // Avukat tamamlananı ana ekranda görsün ki silebilsin
    return role === "LAWYER" || role === "ADMIN"
      ? task.assignerId === userId || task.assigneeId === userId || role === "ADMIN"
      : false
  }
  if (task.assigneeId === userId && !task.acceptedAt) return true
  if (task.dueTone === "overdue" || task.dueTone === "today" || task.dueTone === "soon") {
    return isParticipant(task, userId) || isAdmin(role)
  }
  // Avukat/admin için inceleme-onay gibi aksiyon bekleyenler
  if ((role === "LAWYER" || role === "ADMIN") && task.needsAction) return true
  return false
}

export function canReview(
  task: { status: TaskStatus; assignerId: string },
  userId: string,
  role: Role,
) {
  if (task.status !== "INCELEME_BEKLIYOR") return false
  return isAdmin(role) || (role === "LAWYER" && task.assignerId === userId)
}

export function canManageOps(
  task: { status: TaskStatus; assignerId: string },
  userId: string,
  role: Role,
) {
  if (!(task.status === "ONAYLANDI" || task.status === "GONDERIM_BEKLIYOR")) {
    return false
  }
  return isAdmin(role) || task.assignerId === userId
}

export function canQueueSend(
  task: { status: TaskStatus; assignerId: string },
  userId: string,
  role: Role,
) {
  if (task.status !== "ONAYLANDI") return false
  return isAdmin(role) || task.assignerId === userId
}

export function canComplete(
  task: { status: TaskStatus; assigneeId: string; assignerId?: string },
  userId: string,
  role?: Role,
) {
  if (task.status !== "GONDERIM_BEKLIYOR" && task.status !== "ONAYLANDI") return false
  if (isAdmin(role ?? "INTERN")) return true
  if (task.assigneeId === userId && task.status === "GONDERIM_BEKLIYOR") return true
  if (task.assignerId === userId && (role === "LAWYER" || role === "ADMIN")) return true
  return false
}

export function canComment(
  task: { assignerId: string; assigneeId: string },
  userId: string,
  role?: Role,
) {
  return isAdmin(role ?? "INTERN") || isParticipant(task, userId)
}

export function taskVisualTone(input: {
  status: TaskStatus
  dueTone: DueTone
  needsAction: boolean
  clientCallStatus?: ClientCallStatus
}): VisualTone {
  if (
    input.status === "REVIZE_ISTENDI" ||
    input.dueTone === "overdue" ||
    input.dueTone === "today" ||
    input.clientCallStatus === "ARANACAK"
  ) {
    return "red"
  }
  if (
    input.status === "TAMAMLANDI" ||
    input.status === "ATANDI" ||
    input.status === "ONAYLANDI" ||
    input.needsAction
  ) {
    return "yellow"
  }
  return "neutral"
}

export function nextStepCopy(input: {
  status: TaskStatus
  myTurn: boolean
  expensePaid?: boolean
  clientCallStatus?: ClientCallStatus
}) {
  if (input.status === "TAMAMLANDI") {
    return "Gönderim kodu işlendi. Bu iş kapanmış durumda."
  }
  if (input.status === "ONAYLANDI" && input.myTurn) {
    const bits = [
      input.expensePaid ? "Masraf yatırıldı." : "Masraf yatırmayı işaretleyin.",
      input.clientCallStatus === "ARANACAK"
        ? "Müvekkil aranacak."
        : input.clientCallStatus === "YAPILDI"
          ? "Arama yapıldı."
          : "Gerekirse müvekkil aramasını işaretleyin.",
      "Hazır olduğunuzda gönderime alın.",
    ]
    return bits.join(" ")
  }
  if (input.myTurn) {
    if (input.status === "ATANDI") {
      return "Taslağı WhatsApp’tan avukata gönderin; ardından burada «Taslak gönderildi»yi işaretleyin."
    }
    if (input.status === "REVIZE_ISTENDI") {
      return "Revizyon notuna göre taslağı güncelleyip WhatsApp’tan yeniden gönderin; sonra «Taslak gönderildi»yi işaretleyin."
    }
    if (input.status === "GONDERIM_BEKLIYOR") {
      return "Onaylı evrakı UYAP, PTT veya ilgili merciye iletin. Barkod ya da evrak kodu olmadan iş kapanmaz."
    }
    if (input.status === "INCELEME_BEKLIYOR") {
      return "WhatsApp’tan gelen taslağı inceleyin. Onaylayın veya not düşerek revize isteyin."
    }
  }
  if (input.status === "ATANDI" || input.status === "REVIZE_ISTENDI") {
    return "Taslak karşı taraftan bekleniyor."
  }
  if (input.status === "INCELEME_BEKLIYOR") {
    return "Atayan avukatın incelemesi bekleniyor."
  }
  if (input.status === "ONAYLANDI") {
    return "Atayan avukat masraf, arama ve gönderim kararını veriyor."
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
  return value === "pano" ? "pano" : "liste"
}

export const DUE_WINDOWS = ["1g", "3g", "1h", "1ay"] as const
export type DueWindow = (typeof DUE_WINDOWS)[number]

export function parseDueWindow(value: string | undefined): DueWindow | null {
  if (value && (DUE_WINDOWS as readonly string[]).includes(value)) {
    return value as DueWindow
  }
  return null
}

export function dueWindowDays(window: DueWindow) {
  if (window === "1g") return 1
  if (window === "3g") return 3
  if (window === "1h") return 7
  return 30
}

export function matchesDueWindow(
  task: { dueDate: string; status: TaskStatus },
  window: DueWindow | null,
  now = new Date(),
) {
  if (!window) return true
  if (task.status === "TAMAMLANDI") return false
  const today = istanbulDayKeySafe(now)
  const due = istanbulDayKeySafe(new Date(task.dueDate))
  const limit = addDaysKeySafe(today, dueWindowDays(window) - 1)
  return due >= today && due <= limit
}

function istanbulDayKeySafe(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

function addDaysKeySafe(key: string, days: number) {
  const [year, month, day] = key.split("-").map(Number)
  const utc = new Date(Date.UTC(year, month - 1, day + days))
  const yyyy = utc.getUTCFullYear()
  const mm = String(utc.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(utc.getUTCDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

export function matchesFilter(
  task: {
    status: TaskStatus
    dueTone: DueTone
    needsAction: boolean
    clientCallStatus?: ClientCallStatus
    assignerId?: string
    assigneeId?: string
  },
  filter: TaskFilter,
  userId?: string,
) {
  switch (filter) {
    case "atanan":
      return Boolean(userId) && task.assigneeId === userId
    case "atadigim":
      return Boolean(userId) && task.assignerId === userId
    case "bekleyen":
      return task.needsAction
    case "geciken":
      return task.dueTone === "overdue"
    case "inceleme":
      return task.status === "INCELEME_BEKLIYOR"
    case "onay":
      return task.status === "ONAYLANDI"
    case "gonderim":
      return task.status === "GONDERIM_BEKLIYOR"
    case "arama":
      return task.clientCallStatus === "ARANACAK"
    case "tamam":
      return task.status === "TAMAMLANDI"
    case "atandi":
      return task.status === "ATANDI" || task.status === "REVIZE_ISTENDI"
    case "gonderilecek":
      return task.status === "ONAYLANDI" || task.status === "GONDERIM_BEKLIYOR"
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
