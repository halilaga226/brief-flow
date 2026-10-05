import type { SessionUser } from "@/lib/dto"
import { prisma } from "@/lib/prisma"
import {
  canAssignTask,
  canManageWorkItems,
  canViewWorkItem,
  cleanText,
  isAdmin,
  STATUS_META,
  WorkflowError,
  type Role,
  type TaskStatus,
} from "@/lib/workflow"
import { ensureWorkItemSchema } from "@/server/ensure-work-item-schema"

export type WorkItemDTO = {
  id: string
  clientName: string
  clientId: string | null
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
  completedAt: string | null
  latestTaskStatus: string | null
  latestTaskStatusLabel: string | null
  latestTaskAssignee: string | null
  createdAt: string
  updatedAt: string
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

export type InternColleagueDTO = {
  id: string
  name: string
  title: string
  workItemCount: number
  openTaskCount: number
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
  const clientName = cleanText(input.clientName)
  const opposingParty = cleanText(input.opposingParty) || "Belirtilmedi"
  const courtFile = cleanText(input.courtFile) || fileNumber

  // Müvekkil isteğe bağlı — bağlanmadan da kişisel iş eklenebilir
  if (clientName.length > 0 && clientName.length < 2) {
    return "Müvekkil adı en az 2 karakter olmalı."
  }
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

async function resolveClientId(
  actor: SessionUser,
  clientIdRaw: string | null | undefined,
  clientName: string,
) {
  const clientId = cleanText(clientIdRaw ?? "")
  if (!clientId) return null
  const client = await prisma.client.findFirst({
    where: { id: clientId, deletedAt: null },
    select: { id: true, name: true },
  })
  if (!client) throw new WorkflowError("Müvekkil bulunamadı.")
  if (client.name.localeCompare(clientName, "tr", { sensitivity: "accent" }) !== 0) {
    // Ad eşleşmezse seçilen kaydı esas al
  }
  void actor
  return client.id
}

function workItemWhere(
  actor: SessionUser,
  scope: "all" | "own" | "intern" = "all",
  ownerId?: string | null,
) {
  if (ownerId) {
    if (isAdmin(actor.role)) return { ownerId }
    if (actor.role === "LAWYER") {
      // Avukat yalnızca kendi listesini veya stajyer listesini seçebilir
      if (ownerId === actor.id) return { ownerId }
      return { ownerId, owner: { role: "INTERN" as const } }
    }
    if (ownerId !== actor.id) {
      throw new WorkflowError("Başkasının iş listesine erişemezsiniz.")
    }
    return { ownerId: actor.id }
  }

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
  if (
    canViewWorkItem(
      {
        ownerId: row.ownerId,
        ownerRole: (row.owner?.role as Role | undefined) ?? undefined,
      },
      actor.id,
      actor.role,
    )
  ) {
    return
  }
  throw new WorkflowError("Bu iş kaydına erişemezsiniz.")
}

function mapWorkItemRow(row: {
  id: string
  clientName: string
  clientId: string | null
  opposingParty: string
  courtName: string
  fileNumber: string
  courtFile: string
  workToDo: string
  notes: string
  ownerId: string
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
  owner: { name: string; role: string }
  _count: { tasks: number; entries: number }
  tasks?: { status: string; assignee: { name: string }; updatedAt: Date }[]
}): WorkItemDTO {
  const latest = row.tasks?.[0]
  const status = (latest?.status as TaskStatus | undefined) ?? null
  return {
    id: row.id,
    clientName: row.clientName,
    clientId: row.clientId,
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
    completedAt: row.completedAt?.toISOString() ?? null,
    latestTaskStatus: status,
    latestTaskStatusLabel: status ? STATUS_META[status].label : null,
    latestTaskAssignee: latest?.assignee.name ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

/** Avukat/yönetici için stajyer listesi (kişisel iş listelerini görüntüleme). */
export async function listInternsForWorkView(
  actor: SessionUser,
): Promise<InternColleagueDTO[]> {
  await ensureWorkItemSchema()
  if (!(canAssignTask(actor.role) || isAdmin(actor.role))) {
    throw new WorkflowError("Stajyer listelerine erişemezsiniz.")
  }
  const interns = await prisma.user.findMany({
    where: { role: "INTERN" },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { workItems: true } },
      assignedTasks: {
        where: { deletedAt: null, status: { not: "TAMAMLANDI" } },
        select: { id: true },
      },
    },
  })
  return interns.map((user) => ({
    id: user.id,
    name: user.name,
    title: user.title,
    workItemCount: user._count.workItems,
    openTaskCount: user.assignedTasks.length,
  }))
}

export async function listWorkItems(
  actor: SessionUser,
  scope: "all" | "own" | "intern" = "all",
  ownerId?: string | null,
): Promise<WorkItemDTO[]> {
  await ensureWorkItemSchema()
  if (!canManageWorkItems(actor.role)) {
    throw new WorkflowError("İş listesine erişemezsiniz.")
  }
  if (scope === "intern" && actor.role === "INTERN") {
    throw new WorkflowError("Bu görünüme erişemezsiniz.")
  }
  const where = workItemWhere(actor, scope, ownerId)
  const rows = await prisma.workItem.findMany({
    where,
    orderBy: [{ completedAt: "asc" }, { updatedAt: "desc" }],
    include: {
      owner: { select: { name: true, role: true } },
      _count: { select: { tasks: true, entries: true } },
      tasks: {
        where: { deletedAt: null },
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: {
          status: true,
          updatedAt: true,
          assignee: { select: { name: true } },
        },
      },
    },
  })
  return rows.map(mapWorkItemRow)
}

export async function getWorkItem(actor: SessionUser, id: string) {
  await ensureWorkItemSchema()
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
  await ensureWorkItemSchema()
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
        where: { deletedAt: null },
        include: { assignee: true },
        orderBy: { updatedAt: "desc" },
      },
    },
  })
  if (!row) throw new WorkflowError("İş kaydı bulunamadı.")
  assertWorkItemAccess(actor, row)

  const { formatDay } = await import("@/lib/format")
  const base = mapWorkItemRow({
    ...row,
    tasks: row.tasks.map((task) => ({
      status: task.status,
      updatedAt: task.updatedAt,
      assignee: { name: task.assignee.name },
    })),
  })

  return {
    ...base,
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
    clientId?: string | null
    opposingParty: string
    courtName: string
    fileNumber: string
    courtFile: string
    workToDo: string
    notes: string
  },
) {
  await ensureWorkItemSchema()
  if (!canManageWorkItems(actor.role)) {
    throw new WorkflowError("İş listesine kayıt ekleyemezsiniz.")
  }
  const checked = validateWorkItem(input)
  if (typeof checked === "string") throw new WorkflowError(checked)
  let clientId = await resolveClientId(actor, input.clientId, checked.clientName)
  if (!clientId && checked.clientName) {
    // Serbest metin: mümkünse mevcut müvekkile bağla
    const match = await prisma.client.findFirst({
      where: {
        deletedAt: null,
        name: { equals: checked.clientName, mode: "insensitive" },
      },
      select: { id: true },
    })
    clientId = match?.id ?? null
  }
  const created = await prisma.workItem.create({
    data: {
      ...checked,
      clientId,
      ownerId: actor.id,
    },
  })
  return created.id
}

