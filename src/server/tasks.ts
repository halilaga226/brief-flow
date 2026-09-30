import type { SessionUser } from "@/lib/dto"
import { deleteDriveFile, uploadToDrive, type StoredFile } from "@/lib/drive"
import { prisma } from "@/lib/prisma"
import {
  WorkflowError,
  canAcceptTask,
  canComment,
  canComplete,
  canCreateTask,
  canDeleteTask,
  canManageOps,
  canQueueSend,
  canReview,
  canUploadDraft,
  canViewTask,
  cleanText,
  isAdmin,
  isParticipant,
  safeFileName,
  showsOnHome,
  validateComment,
  validateDraftFile,
  validateNote,
  validateTaskDraft,
  validateTrackingCode,
  type ClientCallStatus,
} from "@/lib/workflow"
import {
  sameMonth,
  taskCardInclude,
  taskDetailInclude,
  toActivity,
  toNotification,
  toTaskCard,
  toTaskDetail,
} from "@/server/present"

async function visibleTask(taskId: string, actor: SessionUser) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { assignee: { select: { role: true } } },
  })
  if (
    !task ||
    !canViewTask(
      {
        assignerId: task.assignerId,
        assigneeId: task.assigneeId,
        assigneeRole: task.assignee.role,
      },
      actor.id,
      actor.role,
    )
  ) {
    return null
  }
  return task
}

function otherParty(task: { assignerId: string; assigneeId: string }, userId: string) {
  return userId === task.assignerId ? task.assigneeId : task.assignerId
}

export async function listTasks(userId: string, role: SessionUser["role"]) {
  const tasks = await prisma.task.findMany({
    where: isAdmin(role)
      ? undefined
      : role === "LAWYER"
        ? {
            OR: [
              { assignerId: userId },
              { assigneeId: userId },
              { assignee: { role: "INTERN" } },
            ],
          }
        : { OR: [{ assignerId: userId }, { assigneeId: userId }] },
    include: taskCardInclude,
    orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
  })
  return tasks
    .map((task) => toTaskCard(task, userId, role))
    .filter((task) => {
      // Tamamlanan iş stajyer ekranından düşer; avukat/admin silene kadar görür.
      if (task.status === "TAMAMLANDI" && role === "INTERN") return false
      return true
    })
    .sort((a, b) => {
      const aDone = a.status === "TAMAMLANDI" ? 1 : 0
      const bDone = b.status === "TAMAMLANDI" ? 1 : 0
      if (aDone !== bDone) return aDone - bDone
      return a.dueDate.localeCompare(b.dueDate)
    })
}

export async function getTask(userId: string, role: SessionUser["role"], taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: taskDetailInclude,
  })
  if (
    !task ||
    !canViewTask(
      { assignerId: task.assignerId, assigneeId: task.assigneeId, assigneeRole: task.assignee.role },
      userId,
      role,
    )
  ) {
    return null
  }
  if (task.status === "TAMAMLANDI" && role === "INTERN") return null
  return toTaskDetail(task, userId, role)
}

export async function listNotifications(userId: string) {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 15,
  })
  return rows.map(toNotification)
}

export async function recentActivity(userId: string, role: SessionUser["role"]) {
  const rows = await prisma.taskLog.findMany({
    where: isAdmin(role)
      ? undefined
      : {
          task: { OR: [{ assignerId: userId }, { assigneeId: userId }] },
        },
    include: { actor: true, task: true },
    orderBy: { createdAt: "desc" },
    take: 8,
  })
  return rows.map(toActivity)
}

