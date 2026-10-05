import type { SessionUser } from "@/lib/dto"
import { prisma } from "@/lib/prisma"
import { isAdmin, WorkflowError } from "@/lib/workflow"

export const OFFICE_BACKUP_KIND = "office_backup"
const KEEP_BACKUPS = 14

export type OfficeBackupPayload = {
  version: 1
  createdAt: string
  users: {
    id: string
    name: string
    username: string
    email: string | null
    passwordHash: string
    passwordUpdatedAt: string
    role: "LAWYER" | "INTERN" | "ADMIN"
    title: string
    driveFolderId: string | null
    driveFolderLink: string | null
    createdAt: string
  }[]
  clients: Awaited<ReturnType<typeof prisma.client.findMany>>
  caseFiles: Awaited<ReturnType<typeof prisma.caseFile.findMany>>
  clientNotes: Awaited<ReturnType<typeof prisma.clientNote.findMany>>
  workItems: Awaited<ReturnType<typeof prisma.workItem.findMany>>
  workItemEntries: Awaited<ReturnType<typeof prisma.workItemEntry.findMany>>
  tasks: Awaited<ReturnType<typeof prisma.task.findMany>>
  taskComments: Awaited<ReturnType<typeof prisma.taskComment.findMany>>
  taskLogs: Awaited<ReturnType<typeof prisma.taskLog.findMany>>
  taskFiles: Awaited<ReturnType<typeof prisma.taskFile.findMany>>
  notifications: Awaited<ReturnType<typeof prisma.notification.findMany>>
  importFingerprints: Awaited<ReturnType<typeof prisma.importFingerprint.findMany>>
}

function assertAdmin(actor: SessionUser) {
  if (!isAdmin(actor.role)) throw new WorkflowError("Yedekleme yalnızca yönetici içindir.")
}

function serializeDates<T>(rows: T[]): T[] {
  return JSON.parse(JSON.stringify(rows)) as T[]
}

export async function buildOfficeBackupPayload(): Promise<OfficeBackupPayload> {
  const [
    users,
    clients,
    caseFiles,
    clientNotes,
    workItems,
    workItemEntries,
    tasks,
    taskComments,
    taskLogs,
    taskFiles,
    notifications,
    importFingerprints,
  ] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        passwordHash: true,
        passwordUpdatedAt: true,
        role: true,
        title: true,
        driveFolderId: true,
        driveFolderLink: true,
        createdAt: true,
      },
    }),
    prisma.client.findMany(),
    prisma.caseFile.findMany(),
    prisma.clientNote.findMany(),
    prisma.workItem.findMany(),
    prisma.workItemEntry.findMany(),
    prisma.task.findMany(),
    prisma.taskComment.findMany(),
    prisma.taskLog.findMany(),
    prisma.taskFile.findMany(),
    prisma.notification.findMany(),
    prisma.importFingerprint.findMany(),
  ])

  return {
    version: 1,
    createdAt: new Date().toISOString(),
    users: serializeDates(users) as unknown as OfficeBackupPayload["users"],
    clients: serializeDates(clients) as unknown as OfficeBackupPayload["clients"],
    caseFiles: serializeDates(caseFiles) as unknown as OfficeBackupPayload["caseFiles"],
    clientNotes: serializeDates(clientNotes) as unknown as OfficeBackupPayload["clientNotes"],
    workItems: serializeDates(workItems) as unknown as OfficeBackupPayload["workItems"],
    workItemEntries: serializeDates(workItemEntries) as unknown as OfficeBackupPayload["workItemEntries"],
    tasks: serializeDates(tasks) as unknown as OfficeBackupPayload["tasks"],
    taskComments: serializeDates(taskComments) as unknown as OfficeBackupPayload["taskComments"],
    taskLogs: serializeDates(taskLogs) as unknown as OfficeBackupPayload["taskLogs"],
    taskFiles: serializeDates(taskFiles) as unknown as OfficeBackupPayload["taskFiles"],
    notifications: serializeDates(notifications) as unknown as OfficeBackupPayload["notifications"],
    importFingerprints: serializeDates(importFingerprints) as unknown as OfficeBackupPayload["importFingerprints"],
  }
}

