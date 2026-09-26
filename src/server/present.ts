import type { Prisma } from "@prisma/client"
import {
  dueTone,
  formatBytes,
  formatDateTime,
  formatDay,
  istanbulMonthKey,
} from "@/lib/format"
import {
  canComplete,
  canReview,
  canUploadDraft,
  fileHref,
  isAdmin,
  logLabel,
  needsMyAction,
  nextStepCopy,
  parseLogMeta,
  roleLabel,
  taskVisualTone,
} from "@/lib/workflow"
import type { Role } from "@/lib/workflow"
import type {
  ActivityDTO,
  CommentDTO,
  NotificationDTO,
  TaskCardDTO,
  TaskDetailDTO,
  TaskFileDTO,
  TimelineEventDTO,
} from "@/lib/dto"

const cardInclude = {
  assigner: true,
  assignee: true,
  logs: {
    include: { actor: true },
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.TaskInclude

const detailInclude = {
  ...cardInclude,
  files: {
    include: { uploadedBy: true },
    orderBy: { createdAt: "asc" as const },
  },
  comments: {
    include: { author: true },
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.TaskInclude

export type TaskCardRecord = Prisma.TaskGetPayload<{ include: typeof cardInclude }>
export type TaskDetailRecord = Prisma.TaskGetPayload<{ include: typeof detailInclude }>

export const taskCardInclude = cardInclude
export const taskDetailInclude = detailInclude

function toTimeline(record: TaskCardRecord): TimelineEventDTO[] {
  return record.logs.map((log) => {
    const meta = parseLogMeta(log.meta)
    return {
      id: log.id,
      type: log.type,
      label: logLabel(log.type),
      note: log.note,
      when: formatDateTime(log.createdAt.toISOString()),
      actorName: log.actor.name,
      fileName: meta.fileName,
      trackingCode: meta.trackingCode,
    }
  })
}

export function toTaskCard(
  record: TaskCardRecord,
  userId: string,
  role: Role = "INTERN",
): TaskCardDTO {
  const dueDate = record.dueDate.toISOString()
  const tone = dueTone(dueDate, record.status)
  const needsAction = needsMyAction(record, userId, role)
  const relationLabel = isAdmin(role)
    ? `${record.assigner.name} → ${record.assignee.name}`
    : record.assigneeId === userId
      ? "Size atandı"
      : "Siz atadınız"
  return {
    id: record.id,
    title: record.title,
    clientName: record.clientName,
    fileNumber: record.fileNumber,
    description: record.description,
    dueDate,
    dueLabel: formatDay(dueDate),
    dueTone: tone,
    visualTone: taskVisualTone({
      status: record.status,
      dueTone: tone,
      needsAction,
    }),
    status: record.status,
    assignerId: record.assignerId,
    assigneeId: record.assigneeId,
    assignerName: record.assigner.name,
    assigneeName: record.assignee.name,
    relationLabel,
    needsAction,
    trackingCode: record.trackingCode,
    updatedAt: record.updatedAt.toISOString(),
    completedAt: record.completedAt?.toISOString() ?? null,
    logs: toTimeline(record),
  }
}

function toFile(file: TaskDetailRecord["files"][number]): TaskFileDTO {
  const link = fileHref(file.webViewLink, file.storageMode)
  return {
    id: file.id,
    kind: file.kind,
    name: file.name,
    sizeLabel: formatBytes(file.size),
    uploadedByName: file.uploadedBy.name,
    when: formatDateTime(file.createdAt.toISOString()),
    href: link?.href ?? null,
    external: link?.external ?? false,
    storageMode: file.storageMode === "google" ? "google" : "mock",
  }
}

export function toTaskDetail(
  record: TaskDetailRecord,
  userId: string,
  role: Role,
): TaskDetailDTO {
  const card = toTaskCard(record, userId, role)
  const files = record.files.map(toFile)
  const drafts = files.filter((file) => file.kind === "DRAFT")
  const latest = drafts[drafts.length - 1] ?? null
  const myTurn = card.needsAction
  const comments: CommentDTO[] = record.comments.map((comment) => ({
    id: comment.id,
    body: comment.body,
    when: formatDateTime(comment.createdAt.toISOString()),
    authorId: comment.authorId,
    authorName: comment.author.name,
    authorTitle: comment.author.title,
    authorRole: comment.author.role,
  }))

  return {
    ...card,
    createdAt: record.createdAt.toISOString(),
    createdLabel: formatDateTime(record.createdAt.toISOString()),
    completedLabel: record.completedAt
      ? formatDateTime(record.completedAt.toISOString())
      : null,
    files,
    comments,
    assignerTitle: record.assigner.title,
    assigneeTitle: record.assignee.title,
    assignerRole: record.assigner.role,
    assigneeRole: record.assignee.role,
    myTurn,
    canUpload: canUploadDraft(record, userId, role),
    canReview: canReview(record, userId, role),
    canComplete: canComplete(record, userId, role),
    nextStep: nextStepCopy({ status: record.status, myTurn }),
    latestDraft: latest
      ? { name: latest.name, href: latest.href, external: latest.external }
      : null,
  }
}

export function toNotification(row: {
  id: string
  title: string
  body: string
  read: boolean
  createdAt: Date
  taskId: string
}): NotificationDTO {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    read: row.read,
    when: formatDateTime(row.createdAt.toISOString()),
    taskId: row.taskId,
  }
}

export function toActivity(row: {
  id: string
  type: string
  note: string | null
  createdAt: Date
  actor: { name: string }
  task: { id: string; title: string }
}): ActivityDTO {
  return {
    id: row.id,
    label: logLabel(row.type),
    actorName: row.actor.name,
    taskId: row.task.id,
    taskTitle: row.task.title,
    when: formatDateTime(row.createdAt.toISOString()),
    note: row.note,
  }
}

export function sameMonth(iso: string | null, now = new Date()) {
  if (!iso) return false
  return istanbulMonthKey(new Date(iso)) === istanbulMonthKey(now)
}

export { roleLabel }