export async function getDashboard(userId: string, role: SessionUser["role"]) {
  const [tasks, activity] = await Promise.all([
    listTasks(userId, role),
    recentActivity(userId, role),
  ])
  const awaiting = tasks
    .filter((task) =>
      showsOnHome(
        {
          assigneeId: task.assigneeId,
          assignerId: task.assignerId,
          acceptedAt: task.acceptedAt,
          status: task.status,
          dueTone: task.dueTone,
          needsAction: task.needsAction,
        },
        userId,
        role,
      ),
    )
    .sort((a, b) => {
      // Kabul bekleyenler önce, sonra son güne göre
      if (a.needsAccept !== b.needsAccept) return a.needsAccept ? -1 : 1
      return a.dueDate.localeCompare(b.dueDate)
    })
  return {
    tasks,
    awaiting,
    activity,
    counts: {
      awaiting: awaiting.length,
      assigned: tasks.filter((task) => task.status === "ATANDI" || task.status === "REVIZE_ISTENDI")
        .length,
      inReview: tasks.filter((task) => task.status === "INCELEME_BEKLIYOR").length,
      toSend: tasks.filter(
        (task) => task.status === "ONAYLANDI" || task.status === "GONDERIM_BEKLIYOR",
      ).length,
      dueSoon: tasks.filter((task) => task.dueTone === "today" || task.dueTone === "soon").length,
      overdue: tasks.filter((task) => task.dueTone === "overdue").length,
      completedThisMonth: tasks.filter(
        (task) => task.status === "TAMAMLANDI" && sameMonth(task.completedAt),
      ).length,
      completed: tasks.filter((task) => task.status === "TAMAMLANDI").length,
      active: tasks.filter((task) => task.status !== "TAMAMLANDI").length,
    },
  }
}

export async function listAssignees(actor: SessionUser) {
  if (!canCreateTask(actor.role)) {
    throw new WorkflowError("Yalnızca avukat veya yönetici görev atayabilir.")
  }
  const users = await prisma.user.findMany({
    where: { id: { not: actor.id } },
    orderBy: { name: "asc" },
  })
  const rank = (role: string) => (role === "ADMIN" ? 0 : role === "LAWYER" ? 1 : 2)
  return users
    .map((user) => ({
      id: user.id,
      name: user.name,
      title: user.title,
      role: user.role,
      email: user.email ?? "",
    }))
    .sort((a, b) => {
      const diff = rank(a.role) - rank(b.role)
      if (diff !== 0) return diff
      return a.name.localeCompare(b.name, "tr")
    })
}

async function storeUpload(file: File, actorId?: string) {
  const check = validateDraftFile({ name: file.name, size: file.size })
  if (!check.ok) throw new WorkflowError(check.error)
  let folderId: string | null = null
  if (actorId) {
    const user = await prisma.user.findUnique({
      where: { id: actorId },
      select: { driveFolderId: true },
    })
    folderId = user?.driveFolderId ?? null
  }
  return uploadToDrive({
    buffer: Buffer.from(await file.arrayBuffer()),
    name: safeFileName(file.name),
    mimeType: file.type || "application/octet-stream",
    folderId,
  })
}

export async function createTask(
  actor: SessionUser,
  input: {
    title: string
    clientName: string
    fileNumber: string
    description: string
    dueDate: Date | null
    assigneeId: string
    workItemId?: string | null
  },
  file?: File | null,
) {
  if (!canCreateTask(actor.role)) {
    throw new WorkflowError("Yalnızca avukat veya yönetici görev atayabilir.")
  }
  const problem = validateTaskDraft(input)
  if (problem) throw new WorkflowError(problem)
  if (input.assigneeId === actor.id) {
    throw new WorkflowError("Görevi kendinize atayamazsınız.")
  }
  const assignee = await prisma.user.findUnique({ where: { id: input.assigneeId } })
  if (!assignee) throw new WorkflowError("Atanacak kişi bulunamadı.")
  // Kabul yok — iş doğrudan atananın listesine düşer.
  const acceptedAt = new Date()

  const { resolveClientAndCaseFile } = await import("@/server/clients")
  const resolved = await resolveClientAndCaseFile(
    actor.id,
    input.clientName,
    input.fileNumber,
  )

  let workItemId: string | null = null
  if (input.workItemId) {
    const workItem = await prisma.workItem.findUnique({ where: { id: input.workItemId } })
    if (!workItem) throw new WorkflowError("İş listesi kaydı bulunamadı.")
    if (!isAdmin(actor.role) && workItem.ownerId !== actor.id) {
      throw new WorkflowError("Bu iş kaydından görev atayamazsınız.")
    }
    workItemId = workItem.id
  }

  let stored: StoredFile | null = null
  if (file && file.size > 0) {
    stored = await storeUpload(file, actor.id)
  }

  try {
    const task = await prisma.task.create({
      data: {
        title: cleanText(input.title),
        clientName: resolved.clientName,
        fileNumber: resolved.fileNumber,
        description: cleanText(input.description),
        dueDate: input.dueDate!,
        status: "ATANDI",
        assignerId: actor.id,
        assigneeId: assignee.id,
        workItemId,
        caseFileId: resolved.caseFileId,
        acceptedAt,
        files: stored
          ? {
              create: {
                kind: "INSTRUCTION",
                driveFileId: stored.driveFileId,
                name: stored.name,
                mimeType: stored.mimeType,
                size: stored.size,
                webViewLink: stored.webViewLink,
                storageMode: stored.storageMode,
                uploadedById: actor.id,
              },
            }
          : undefined,
        logs: {
          create: {
            actorId: actor.id,
            type: "CREATED",
            toStatus: "ATANDI",
            note: null,
            meta: stored ? JSON.stringify({ fileName: stored.name }) : undefined,
          },
        },
        notifications: {
          create: {
            userId: assignee.id,
            title: "Yeni iş atandı",
            body: `${actor.name} size bir iş atadı: ${cleanText(input.title)}`,
          },
        },
      },
    })
    return task.id
  } catch (error) {
    if (stored) await deleteDriveFile(stored)
    throw error
  }
}

