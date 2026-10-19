import type { SessionUser } from "@/lib/dto"
import { parseDueDate } from "@/lib/format"
import { prisma } from "@/lib/prisma"
import {
  canAssignCourthouseJob,
  canCompleteCourthouseJob,
  canManageCourthouses,
  canReopenCourthouseJob,
  cleanText,
  isAdmin,
  WorkflowError,
} from "@/lib/workflow"
import { ensureCourthouseSchema } from "@/server/ensure-courthouse-schema"

export type CourthouseDTO = {
  id: string
  name: string
  city: string
  notes: string
  openJobCount: number
}

export type CourthouseJobDTO = {
  id: string
  courthouseId: string
  courthouseName: string
  courthouseCity: string
  kind: "GORUSME" | "IS"
  title: string
  description: string
  clientName: string
  fileNumber: string
  dueDate: string | null
  assignerId: string
  assignerName: string
  assigneeId: string | null
  assigneeName: string | null
  completedAt: string | null
  completedByName: string | null
  createdAt: string
}

export function courthouseJobKindLabel(kind: "GORUSME" | "IS") {
  return kind === "GORUSME" ? "Görüşme" : "Adliye işi"
}

export async function listCourthouses(): Promise<CourthouseDTO[]> {
  await ensureCourthouseSchema()
  const rows = await prisma.courthouse.findMany({
    orderBy: [{ city: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { jobs: { where: { completedAt: null } } } },
    },
  })
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    city: row.city,
    notes: row.notes,
    openJobCount: row._count.jobs,
  }))
}

export async function listCourthouseJobs(): Promise<CourthouseJobDTO[]> {
  await ensureCourthouseSchema()
  const rows = await prisma.courthouseJob.findMany({
    orderBy: [{ completedAt: "asc" }, { dueDate: "asc" }, { updatedAt: "desc" }],
    include: {
      courthouse: { select: { name: true, city: true } },
      assigner: { select: { name: true } },
      assignee: { select: { name: true } },
      completedBy: { select: { name: true } },
    },
  })
  return rows.map((row) => ({
    id: row.id,
    courthouseId: row.courthouseId,
    courthouseName: row.courthouse.name,
    courthouseCity: row.courthouse.city,
    kind: row.kind,
    title: row.title,
    description: row.description,
    clientName: row.clientName,
    fileNumber: row.fileNumber,
    dueDate: row.dueDate?.toISOString() ?? null,
    assignerId: row.assignerId,
    assignerName: row.assigner.name,
    assigneeId: row.assigneeId,
    assigneeName: row.assignee?.name ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    completedByName: row.completedBy?.name ?? null,
    createdAt: row.createdAt.toISOString(),
  }))
}

export async function createCourthouse(
  actor: SessionUser,
  input: { name: string; city: string; notes: string },
) {
  await ensureCourthouseSchema()
  if (!canManageCourthouses(actor.role)) {
    throw new WorkflowError("Adliye eklemek yalnızca yönetici içindir.")
  }
  const name = cleanText(input.name)
  const city = cleanText(input.city)
  const notes = cleanText(input.notes)
  if (name.length < 3) throw new WorkflowError("Adliye adı en az 3 karakter olmalı.")
  const created = await prisma.courthouse.create({
    data: { name, city, notes },
  })
  return created.id
}

export async function deleteCourthouse(actor: SessionUser, id: string) {
  await ensureCourthouseSchema()
  if (!canManageCourthouses(actor.role)) {
    throw new WorkflowError("Adliyeyi yalnızca yönetici silebilir.")
  }
  const row = await prisma.courthouse.findUnique({
    where: { id },
    include: { _count: { select: { jobs: { where: { completedAt: null } } } } },
  })
  if (!row) throw new WorkflowError("Adliye bulunamadı.")
  if (row._count.jobs > 0) {
    throw new WorkflowError("Açık işi olan adliyeyi silemezsiniz. Önce işleri tamamlayın.")
  }
  await prisma.courthouse.delete({ where: { id } })
}