export async function updateWorkItem(
  actor: SessionUser,
  id: string,
  input: {
    clientName: string
    clientId?: string | null
    opposingParty: string
    courtName: string
    fileNumber: string
    courtFile: string
    workToDo: string
    notes: string
  },
) {
  const row = await getWorkItem(actor, id)
  if (!isAdmin(actor.role) && row.ownerId !== actor.id) {
    throw new WorkflowError("Yalnızca kendi iş kaydınızı düzenleyebilirsiniz.")
  }
  const checked = validateWorkItem(input)
  if (typeof checked === "string") throw new WorkflowError(checked)
  const clientId = await resolveClientId(actor, input.clientId, checked.clientName)
  await prisma.workItem.update({
    where: { id: row.id },
    data: {
      ...checked,
      clientId,
    },
  })
}

export async function completeWorkItem(actor: SessionUser, id: string) {
  const row = await getWorkItem(actor, id)
  if (!isAdmin(actor.role) && row.ownerId !== actor.id) {
    throw new WorkflowError("Yalnızca kendi işinizi tamamlayabilirsiniz.")
  }
  if (row.completedAt) throw new WorkflowError("Bu iş zaten tamamlanmış.")
  await prisma.workItem.update({
    where: { id: row.id },
    data: { completedAt: new Date() },
  })
}

export async function reopenWorkItem(actor: SessionUser, id: string) {
  const row = await getWorkItem(actor, id)
  if (!isAdmin(actor.role) && row.ownerId !== actor.id) {
    throw new WorkflowError("Yalnızca kendi işinizi yeniden açabilirsiniz.")
  }
  if (!row.completedAt) throw new WorkflowError("Bu iş zaten açık.")
  await prisma.workItem.update({
    where: { id: row.id },
    data: { completedAt: null },
  })
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
  // Stajyer listesini gören avukat not ekleyebilir; asıl sahiplik değişmez
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