async function pruneOldBackups() {
  const rows = await prisma.dataSnapshot.findMany({
    where: { kind: OFFICE_BACKUP_KIND },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  })
  const drop = rows.slice(KEEP_BACKUPS).map((row) => row.id)
  if (drop.length) {
    await prisma.dataSnapshot.deleteMany({ where: { id: { in: drop } } })
  }
}

export async function createOfficeBackup(
  actor: SessionUser | { id: string; role: "ADMIN" },
  label?: string,
) {
  if (actor.role !== "ADMIN") throw new WorkflowError("Yedekleme yalnızca yönetici içindir.")
  const payload = await buildOfficeBackupPayload()
  const counts = {
    users: payload.users.length,
    clients: payload.clients.length,
    files: payload.caseFiles.length,
    tasks: payload.tasks.length,
  }
  const snap = await prisma.dataSnapshot.create({
    data: {
      kind: OFFICE_BACKUP_KIND,
      label:
        label ??
        `Büro yedeği · ${counts.clients} müvekkil · ${counts.tasks} iş · ${new Date().toLocaleString("tr-TR")}`,
      createdBy: actor.id,
      payload: JSON.stringify(payload),
    },
  })
  await pruneOldBackups()
  return { snapshotId: snap.id, counts, createdAt: payload.createdAt, payload }
}

export async function getOfficeBackupPayload(actor: SessionUser, snapshotId: string) {
  assertAdmin(actor)
  const snap = await prisma.dataSnapshot.findUnique({ where: { id: snapshotId } })
  if (!snap || snap.kind !== OFFICE_BACKUP_KIND) {
    throw new WorkflowError("Büro yedeği bulunamadı.")
  }
  return {
    id: snap.id,
    label: snap.label,
    createdAt: snap.createdAt.toISOString(),
    payload: snap.payload,
  }
}

function asDate(value: string | Date | null | undefined) {
  if (!value) return null
  return value instanceof Date ? value : new Date(value)
}

