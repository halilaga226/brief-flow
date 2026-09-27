import type { SessionUser } from "@/lib/dto"
import { prisma } from "@/lib/prisma"
import { canCreateTask, cleanText, isAdmin, WorkflowError } from "@/lib/workflow"

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

export async function listWorkItems(actor: SessionUser): Promise<WorkItemDTO[]> {
  if (!canCreateTask(actor.role)) {
    throw new WorkflowError("İş listesi yalnızca avukat ve yöneticilere açıktır.")
  }
  const rows = await prisma.workItem.findMany({
    where: isAdmin(actor.role) ? undefined : { ownerId: actor.id },
    orderBy: { updatedAt: "desc" },
    include: {
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
    taskCount: row._count.tasks,
    entryCount: row._count.entries,
    createdAt: row.createdAt.toISOString(),
  }))
}

export async function getWorkItem(actor: SessionUser, id: string) {
  if (!canCreateTask(actor.role)) {
    throw new WorkflowError("İş listesi yalnızca avukat ve yöneticilere açıktır.")
  }
  const row = await prisma.workItem.findUnique({ where: { id } })
  if (!row) throw new WorkflowError("İş kaydı bulunamadı.")
  if (!isAdmin(actor.role) && row.ownerId !== actor.id) {
    throw new WorkflowError("Bu iş kaydına erişemezsiniz.")
  }
  return row
}

export async function getWorkItemDetail(
  actor: SessionUser,
  id: string,
): Promise<WorkItemDetailDTO> {
  if (!canCreateTask(actor.role)) {
    throw new WorkflowError("İş listesi yalnızca avukat ve yöneticilere açıktır.")
  }
  const row = await prisma.workItem.findUnique({
    where: { id },
    include: {
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
  if (!isAdmin(actor.role) && row.ownerId !== actor.id) {
    throw new WorkflowError("Bu iş kaydına erişemezsiniz.")
  }

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
  if (!canCreateTask(actor.role)) {
    throw new WorkflowError("Yalnızca avukat veya yönetici iş listesine kayıt ekleyebilir.")
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
