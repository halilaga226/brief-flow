import type { SessionUser } from "@/lib/dto"
import { prisma } from "@/lib/prisma"
import { isAdmin, WorkflowError } from "@/lib/workflow"
import { isDemoEmail } from "@/lib/users"

export async function getAdminOverview(actor: SessionUser) {
  if (!isAdmin(actor.role)) {
    throw new WorkflowError("Yalnızca yönetici bu paneli açabilir.")
  }
  const [taskCount, userCount, openCount, callCount, demoUsers, recentTasks] =
    await Promise.all([
      prisma.task.count(),
      prisma.user.count(),
      prisma.task.count({ where: { status: { not: "TAMAMLANDI" } } }),
      prisma.task.count({ where: { clientCallStatus: "ARANACAK" } }),
      prisma.user.findMany({
        where: { email: { endsWith: "@vekalet.local" } },
        select: { id: true, name: true, email: true },
      }),
      prisma.task.findMany({
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

export async function clearDemoData(actor: SessionUser) {
  if (!isAdmin(actor.role)) {
    throw new WorkflowError("Yalnızca yönetici örnek veriyi silebilir.")
  }
  if (isDemoEmail(actor.email)) {
    throw new WorkflowError(
      "Örnek hesapla girişliyken temizleme yapılamaz. Kendi yönetici hesabınızla girin.",
    )
  }

  const demoUsers = await prisma.user.findMany({
    where: { email: { endsWith: "@vekalet.local" } },
    select: { id: true },
  })
  const demoIds = demoUsers.map((user) => user.id)

  const result = await prisma.$transaction(async (tx) => {
    const tasks = await tx.task.deleteMany({})
    if (demoIds.length > 0) {
      await tx.notification.deleteMany({ where: { userId: { in: demoIds } } })
      await tx.user.deleteMany({ where: { id: { in: demoIds } } })
    }
    return { tasks: tasks.count, users: demoIds.length }
  })

  return result
}

export async function listClientCalls(actor: SessionUser) {
  const where =
    isAdmin(actor.role)
      ? { clientCallStatus: "ARANACAK" as const }
      : {
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