export async function uploadDraft(actor: SessionUser, taskId: string, file: File) {
  const existing = await visibleTask(taskId, actor)
  if (!existing) throw new WorkflowError("Görev bulunamadı.")
  if (!canUploadDraft(existing, actor.id, actor.role)) {
    throw new WorkflowError("Bu aşamada taslak yüklenemez.")
  }
  const stored = await storeUpload(file)
  try {
    await prisma.$transaction(async (tx) => {
      const task = await tx.task.findUnique({ where: { id: taskId } })
      if (!task || !canUploadDraft(task, actor.id, actor.role)) {
        throw new WorkflowError("Görevin durumu değişmiş. Sayfayı yenileyin.")
      }
      await tx.taskFile.create({
        data: {
          taskId,
          kind: "DRAFT",
          driveFileId: stored.driveFileId,
          name: stored.name,
          mimeType: stored.mimeType,
          size: stored.size,
          webViewLink: stored.webViewLink,
          storageMode: stored.storageMode,
          uploadedById: actor.id,
        },
      })
      await tx.task.update({
        where: { id: taskId },
        data: { status: "INCELEME_BEKLIYOR" },
      })
      await tx.taskLog.create({
        data: {
          taskId,
          actorId: actor.id,
          type: "DRAFT_UPLOADED",
          fromStatus: task.status,
          toStatus: "INCELEME_BEKLIYOR",
          meta: JSON.stringify({ fileName: stored.name }),
        },
      })
      await tx.notification.create({
        data: {
          userId: task.assignerId,
          taskId,
          title: "Taslak incelemenizi bekliyor",
          body: `${actor.name} taslak yükledi: ${task.title}`,
        },
      })
    })
  } catch (error) {
    await deleteDriveFile(stored)
    throw error
  }
}

/** Stajyer/avukat işi bitirince not yazıp atayan avukata gönderir; kendi listesinden düşer. */
export async function sendToLawyer(actor: SessionUser, taskId: string, rawNote: string) {
  const noteResult = validateNote(rawNote, "Yapılanlar notu")
  if (!noteResult.ok) throw new WorkflowError(noteResult.error)

  const existing = await visibleTask(taskId, actor)
  if (!existing) throw new WorkflowError("Görev bulunamadı.")
  if (!canUploadDraft(existing, actor.id, actor.role)) {
    throw new WorkflowError("Bu aşamada avukata gönderilemez.")
  }

  await prisma.$transaction(async (tx) => {
    const task = await tx.task.findUnique({ where: { id: taskId } })
    if (!task || !canUploadDraft(task, actor.id, actor.role)) {
      throw new WorkflowError("Görevin durumu değişmiş. Sayfayı yenileyin.")
    }
    await tx.task.update({
      where: { id: taskId },
      data: { status: "INCELEME_BEKLIYOR" },
    })
    await tx.taskLog.create({
      data: {
        taskId,
        actorId: actor.id,
        type: "SENT_TO_LAWYER",
        fromStatus: task.status,
        toStatus: "INCELEME_BEKLIYOR",
        note: noteResult.note,
      },
    })
    await tx.notification.create({
      data: {
        userId: task.assignerId,
        taskId,
        title: "İş incelemenizi bekliyor",
        body: `${actor.name} işi size gönderdi: ${task.title}`,
      },
    })
  })
}

