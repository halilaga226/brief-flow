import type { SessionUser } from "@/lib/dto"
import { partyNameKey } from "@/lib/party-import"
import { prisma } from "@/lib/prisma"
import { canCreateTask, cleanText, isAdmin, WorkflowError } from "@/lib/workflow"

export type ClientListDTO = {
  id: string
  name: string
  fileCount: number
  taskCount: number
  updatedAt: string
}

export type CaseFileListDTO = {
  id: string
  fileNumber: string
  courtName: string
  notes: string
  taskCount: number
  updatedAt: string
}

export type CaseFileDetailDTO = CaseFileListDTO & {
  clientId: string
  clientName: string
  tasks: {
    id: string
    title: string
    status: string
    assigneeName: string
    assignerName: string
    dueLabel: string
  }[]
}

function normalizeName(name: string) {
  return cleanText(name)
}

function canAccessOfficeClients(actor: SessionUser) {
  return canCreateTask(actor.role) || isAdmin(actor.role)
}

/** Görev atarken müvekkil + dosya no ile bulur veya oluşturur (atayan avukatın altında). */
export async function resolveClientAndCaseFile(
  ownerId: string,
  clientName: string,
  fileNumber: string,
  courtName = "",
) {
  const name = normalizeName(clientName)
  const nameKey = partyNameKey(name)
  const number = cleanText(fileNumber)
  if (name.length < 2) throw new WorkflowError("Müvekkil adı gerekli.")
  if (number.length < 2) throw new WorkflowError("Dosya no gerekli.")

  const existingClients = await prisma.client.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, nameKey: true },
    take: 8000,
  })
  const match = existingClients.find(
    (row) =>
      row.nameKey === nameKey ||
      partyNameKey(row.name) === nameKey ||
      row.name.localeCompare(name, "tr", { sensitivity: "accent" }) === 0,
  )

  const client =
    match ??
    (await prisma.client.create({
      data: { name, nameKey, ownerId },
    }))

  if (match && (!match.nameKey || match.nameKey !== nameKey)) {
    await prisma.client.update({
      where: { id: match.id },
      data: { nameKey },
    })
  }

  const caseFile = await prisma.caseFile.upsert({
    where: {
      clientId_fileNumber: { clientId: client.id, fileNumber: number },
    },
    create: {
      clientId: client.id,
      fileNumber: number,
      courtName: cleanText(courtName),
    },
    update: {
      courtName: cleanText(courtName) || undefined,
      deletedAt: null,
    },
  })

  return { clientId: client.id, caseFileId: caseFile.id, clientName: client.name, fileNumber: number }
}

export async function listClients(actor: SessionUser): Promise<ClientListDTO[]> {
  if (!canCreateTask(actor.role) && actor.role !== "INTERN") {
    throw new WorkflowError("Müvekkil listesine erişemezsiniz.")
  }
  // Avukat/yönetici: büro ortak listesi. Stajyer: yalnız kendi oluşturdukları (nadir).
  const where =
    actor.role === "INTERN"
      ? { ownerId: actor.id, deletedAt: null }
      : { deletedAt: null }
  const rows = await prisma.client.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      caseFiles: {
        where: { deletedAt: null },
        include: { _count: { select: { tasks: true } } },
      },
    },
  })
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    fileCount: row.caseFiles.length,
    taskCount: row.caseFiles.reduce((sum, file) => sum + file._count.tasks, 0),
    updatedAt: row.updatedAt.toISOString(),
  }))
}

export async function getClientWithFiles(actor: SessionUser, clientId: string) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      caseFiles: {
        where: { deletedAt: null },
        orderBy: { updatedAt: "desc" },
        include: { _count: { select: { tasks: true } } },
      },
    },
  })
  if (!client || client.deletedAt) throw new WorkflowError("Müvekkil bulunamadı.")
  if (!canAccessOfficeClients(actor) && client.ownerId !== actor.id) {
    throw new WorkflowError("Bu müvekkile erişemezsiniz.")
  }
  return {
    id: client.id,
    name: client.name,
    files: client.caseFiles.map(
      (file): CaseFileListDTO => ({
        id: file.id,
        fileNumber: file.fileNumber,
        courtName: file.courtName,
        notes: file.notes,
        taskCount: file._count.tasks,
        updatedAt: file.updatedAt.toISOString(),
      }),
    ),
  }
}

export async function createClient(actor: SessionUser, name: string) {
  if (!canCreateTask(actor.role)) {
    throw new WorkflowError("Yalnızca avukat müvekkil ekleyebilir.")
  }
  const cleaned = normalizeName(name)
  const nameKey = partyNameKey(cleaned)
  if (cleaned.length < 2) throw new WorkflowError("Müvekkil adı en az 2 karakter olmalı.")
  const duplicate = await prisma.client.findFirst({
    where: { deletedAt: null, OR: [{ nameKey }, { name: cleaned }] },
  })
  if (duplicate) throw new WorkflowError("Bu müvekkil zaten kayıtlı.")
  try {
    return await prisma.client.create({
      data: { name: cleaned, nameKey, ownerId: actor.id },
    })
  } catch {
    throw new WorkflowError("Bu müvekkil zaten kayıtlı.")
  }
}

