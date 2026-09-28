import type { SessionUser } from "@/lib/dto"
import { prisma } from "@/lib/prisma"
import {
  canAssignTask,
  canManageWorkItems,
  cleanText,
  isAdmin,
  WorkflowError,
} from "@/lib/workflow"

export type WorkItemDTO = {
  id: string
  clientName: string
  opposingParty: string
  courtName: string
  fileNumber: string
  courtFile: string
  workToDo: string
  notes: string
  ownerId: string
  ownerName: string
  ownerRole: string
  taskCount: number
  entryCount: number
  createdAt: string
}

export type WorkItemEntryDTO = {
  id: string
  content: string
  createdByName: string
  createdAt: string
}

export type WorkItemDetailDTO = WorkItemDTO & {
  entries: WorkItemEntryDTO[]
  tasks: {
    id: string
    title: string
    status: string
    assigneeName: string
    dueLabel: string
    completedAt: string | null
  }[]
}

function validateWorkItem(input: {
  clientName: string
  opposingParty: string
  courtName: string
  fileNumber: string
  courtFile: string
  workToDo: string
  notes: string
}) {
  const courtName = cleanText(input.courtName)
  const fileNumber = cleanText(input.fileNumber)
  const workToDo = cleanText(input.workToDo)
  const notes = cleanText(input.notes)
  const clientName = cleanText(input.clientName) || "Belirtilmedi"
  const opposingParty = cleanText(input.opposingParty) || "Belirtilmedi"
  const courtFile = cleanText(input.courtFile) || fileNumber

  if (courtName.length < 2) return "Mahkeme adı gerekli."
  if (fileNumber.length < 2) return "Dosya no gerekli."
  if (workToDo.length < 3) return "Yapılacaklar en az 3 karakter olmalı."

  return {
    clientName,
    opposingParty,
    courtName,
    fileNumber,
    courtFile,
    workToDo,
    notes,
  }
}

function workItemWhere(actor: SessionUser, scope: "all" | "own" | "intern" = "all") {
  if (isAdmin(actor.role)) {
    if (scope === "own") return { ownerId: actor.id }
    if (scope === "intern") return { owner: { role: "INTERN" as const } }
    return undefined
  }
  if (actor.role === "LAWYER") {
    if (scope === "own") return { ownerId: actor.id }
    if (scope === "intern") return { owner: { role: "INTERN" as const } }
    return {
      OR: [{ ownerId: actor.id }, { owner: { role: "INTERN" as const } }],
    }
  }
  return { ownerId: actor.id }
}

function assertWorkItemAccess(
  actor: SessionUser,
  row: { ownerId: string; owner?: { role: string } | null },
) {
  if (isAdmin(actor.role)) return
  if (row.ownerId === actor.id) return
  if (actor.role === "LAWYER" && row.owner?.role === "INTERN") return
  throw new WorkflowError("Bu iş kaydına erişemezsiniz.")
}

export async function listWorkItems(
  actor: SessionUser,
  scope: "all" | "own" | "intern" = "all",
): Promise<WorkItemDTO[]> {
  if (!canManageWorkItems(actor.role)) {
    throw new WorkflowError("İş listesine erişemezsiniz.")
  }
  if (scope === "intern" && actor.role === "INTERN") {
    throw new WorkflowError("Bu görünüme erişemezsiniz.")
  }
  const rows = await prisma.workItem.findMany({
    where: workItemWhere(actor, scope),
    orderBy: { updatedAt: "desc" },
    include: {
      owner: { select: { name: true, role: true } },
      _count: { select: { tasks: true, entries: true } },
    },
  })
  return rows.map((row) => ({
    id: row.id,
    clientName: row.clientName,
    opposingParty: row.opposingParty,
    courtName: row.courtName,
    fileNumber: row.fileNumber,
    courtFile: row.courtFile,
    workToDo: row.workToDo,
    notes: row.notes,
    ownerId: row.ownerId,
    ownerName: row.owner.name,
    ownerRole: row.owner.role,
    taskCount: row._count.tasks,
    entryCount: row._count.entries,
    createdAt: row.createdAt.toISOString(),
  }))
}