/** @deprecated — sendToLawyer kullanın */
export async function markDraftSent(actor: SessionUser, taskId: string) {
  return sendToLawyer(actor, taskId, "WhatsApp / dış kanal ile iletildi.")
}

export async function requestRevision(actor: SessionUser, taskId: string, rawNote: string) {
  const noteResult = validateNote(rawNote, "Revizyon notu")
  if (!noteResult.ok) throw new WorkflowError(noteResult.error)
  const existing = await visibleTask(taskId, actor)
  if (!existing) throw new WorkflowError("Görev bulunamadı.")
  if (!canReview(existing, actor.id, actor.role)) {
    throw new WorkflowError("Bu taslağı revizeye gönderme yetkiniz yok.")
  }

  await prisma.$transaction(async (tx) => {
    const task = await tx.task.findUnique({ where: { id: taskId } })
    if (!task || !canReview(task, actor.id, actor.role)) {
      throw new WorkflowError("Görevin durumu değişmiş. Sayfayı yenileyin.")
    }
    await tx.task.update({
      where: { id: taskId },
      data: { status: "REVIZE_ISTENDI" },
    })
    await tx.taskLog.create({
      data: {
        taskId,
        actorId: actor.id,
        type: "REVISION_REQUESTED",
        fromStatus: task.status,
        toStatus: "REVIZE_ISTENDI",
        note: noteResult.note,
      },
    })
    await tx.notification.create({
      data: {
        userId: task.assigneeId,
        taskId,
        title: "Revizyon istendi",
        body: `${actor.name} düzeltme istedi: ${task.title}`,
      },
    })
  })
}

export async function approveTask(actor: SessionUser, taskId: string, rawNote: string) {
  const note = cleanText(rawNote)
  if (note.length > 2000) throw new WorkflowError("Onay notu 2000 karakteri aşamaz.")
  const existing = await visibleTask(taskId, actor)
  if (!existing) throw new WorkflowError("Görev bulunamadı.")
  if (!canReview(existing, actor.id, actor.role)) {
    throw new WorkflowError("Bu taslağı onaylama yetkiniz yok.")
  }

  await prisma.$transaction(async (tx) => {
    const task = await tx.task.findUnique({ where: { id: taskId } })
    if (!task || !canReview(task, actor.id, actor.role)) {
      throw new WorkflowError("Görevin durumu değişmiş. Sayfayı yenileyin.")
    }
    await tx.task.update({
      where: { id: taskId },
      data: { status: "ONAYLANDI" },
    })
    await tx.taskLog.create({
      data: {
        taskId,
        actorId: actor.id,
        type: "APPROVED",
        fromStatus: task.status,
        toStatus: "ONAYLANDI",
        note: note || null,
      },
    })
    await tx.notification.create({
      data: {
        userId: task.assigneeId,
        taskId,
        title: "Taslak onaylandı",
        body: `${actor.name} taslağı onayladı. Gönderim kararını avukat verecek: ${task.title}`,
      },
    })
  })
}