export async function createCaseFile(
  actor: SessionUser,
  clientId: string,
  input: { fileNumber: string; courtName?: string; notes?: string },
) {
  if (!canCreateTask(actor.role)) {
    throw new WorkflowError("Yalnızca avukat dosya ekleyebilir.")
  }
  const client = await prisma.client.findUnique({ where: { id: clientId } })
  if (!client) throw new WorkflowError("Müvekkil bulunamadı.")
  if (!canAccessOfficeClients(actor) && client.ownerId !== actor.id) {
    throw new WorkflowError("Bu müvekkile dosya ekleyemezsiniz.")
  }
  const fileNumber = cleanText(input.fileNumber)
  if (fileNumber.length < 2) throw new WorkflowError("Dosya no gerekli.")
  try {
    return await prisma.caseFile.create({
      data: {
        clientId,
        fileNumber,
        courtName: cleanText(input.courtName ?? ""),
        notes: cleanText(input.notes ?? ""),
      },
    })
  } catch {
    throw new WorkflowError("Bu dosya numarası müvekkilde zaten var.")
  }
}

export async function getCaseFileDetail(
  actor: SessionUser,
  caseFileId: string,
): Promise<CaseFileDetailDTO> {
  const { formatDay } = await import("@/lib/format")
  const file = await prisma.caseFile.findUnique({
    where: { id: caseFileId },
    include: {
      client: true,
      tasks: {
        where: { deletedAt: null },
        include: { assignee: true, assigner: true },
        orderBy: { updatedAt: "desc" },
      },
    },
  })
  if (!file || file.deletedAt || file.client.deletedAt) {
    throw new WorkflowError("Dosya bulunamadı.")
  }
  if (!canAccessOfficeClients(actor) && file.client.ownerId !== actor.id) {
    throw new WorkflowError("Bu dosyaya erişemezsiniz.")
  }
  return {
    id: file.id,
    clientId: file.clientId,
    clientName: file.client.name,
    fileNumber: file.fileNumber,
    courtName: file.courtName,
    notes: file.notes,
    taskCount: file.tasks.length,
    updatedAt: file.updatedAt.toISOString(),
    tasks: file.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      assigneeName: task.assignee.name,
      assignerName: task.assigner.name,
      dueLabel: formatDay(task.dueDate.toISOString()),
    })),
  }
}

export async function updateClient(actor: SessionUser, clientId: string, name: string) {
  if (!canCreateTask(actor.role)) {
    throw new WorkflowError("Yalnızca avukat müvekkil düzenleyebilir.")
  }
  const client = await prisma.client.findUnique({ where: { id: clientId } })
  if (!client || client.deletedAt) throw new WorkflowError("Müvekkil bulunamadı.")
  if (!canAccessOfficeClients(actor) && client.ownerId !== actor.id) {
    throw new WorkflowError("Bu müvekkili düzenleyemezsiniz.")
  }
  const cleaned = normalizeName(name)
  const nameKey = partyNameKey(cleaned)
  if (cleaned.length < 2) throw new WorkflowError("Müvekkil adı en az 2 karakter olmalı.")
  try {
    await prisma.client.update({
      where: { id: clientId },
      data: { name: cleaned, nameKey },
    })
  } catch {
    throw new WorkflowError("Bu müvekkil adı zaten kullanılıyor.")
  }
}

export async function updateCaseFile(
  actor: SessionUser,
  caseFileId: string,
  input: { fileNumber: string; courtName?: string; notes?: string },
) {
  if (!canCreateTask(actor.role)) {
    throw new WorkflowError("Yalnızca avukat dosya düzenleyebilir.")
  }
  const file = await prisma.caseFile.findUnique({
    where: { id: caseFileId },
    include: { client: true },
  })
  if (!file || file.deletedAt) throw new WorkflowError("Dosya bulunamadı.")
  if (!canAccessOfficeClients(actor) && file.client.ownerId !== actor.id) {
    throw new WorkflowError("Bu dosyayı düzenleyemezsiniz.")
  }
  const fileNumber = cleanText(input.fileNumber)
  if (fileNumber.length < 2) throw new WorkflowError("Dosya no gerekli.")
  try {
    await prisma.caseFile.update({
      where: { id: caseFileId },
      data: {
        fileNumber,
        courtName: cleanText(input.courtName ?? ""),
        notes: cleanText(input.notes ?? ""),
      },
    })
  } catch {
    throw new WorkflowError("Bu dosya numarası müvekkilde zaten var.")
  }
}

