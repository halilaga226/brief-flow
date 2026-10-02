import type { SessionUser } from "@/lib/dto"
import { prisma } from "@/lib/prisma"
import { isAdmin, WorkflowError } from "@/lib/workflow"
import { isDemoEmail, isDemoUsername } from "@/lib/users"

const DEMO_USERNAMES = [
  "ayse.demir",
  "mehmet.kaya",
  "elif.yilmaz",
  "can.ozturk",
  "demo.avukat",
  "demo.stajyer",
] as const

export async function getAdminOverview(actor: SessionUser) {
  if (!isAdmin(actor.role)) {
    throw new WorkflowError("Yalnızca yönetici bu paneli açabilir.")
  }
  const [taskCount, userCount, openCount, callCount, demoUsers, recentTasks] =
    await Promise.all([
      prisma.task.count({ where: { deletedAt: null } }),
      prisma.user.count(),
      prisma.task.count({ where: { deletedAt: null, status: { not: "TAMAMLANDI" } } }),
      prisma.task.count({ where: { deletedAt: null, clientCallStatus: "ARANACAK" } }),
      prisma.user.findMany({
        where: {
          OR: [
            { email: { endsWith: "@vekalet.local" } },
            { username: { in: [...DEMO_USERNAMES] } },
          ],
        },
        select: { id: true, name: true, email: true, username: true },
      }),
      prisma.task.findMany({
        where: { deletedAt: null },
        orderBy: { updatedAt: "desc" },
        take: 12,
        include: { assigner: true, assignee: true },
      }),
    ])

  return {
    counts: {
      tasks: taskCount,
      users: userCount,
      open: openCount,
      calls: callCount,
      demoUsers: demoUsers.length,
    },
    demoUsers,
    recentTasks: recentTasks.map((task) => ({
      id: task.id,
      title: task.title,
      clientName: task.clientName,
      status: task.status,
      assignerName: task.assigner.name,
      assigneeName: task.assignee.name,
      clientCallStatus: task.clientCallStatus,
      expensePaid: task.expensePaid,
    })),
  }
}

async function demoUserIds() {
  const demoUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { endsWith: "@vekalet.local" } },
        { username: { in: [...DEMO_USERNAMES] } },
      ],
    },
    select: { id: true, username: true, email: true },
  })
  return demoUsers
}

/** Yalnızca örnek hesaplara bağlı işleri soft-delete eder. Gerçek işlere dokunmaz. */
export async function clearDemoData(actor: SessionUser, confirmPhrase: string) {
  if (!isAdmin(actor.role)) {
    throw new WorkflowError("Yalnızca yönetici örnek veriyi silebilir.")
  }
  if (confirmPhrase.trim().toLocaleUpperCase("tr") !== "ORNEK SIL") {
    throw new WorkflowError('Onay için kutuya ORNEK SIL yazın.')
  }
  const actorRow = await prisma.user.findUnique({ where: { id: actor.id } })
  if (actorRow && (isDemoEmail(actorRow.email) || isDemoUsername(actorRow.username))) {
    throw new WorkflowError(
      "Örnek hesapla girişliyken temizleme yapılamaz. Kendi yönetici hesabınızla girin.",
    )
  }

  const demos = await demoUserIds()
  const demoIds = demos.map((user) => user.id)
  if (demoIds.length === 0) {
    return { tasks: 0, users: 0, snapshotId: null as string | null }
  }

  const demoTasks = await prisma.task.findMany({
    where: {
      deletedAt: null,
      OR: [{ assignerId: { in: demoIds } }, { assigneeId: { in: demoIds } }],
    },
  })

  const snapshot = await prisma.dataSnapshot.create({
    data: {
      kind: "clear_demo",
      label: `Örnek iş soft-delete (${demoTasks.length} iş)`,
      createdBy: actor.id,
      payload: JSON.stringify({
        demoUsers: demos,
        tasks: demoTasks,
      }),
    },
  })

  const now = new Date()
  const result = await prisma.$transaction(async (tx) => {
    const tasks = await tx.task.updateMany({
      where: {
        deletedAt: null,
        OR: [{ assignerId: { in: demoIds } }, { assigneeId: { in: demoIds } }],
      },
      data: { deletedAt: now },
    })
    // Örnek hesapları silmiyoruz — görev FK’ları bozulmasın; silinenlerden geri yüklenebilsin
    return { tasks: tasks.count, users: 0 }
  })

  return { ...result, snapshotId: snapshot.id }
}

export async function restoreAllSoftDeleted(actor: SessionUser) {
  if (!isAdmin(actor.role) && actor.role !== "LAWYER") {
    throw new WorkflowError("Yetki yok.")
  }
  const [tasks, clients, files] = await prisma.$transaction([
    prisma.task.updateMany({
      where: { deletedAt: { not: null } },
      data: { deletedAt: null },
    }),
    prisma.client.updateMany({
      where: { deletedAt: { not: null } },
      data: { deletedAt: null },
    }),
    prisma.caseFile.updateMany({
      where: { deletedAt: { not: null } },
      data: { deletedAt: null },
    }),
  ])
  return {
    tasks: tasks.count,
    clients: clients.count,
    files: files.count,
  }
}

export async function listDataSnapshots(actor: SessionUser) {
  if (!isAdmin(actor.role)) throw new WorkflowError("Yetki yok.")
  return prisma.dataSnapshot.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      kind: true,
      label: true,
      createdAt: true,
      restoredAt: true,
      createdBy: true,
    },
  })
}

export async function restoreDataSnapshot(actor: SessionUser, snapshotId: string) {
  if (!isAdmin(actor.role)) throw new WorkflowError("Yetki yok.")
  const snap = await prisma.dataSnapshot.findUnique({ where: { id: snapshotId } })
  if (!snap) throw new WorkflowError("Yedek bulunamadı.")
  if (snap.kind !== "clear_demo") {
    throw new WorkflowError("Bu yedek türü henüz desteklenmiyor.")
  }
  let payload: { tasks?: { id: string }[] }
  try {
    payload = JSON.parse(snap.payload) as { tasks?: { id: string }[] }
  } catch {
    throw new WorkflowError("Yedek bozuk.")
  }
  const ids = (payload.tasks ?? []).map((row) => row.id)
  const restored = ids.length
    ? await prisma.task.updateMany({
        where: { id: { in: ids } },
        data: { deletedAt: null },
      })
    : { count: 0 }
  await prisma.dataSnapshot.update({
    where: { id: snapshotId },
    data: { restoredAt: new Date() },
  })
  return { tasks: restored.count }
}

export async function listClientCalls(actor: SessionUser) {
  const where =
    isAdmin(actor.role)
      ? { deletedAt: null, clientCallStatus: "ARANACAK" as const }
      : {
          deletedAt: null,
          clientCallStatus: "ARANACAK" as const,
          OR: [{ assignerId: actor.id }, { assigneeId: actor.id }],
        }
  const rows = await prisma.task.findMany({
    where,
    include: { assigner: true, assignee: true },
    orderBy: { dueDate: "asc" },
  })
  return rows.map((task) => ({
    id: task.id,
    title: task.title,
    clientName: task.clientName,
    fileNumber: task.fileNumber,
    assignerName: task.assigner.name,
    assigneeName: task.assignee.name,
    dueDate: task.dueDate.toISOString(),
  }))
}