export async function markExpensePaid(actor: SessionUser, taskId: string) {
  const existing = await visibleTask(taskId, actor)
  if (!existing) throw new WorkflowError("Görev bulunamadı.")
  if (!canManageOps(existing, actor.id, actor.role)) {
    throw new WorkflowError("Masraf işaretleme yetkiniz yok.")
  }
  if (existing.expensePaid) {
    throw new WorkflowError("Masraf zaten yatırıldı olarak işaretli.")
  }
  await prisma.$transaction(async (tx) => {
    const task = await tx.task.findUnique({ where: { id: taskId } })
    if (!task || !canManageOps(task, actor.id, actor.role)) {
      throw new WorkflowError("Görevin durumu değişmiş. Sayfayı yenileyin.")
    }
    await tx.task.update({
      where: { id: taskId },
      data: { expensePaid: true, expensePaidAt: new Date() },
    })
    await tx.taskLog.create({
      data: {
        taskId,
        actorId: actor.id,
        type: "EXPENSE_MARKED",
        fromStatus: task.status,
        toStatus: task.status,
        note: "Masraf yatırıldı.",
      },
    })
  })
}

export async function setClientCallStatus(
  actor: SessionUser,
  taskId: string,
  status: ClientCallStatus,
) {
  if (status !== "ARANACAK" && status !== "YAPILDI" && status !== "YOK") {
    throw new WorkflowError("Geçersiz arama durumu.")
  }
  const existing = await visibleTask(taskId, actor)
  if (!existing) throw new WorkflowError("Görev bulunamadı.")
  if (!canManageOps(existing, actor.id, actor.role)) {
    throw new WorkflowError("Müvekkil araması için yetkiniz yok.")
  }
  await prisma.$transaction(async (tx) => {
    const task = await tx.task.findUnique({ where: { id: taskId } })
    if (!task || !canManageOps(task, actor.id, actor.role)) {
      throw new WorkflowError("Görevin durumu değişmiş. Sayfayı yenileyin.")
    }
    await tx.task.update({
      where: { id: taskId },
      data: { clientCallStatus: status },
    })
    await tx.taskLog.create({
      data: {
        taskId,
        actorId: actor.id,
        type: "CLIENT_CALL_UPDATED",
        fromStatus: task.status,
        toStatus: task.status,
        note:
          status === "ARANACAK"
            ? "Müvekkil aranacak."
            : status === "YAPILDI"
              ? "Müvekkil araması yapıldı."
              : "Müvekkil araması kaldırıldı.",
        meta: JSON.stringify({ clientCallStatus: status }),
      },
    })
  })
}

export async function queueForSend(actor: SessionUser, taskId: string) {
  const existing = await visibleTask(taskId, actor)
  if (!existing) throw new WorkflowError("Görev bulunamadı.")
  if (!canQueueSend(existing, actor.id, actor.role)) {
    throw new WorkflowError("Gönderime alma yetkiniz yok.")
  }
  await prisma.$transaction(async (tx) => {
    const task = await tx.task.findUnique({ where: { id: taskId } })
    if (!task || !canQueueSend(task, actor.id, actor.role)) {
      throw new WorkflowError("Görevin durumu değişmiş. Sayfayı yenileyin.")
    }
    await tx.task.update({
      where: { id: taskId },
      data: { status: "GONDERIM_BEKLIYOR" },
    })
    await tx.taskLog.create({
      data: {
        taskId,
        actorId: actor.id,
        type: "SEND_QUEUED",
        fromStatus: task.status,
        toStatus: "GONDERIM_BEKLIYOR",
        note: "Atayan avukat gönderime aldı.",
      },
    })
    await tx.notification.create({
      data: {
        userId: task.assigneeId,
        taskId,
        title: "Gönderim bekliyor",
        body: `${actor.name} işi gönderime aldı: ${task.title}`,
      },
    })
  })
}

export async function completeTask(actor: SessionUser, taskId: string, rawCode: string) {
  const codeResult = validateTrackingCode(rawCode)
  if (!codeResult.ok) throw new WorkflowError(codeResult.error)
  const existing = await visibleTask(taskId, actor)
  if (!existing) throw new WorkflowError("Görev bulunamadı.")
  if (!canComplete(existing, actor.id, actor.role)) {
    throw new WorkflowError("Bu iş şu anda tamamlanamaz.")
  }

  await prisma.$transaction(async (tx) => {
    const task = await tx.task.findUnique({ where: { id: taskId } })
    if (!task || !canComplete(task, actor.id, actor.role)) {
      throw new WorkflowError("Görevin durumu değişmiş. Sayfayı yenileyin.")
    }
    await tx.task.update({
      where: { id: taskId },
      data: {
        status: "TAMAMLANDI",
        trackingCode: codeResult.code,
        completedAt: new Date(),
      },
    })
    await tx.taskLog.create({
      data: {
        taskId,
        actorId: actor.id,
        type: "COMPLETED",
        fromStatus: task.status,
        toStatus: "TAMAMLANDI",
        note: "Evrak takip kodu işlendi.",
        meta: JSON.stringify({ trackingCode: codeResult.code }),
      },
    })
    await tx.notification.create({
      data: {
        userId: task.assignerId,
        taskId,
        title: "Gönderim tamamlandı",
        body: `${actor.name} evrak kodunu işledi: ${task.title}`,
      },
    })
  })
}

