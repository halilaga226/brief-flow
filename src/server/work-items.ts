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
  createdAt: string
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
  const clientName = cleanText(input.clientName)
  const opposingParty = cleanText(input.opposingParty)
  const courtName = cleanText(input.courtName)
  const fileNumber = cleanText(input.fileNumber)
  const courtFile = cleanText(input.courtFile)
  const workToDo = cleanText(input.workToDo)
  const notes = cleanText(input.notes)
  if (clientName.length < 2) return "Müvekkil adı gerekli."
  if (opposingParty.length < 2) return "Karşı taraf gerekli."
  if (courtName.length < 2) return "Mahkeme adı gerekli."
  if (fileNumber.length < 2) return "Dava dosyası gerekli."
  if (courtFile.length < 2) return "Mahkeme dosyası gerekli."
  if (workToDo.length < 3) return "Yapılacak iş en az 3 karakter olmalı."
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
    include: { _count: { select: { tasks: true } } },
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