export async function restoreOfficeBackup(
  actor: SessionUser,
  raw: string | OfficeBackupPayload,
) {
  assertAdmin(actor)
  let payload: OfficeBackupPayload
  try {
    payload = typeof raw === "string" ? (JSON.parse(raw) as OfficeBackupPayload) : raw
  } catch {
    throw new WorkflowError("Yedek dosyası okunamadı.")
  }
  if (!payload || payload.version !== 1 || !Array.isArray(payload.tasks)) {
    throw new WorkflowError("Geçersiz yedek formatı.")
  }

  // Önce kullanıcılar (FK), sonra müvekkil/dosya, iş listesi, görevler, ilişkiler
  await prisma.$transaction(
    async (tx) => {
      for (const user of payload.users ?? []) {
        await tx.user.upsert({
          where: { id: user.id },
          create: {
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            passwordHash: user.passwordHash,
            passwordUpdatedAt: asDate(user.passwordUpdatedAt) ?? new Date(),
            role: user.role,
            title: user.title,
            driveFolderId: user.driveFolderId,
            driveFolderLink: user.driveFolderLink,
            createdAt: asDate(user.createdAt) ?? new Date(),
          },
          update: {
            name: user.name,
            username: user.username,
            email: user.email,
            passwordHash: user.passwordHash,
            passwordUpdatedAt: asDate(user.passwordUpdatedAt) ?? undefined,
            role: user.role,
            title: user.title,
            driveFolderId: user.driveFolderId,
            driveFolderLink: user.driveFolderLink,
          },
        })
      }

      for (const row of payload.clients ?? []) {
        await tx.client.upsert({
          where: { id: row.id },
          create: {
            id: row.id,
            name: row.name,
            nameKey: row.nameKey ?? "",
            ownerId: row.ownerId,
            deletedAt: asDate(row.deletedAt),
            createdAt: asDate(row.createdAt) ?? new Date(),
            updatedAt: asDate(row.updatedAt) ?? new Date(),
          },
          update: {
            name: row.name,
            nameKey: row.nameKey ?? "",
            ownerId: row.ownerId,
            deletedAt: asDate(row.deletedAt),
          },
        })
      }

      for (const row of payload.caseFiles ?? []) {
        await tx.caseFile.upsert({
          where: { id: row.id },
          create: {
            id: row.id,
            clientId: row.clientId,
            fileNumber: row.fileNumber,
            courtName: row.courtName ?? "",
            notes: row.notes ?? "",
            deletedAt: asDate(row.deletedAt),
            createdAt: asDate(row.createdAt) ?? new Date(),
            updatedAt: asDate(row.updatedAt) ?? new Date(),
          },
          update: {
            clientId: row.clientId,
            fileNumber: row.fileNumber,
            courtName: row.courtName ?? "",
            notes: row.notes ?? "",
            deletedAt: asDate(row.deletedAt),
          },
        })
      }

      for (const row of payload.clientNotes ?? []) {
        await tx.clientNote.upsert({
          where: { id: row.id },
          create: {
            id: row.id,
            clientId: row.clientId,
            authorId: row.authorId,
            body: row.body,
            createdAt: asDate(row.createdAt) ?? new Date(),
            updatedAt: asDate(row.updatedAt) ?? new Date(),
          },
          update: { body: row.body, authorId: row.authorId, clientId: row.clientId },
        })
      }

      for (const row of payload.workItems ?? []) {
        await tx.workItem.upsert({
          where: { id: row.id },
          create: {
            id: row.id,
            clientName: row.clientName,
            clientId: row.clientId ?? null,
            opposingParty: row.opposingParty,
            courtName: row.courtName,
            fileNumber: row.fileNumber,
            courtFile: row.courtFile,
            workToDo: row.workToDo,
            notes: row.notes ?? "",
            ownerId: row.ownerId,
            completedAt: asDate(row.completedAt),
            createdAt: asDate(row.createdAt) ?? new Date(),
            updatedAt: asDate(row.updatedAt) ?? new Date(),
          },
          update: {
            clientName: row.clientName,
            clientId: row.clientId ?? null,
            opposingParty: row.opposingParty,
            courtName: row.courtName,
            fileNumber: row.fileNumber,
            courtFile: row.courtFile,
            workToDo: row.workToDo,
            notes: row.notes ?? "",
            ownerId: row.ownerId,
            completedAt: asDate(row.completedAt),
          },
        })
      }

      for (const row of payload.workItemEntries ?? []) {
        await tx.workItemEntry.upsert({
          where: { id: row.id },
          create: {
            id: row.id,
            workItemId: row.workItemId,
            content: row.content,
            createdById: row.createdById,
            createdAt: asDate(row.createdAt) ?? new Date(),
          },
          update: {
            content: row.content,
            workItemId: row.workItemId,
            createdById: row.createdById,
          },
        })
      }

      for (const row of payload.tasks ?? []) {
        await tx.task.upsert({
          where: { id: row.id },
          create: {
            id: row.id,
            title: row.title,
            clientName: row.clientName,
            fileNumber: row.fileNumber,
            description: row.description,
            dueDate: asDate(row.dueDate) ?? new Date(),
            status: row.status,
            assignerId: row.assignerId,
            assigneeId: row.assigneeId,
            workItemId: row.workItemId,
            caseFileId: row.caseFileId,
            trackingCode: row.trackingCode,
            listColor: row.listColor,
            acceptedAt: asDate(row.acceptedAt),
            completedAt: asDate(row.completedAt),
            deletedAt: asDate(row.deletedAt),
            expensePaid: row.expensePaid ?? false,
            expensePaidAt: asDate(row.expensePaidAt),
            clientCallStatus: row.clientCallStatus ?? "YOK",
            createdAt: asDate(row.createdAt) ?? new Date(),
            updatedAt: asDate(row.updatedAt) ?? new Date(),
          },
          update: {
            title: row.title,
            clientName: row.clientName,
            fileNumber: row.fileNumber,
            description: row.description,
            dueDate: asDate(row.dueDate) ?? undefined,
            status: row.status,
            assignerId: row.assignerId,
            assigneeId: row.assigneeId,
            workItemId: row.workItemId,
            caseFileId: row.caseFileId,
            trackingCode: row.trackingCode,
            listColor: row.listColor,
            acceptedAt: asDate(row.acceptedAt),
            completedAt: asDate(row.completedAt),
            deletedAt: asDate(row.deletedAt),
            expensePaid: row.expensePaid ?? false,
            expensePaidAt: asDate(row.expensePaidAt),
            clientCallStatus: row.clientCallStatus ?? "YOK",
          },
        })
      }

      for (const row of payload.taskComments ?? []) {
        await tx.taskComment.upsert({
          where: { id: row.id },
          create: {
            id: row.id,
            taskId: row.taskId,
            authorId: row.authorId,
            body: row.body,
            createdAt: asDate(row.createdAt) ?? new Date(),
          },
          update: { body: row.body, taskId: row.taskId, authorId: row.authorId },
        })
      }

      for (const row of payload.taskLogs ?? []) {
        await tx.taskLog.upsert({
          where: { id: row.id },
          create: {
            id: row.id,
            taskId: row.taskId,
            actorId: row.actorId,
            type: row.type,
            fromStatus: row.fromStatus,
            toStatus: row.toStatus,
            note: row.note,
            meta: row.meta,
            createdAt: asDate(row.createdAt) ?? new Date(),
          },
          update: {
            type: row.type,
            fromStatus: row.fromStatus,
            toStatus: row.toStatus,
            note: row.note,
            meta: row.meta,
          },
        })
      }

      for (const row of payload.taskFiles ?? []) {
        await tx.taskFile.upsert({
          where: { id: row.id },
          create: {
            id: row.id,
            taskId: row.taskId,
            kind: row.kind,
            driveFileId: row.driveFileId,
            name: row.name,
            mimeType: row.mimeType,
            size: row.size,
            webViewLink: row.webViewLink,
            storageMode: row.storageMode,
            uploadedById: row.uploadedById,
            createdAt: asDate(row.createdAt) ?? new Date(),
          },
          update: {
            name: row.name,
            mimeType: row.mimeType,
            size: row.size,
            webViewLink: row.webViewLink,
            storageMode: row.storageMode,
          },
        })
      }

      for (const row of payload.notifications ?? []) {
        await tx.notification.upsert({
          where: { id: row.id },
          create: {
            id: row.id,
            userId: row.userId,
            taskId: row.taskId,
            title: row.title,
            body: row.body,
            read: row.read ?? false,
            createdAt: asDate(row.createdAt) ?? new Date(),
          },
          update: {
            title: row.title,
            body: row.body,
            read: row.read ?? false,
          },
        })
      }

      for (const row of payload.importFingerprints ?? []) {
        await tx.importFingerprint.upsert({
          where: { id: row.id },
          create: {
            id: row.id,
            kind: row.kind,
            externalKey: row.externalKey,
            contentHash: row.contentHash,
            clientId: row.clientId,
            meta: row.meta ?? "",
            createdAt: asDate(row.createdAt) ?? new Date(),
            updatedAt: asDate(row.updatedAt) ?? new Date(),
          },
          update: {
            contentHash: row.contentHash,
            clientId: row.clientId,
            meta: row.meta ?? "",
          },
        })
      }
    },
    { timeout: 120_000 },
  )

  return {
    users: payload.users?.length ?? 0,
    clients: payload.clients?.length ?? 0,
    files: payload.caseFiles?.length ?? 0,
    tasks: payload.tasks?.length ?? 0,
    notes: payload.clientNotes?.length ?? 0,
  }
}

export async function restoreOfficeBackupById(actor: SessionUser, snapshotId: string) {
  assertAdmin(actor)
  const snap = await prisma.dataSnapshot.findUnique({ where: { id: snapshotId } })
  if (!snap || snap.kind !== OFFICE_BACKUP_KIND) {
    throw new WorkflowError("Büro yedeği bulunamadı.")
  }
  const result = await restoreOfficeBackup(actor, snap.payload)
  await prisma.dataSnapshot.update({
    where: { id: snapshotId },
    data: { restoredAt: new Date() },
  })
  return result
}