export async function setTaskListColor(
  actor: SessionUser,
  taskId: string,
  color: string | null,
) {
  const existing = await visibleTask(taskId, actor)
  if (!existing) throw new WorkflowError("Görev bulunamadı.")
  if (actor.role === "LAWYER" && existing.assignerId !== actor.id) {
    throw new WorkflowError("Yalnızca kendi atadığınız işte değişiklik yapabilirsiniz.")
  }
  const allowed = new Set(["", "red", "orange", "green", "blue", "pink", "auto"])
  const next = !color || color === "auto" ? null : color
  if (next && !allowed.has(next)) throw new WorkflowError("Geçersiz renk.")
  await prisma.task.update({
    where: { id: taskId },
    data: { listColor: next },
  })
}

export async function acceptTask(actor: SessionUser, taskId: string) {
  const existing = await visibleTask(taskId, actor)
  if (!existing) throw new WorkflowError("Görev bulunamadı.")
  if (!canAcceptTask(existing, actor.id, actor.role)) {
    throw new WorkflowError("Bu işi kabul edemezsiniz.")
  }
  await prisma.$transaction(async (tx) => {
    await tx.task.update({
      where: { id: taskId },
      data: { acceptedAt: new Date() },
    })
    await tx.taskLog.create({
      data: {
        taskId,
        actorId: actor.id,
        type: "ACCEPTED",
        fromStatus: existing.status,
        toStatus: existing.status,
      },
    })
    await tx.notification.create({
      data: {
        userId: existing.assignerId,
        taskId,
        title: "İş kabul edildi",
        body: `${actor.name} atanan işi kabul etti: ${existing.title}`,
      },
    })
  })
}

export async function deleteTask(actor: SessionUser, taskId: string) {
  const existing = await visibleTask(taskId, actor)
  if (!existing) throw new WorkflowError("Görev bulunamadı.")
  if (!canDeleteTask(existing, actor.id, actor.role)) {
    throw new WorkflowError("Bu işi silemezsiniz.")
  }
  await prisma.task.delete({ where: { id: taskId } })
}

export async function addComment(actor: SessionUser, taskId: string, rawBody: string) {
  const comment = validateComment(rawBody)
  if (!comment.ok) throw new WorkflowError(comment.error)
  const existing = await visibleTask(taskId, actor)
  if (!existing || !canComment(existing, actor.id, actor.role)) {
    throw new WorkflowError("Bu işe not yazamazsınız.")
  }
  await prisma.$transaction(async (tx) => {
    await tx.taskComment.create({
      data: { taskId, authorId: actor.id, body: comment.body },
    })
    await tx.task.update({
      where: { id: taskId },
      data: { updatedAt: new Date() },
    })
    const recipients = isParticipant(existing, actor.id)
      ? [otherParty(existing, actor.id)]
      : [existing.assignerId, existing.assigneeId].filter((id) => id !== actor.id)
    for (const userId of [...new Set(recipients)]) {
      await tx.notification.create({
        data: {
          userId,
          taskId,
          title: "Yeni iç not",
          body: `${actor.name}: ${comment.body.slice(0, 140)}`,
        },
      })
    }
  })
}

export async function markTaskRead(
  userId: string,
  taskId: string,
  role: SessionUser["role"],
) {
  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task || !canViewTask(task, userId, role)) return 0
  const result = await prisma.notification.updateMany({
    where: { userId, taskId, read: false },
    data: { read: true },
  })
  return result.count
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  })
}