export async function softDeleteClient(actor: SessionUser, clientId: string) {
  if (!canCreateTask(actor.role)) {
    throw new WorkflowError("Yalnızca avukat müvekkil silebilir.")
  }
  const client = await prisma.client.findUnique({ where: { id: clientId } })
  if (!client || client.deletedAt) throw new WorkflowError("Müvekkil bulunamadı.")
  if (!canAccessOfficeClients(actor) && client.ownerId !== actor.id) {
    throw new WorkflowError("Bu müvekkili silemezsiniz.")
  }
  const now = new Date()
  await prisma.$transaction([
    prisma.client.update({ where: { id: clientId }, data: { deletedAt: now } }),
    prisma.caseFile.updateMany({
      where: { clientId, deletedAt: null },
      data: { deletedAt: now },
    }),
  ])
}

export async function softDeleteCaseFile(actor: SessionUser, caseFileId: string) {
  if (!canCreateTask(actor.role)) {
    throw new WorkflowError("Yalnızca avukat dosya silebilir.")
  }
  const file = await prisma.caseFile.findUnique({
    where: { id: caseFileId },
    include: { client: true },
  })
  if (!file || file.deletedAt) throw new WorkflowError("Dosya bulunamadı.")
  if (!canAccessOfficeClients(actor) && file.client.ownerId !== actor.id) {
    throw new WorkflowError("Bu dosyayı silemezsiniz.")
  }
  await prisma.caseFile.update({
    where: { id: caseFileId },
    data: { deletedAt: new Date() },
  })
}

export async function listDeletedItems(actor: SessionUser) {
  if (!canCreateTask(actor.role)) {
    throw new WorkflowError("Silinenlere erişemezsiniz.")
  }
  const ownerFilter = canAccessOfficeClients(actor) ? undefined : actor.id
  const [clients, files, tasks] = await Promise.all([
    prisma.client.findMany({
      where: {
        deletedAt: { not: null },
        ...(ownerFilter ? { ownerId: ownerFilter } : {}),
      },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.caseFile.findMany({
      where: {
        deletedAt: { not: null },
        ...(ownerFilter ? { client: { ownerId: ownerFilter } } : {}),
      },
      include: { client: true },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.task.findMany({
      where: {
        deletedAt: { not: null },
        ...(ownerFilter
          ? { OR: [{ assignerId: ownerFilter }, { assigneeId: ownerFilter }] }
          : {}),
      },
      orderBy: { deletedAt: "desc" },
      take: 100,
    }),
  ])
  return {
    clients: clients.map((row) => ({
      id: row.id,
      name: row.name,
      deletedAt: row.deletedAt!.toISOString(),
    })),
    files: files.map((row) => ({
      id: row.id,
      fileNumber: row.fileNumber,
      clientId: row.clientId,
      clientName: row.client.name,
      deletedAt: row.deletedAt!.toISOString(),
    })),
    tasks: tasks.map((row) => ({
      id: row.id,
      title: row.title,
      clientName: row.clientName,
      fileNumber: row.fileNumber,
      deletedAt: row.deletedAt!.toISOString(),
    })),
  }
}

export async function restoreClient(actor: SessionUser, clientId: string) {
  if (!canCreateTask(actor.role)) throw new WorkflowError("Yetki yok.")
  const client = await prisma.client.findUnique({ where: { id: clientId } })
  if (!client?.deletedAt) throw new WorkflowError("Kayıt bulunamadı.")
  if (!canAccessOfficeClients(actor) && client.ownerId !== actor.id) {
    throw new WorkflowError("Yetki yok.")
  }
  await prisma.client.update({ where: { id: clientId }, data: { deletedAt: null } })
}

export async function restoreCaseFile(actor: SessionUser, caseFileId: string) {
  if (!canCreateTask(actor.role)) throw new WorkflowError("Yetki yok.")
  const file = await prisma.caseFile.findUnique({
    where: { id: caseFileId },
    include: { client: true },
  })
  if (!file?.deletedAt) throw new WorkflowError("Kayıt bulunamadı.")
  if (!canAccessOfficeClients(actor) && file.client.ownerId !== actor.id) {
    throw new WorkflowError("Yetki yok.")
  }
  if (file.client.deletedAt) {
    await prisma.client.update({
      where: { id: file.clientId },
      data: { deletedAt: null },
    })
  }
  await prisma.caseFile.update({ where: { id: caseFileId }, data: { deletedAt: null } })
}

export async function restoreTask(actor: SessionUser, taskId: string) {
  if (!canCreateTask(actor.role) && !isAdmin(actor.role)) {
    throw new WorkflowError("Yetki yok.")
  }
  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task?.deletedAt) throw new WorkflowError("Kayıt bulunamadı.")
  if (
    !isAdmin(actor.role) &&
    task.assignerId !== actor.id &&
    task.assigneeId !== actor.id
  ) {
    throw new WorkflowError("Yetki yok.")
  }
  await prisma.task.update({ where: { id: taskId }, data: { deletedAt: null } })
}