export async function getWorkItem(actor: SessionUser, id: string) {
  if (!canManageWorkItems(actor.role)) {
    throw new WorkflowError("İş listesine erişemezsiniz.")
  }
  const row = await prisma.workItem.findUnique({
    where: { id },
    include: { owner: { select: { role: true } } },
  })
  if (!row) throw new WorkflowError("İş kaydı bulunamadı.")
  assertWorkItemAccess(actor, row)
  return row
}

export async function getWorkItemDetail(
  actor: SessionUser,
  id: string,
): Promise<WorkItemDetailDTO> {
  if (!canManageWorkItems(actor.role)) {
    throw new WorkflowError("İş listesine erişemezsiniz.")
  }
  const row = await prisma.workItem.findUnique({
    where: { id },
    include: {
      owner: { select: { name: true, role: true } },
      _count: { select: { tasks: true, entries: true } },
      entries: {
        include: { createdBy: true },
        orderBy: { createdAt: "desc" },
      },
      tasks: {
        include: { assignee: true },
        orderBy: { updatedAt: "desc" },
      },
    },
  })
  if (!row) throw new WorkflowError("İş kaydı bulunamadı.")
  assertWorkItemAccess(actor, row)

  const { formatDay } = await import("@/lib/format")

  return {
    id: row.id,
    clientName: row.clientName,
    opposingParty: row.opposingParty,
    courtName: row.courtName,
    fileNumber: row.fileNumber,
    courtFile: row.courtFile,
    workToDo: row.workToDo,
    notes: row.notes,
    ownerId: row.ownerId,
    ownerName: row.owner.name,
    ownerRole: row.owner.role,
    taskCount: row._count.tasks,
    entryCount: row._count.entries,
    createdAt: row.createdAt.toISOString(),
    entries: row.entries.map((entry) => ({
      id: entry.id,
      content: entry.content,
      createdByName: entry.createdBy.name,
      createdAt: entry.createdAt.toISOString(),
    })),
    tasks: row.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      assigneeName: task.assignee.name,
      dueLabel: formatDay(task.dueDate.toISOString()),
      completedAt: task.completedAt?.toISOString() ?? null,
    })),
  }
}

export async function createWorkItem(
  actor: SessionUser,
  input: {
    clientName: string
    opposingParty: string
    courtName: string
    fileNumber: string
    courtFile: string
    workToDo: string
    notes: string
  },
) {
  if (!canManageWorkItems(actor.role)) {
    throw new WorkflowError("İş listesine kayıt ekleyemezsiniz.")
  }
  const checked = validateWorkItem(input)
  if (typeof checked === "string") throw new WorkflowError(checked)
  const created = await prisma.workItem.create({
    data: {
      ...checked,
      ownerId: actor.id,
    },
  })
  return created.id
}

export async function deleteWorkItem(actor: SessionUser, id: string) {
  const row = await getWorkItem(actor, id)
  // Yalnızca kendi kaydını silebilir (admin hariç)
  if (!isAdmin(actor.role) && row.ownerId !== actor.id) {
    throw new WorkflowError("Yalnızca kendi dosya kaydınızı silebilirsiniz.")
  }
  await prisma.workItem.delete({ where: { id: row.id } })
}

export async function addWorkItemEntry(
  actor: SessionUser,
  workItemId: string,
  content: string,
) {
  const row = await getWorkItem(actor, workItemId)
  const text = cleanText(content)
  if (text.length < 2) throw new WorkflowError("Yapılanlar için en az 2 karakter yazın.")
  const created = await prisma.workItemEntry.create({
    data: {
      workItemId: row.id,
      content: text,
      createdById: actor.id,
    },
  })
  await prisma.workItem.update({
    where: { id: row.id },
    data: { updatedAt: new Date() },
  })
  return created.id
}