export async function createCourthouseJob(
  actor: SessionUser,
  input: {
    courthouseId: string
    kind: string
    title: string
    description: string
    clientName: string
    fileNumber: string
    dueDate: string
    assigneeId: string
  },
) {
  await ensureCourthouseSchema()
  if (!canAssignCourthouseJob(actor.role)) {
    throw new WorkflowError("Adliye işi atamak için yetkiniz yok.")
  }
  const title = cleanText(input.title)
  const description = cleanText(input.description)
  const clientName = cleanText(input.clientName)
  const fileNumber = cleanText(input.fileNumber)
  if (title.length < 3) throw new WorkflowError("İş başlığı en az 3 karakter olmalı.")
  const kind = input.kind === "GORUSME" ? "GORUSME" : "IS"
  const courthouse = await prisma.courthouse.findUnique({
    where: { id: cleanText(input.courthouseId) },
  })
  if (!courthouse) throw new WorkflowError("Adliye seçin.")

  let assigneeId: string | null = cleanText(input.assigneeId) || null
  if (assigneeId) {
    const assignee = await prisma.user.findUnique({ where: { id: assigneeId } })
    if (!assignee) throw new WorkflowError("Atanacak kişi bulunamadı.")
    if (assignee.role !== "INTERN") {
      throw new WorkflowError("Adliye işi yalnızca stajyere atanır.")
    }
  }

  const due = input.dueDate ? parseDueDate(input.dueDate) : null

  const created = await prisma.courthouseJob.create({
    data: {
      courthouseId: courthouse.id,
      kind,
      title,
      description,
      clientName,
      fileNumber,
      dueDate: due && !Number.isNaN(due.getTime()) ? due : null,
      assignerId: actor.id,
      assigneeId,
    },
  })
  return created.id
}

export async function completeCourthouseJob(actor: SessionUser, id: string) {
  await ensureCourthouseSchema()
  const row = await prisma.courthouseJob.findUnique({ where: { id } })
  if (!row) throw new WorkflowError("Adliye işi bulunamadı.")
  if (!canCompleteCourthouseJob({ completedAt: row.completedAt }, actor.role)) {
    throw new WorkflowError("Bu işi tamamlayamazsınız.")
  }
  await prisma.courthouseJob.update({
    where: { id },
    data: {
      completedAt: new Date(),
      completedById: actor.id,
    },
  })
}

export async function reopenCourthouseJob(actor: SessionUser, id: string) {
  await ensureCourthouseSchema()
  if (!canReopenCourthouseJob(actor.role)) {
    throw new WorkflowError("İş yeniden açmak için yetkiniz yok.")
  }
  const row = await prisma.courthouseJob.findUnique({ where: { id } })
  if (!row) throw new WorkflowError("Adliye işi bulunamadı.")
  if (!row.completedAt) throw new WorkflowError("Bu iş zaten açık.")
  if (!isAdmin(actor.role) && row.assignerId !== actor.id) {
    throw new WorkflowError("Yalnızca atadığınız işi yeniden açabilirsiniz.")
  }
  await prisma.courthouseJob.update({
    where: { id },
    data: { completedAt: null, completedById: null },
  })
}

export async function deleteCourthouseJob(actor: SessionUser, id: string) {
  await ensureCourthouseSchema()
  const row = await prisma.courthouseJob.findUnique({ where: { id } })
  if (!row) throw new WorkflowError("Adliye işi bulunamadı.")
  if (!isAdmin(actor.role) && row.assignerId !== actor.id) {
    throw new WorkflowError("Yalnızca atadığınız işi silebilirsiniz.")
  }
  if (actor.role === "INTERN") {
    throw new WorkflowError("Stajyer adliye işini silemez.")
  }
  await prisma.courthouseJob.delete({ where: { id } })
}
