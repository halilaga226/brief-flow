import type {
  ClientCallStatus,
  DueTone,
  Role,
  TaskStatus,
  VisualTone,
} from "@/lib/workflow"

export type SessionUser = {
  id: string
  name: string
  username: string
  email: string
  role: Role
  title: string
}

export type TimelineEventDTO = {
  id: string
  type: string
  label: string
  note: string | null
  when: string
  actorName: string
  fileName: string | null
  trackingCode: string | null
}

export type TaskCardDTO = {
  id: string
  title: string
  clientName: string
  fileNumber: string
  description: string
  dueDate: string
  dueLabel: string
  dueTone: DueTone
  visualTone: VisualTone
  status: TaskStatus
  assignerId: string
  assigneeId: string
  assignerName: string
  assigneeName: string
  assigneeRole: Role
  relationLabel: string
  needsAction: boolean
  trackingCode: string | null
  listColor: string | null
  acceptedAt: string | null
  needsAccept: boolean
  canDelete: boolean
  expensePaid: boolean
  clientCallStatus: ClientCallStatus
  updatedAt: string
  completedAt: string | null
  logs: TimelineEventDTO[]
}

export type TaskFileDTO = {
  id: string
  kind: "INSTRUCTION" | "DRAFT"
  name: string
  sizeLabel: string
  uploadedByName: string
  when: string
  href: string | null
  external: boolean
  storageMode: "google" | "mock"
}

export type CommentDTO = {
  id: string
  body: string
  when: string
  authorId: string
  authorName: string
  authorTitle: string
  authorRole: Role
}

export type TaskDetailDTO = TaskCardDTO & {
  createdAt: string
  createdLabel: string
  completedLabel: string | null
  files: TaskFileDTO[]
  comments: CommentDTO[]
  assignerTitle: string
  assigneeTitle: string
  assignerRole: Role
  assigneeRole: Role
  myTurn: boolean
  canUpload: boolean
  canReview: boolean
  canTriage: boolean
  canManageOps: boolean
  canQueueSend: boolean
  canComplete: boolean
  canAccept: boolean
  nextStep: string
  latestDraft: { name: string; href: string | null; external: boolean } | null
  assignerDrive: { name: string; link: string } | null
}

export type NotificationDTO = {
  id: string
  title: string
  body: string
  read: boolean
  when: string
  taskId: string
}

export type ActivityDTO = {
  id: string
  label: string
  actorName: string
  taskId: string
  taskTitle: string
  when: string
  note: string | null
}

export type ColleagueDTO = {
  id: string
  name: string
  title: string
  role: Role
  email: string
}

export type ActionState = {
  ok?: boolean
  error?: string
  message?: string
} | null
