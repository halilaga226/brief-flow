import type { SessionUser } from "@/lib/dto"
import { internRank, parsePoints, type InternBoardRow, type QuestDTO } from "@/lib/xp"
import { prisma } from "@/lib/prisma"
import { canCreateTask, canViewTask, isAdmin, WorkflowError } from "@/lib/workflow"
import { ensureXpSchema } from "@/server/ensure-xp-schema"

function clean(text: string, max = 4000) {
  return text.replace(/\s+/g, " ").trim().slice(0, max)
}

async function visibleScoredTask(taskId: string, actor: SessionUser) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { assignee: { select: { role: true, name: true } } },
  })
  if (
    !task ||
    task.deletedAt ||
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

export async function listInternBoard(actor: SessionUser): Promise<InternBoardRow[]> {
  await ensureXpSchema()
  const interns = await prisma.user.findMany({
    where: { role: "INTERN" },
    select: { id: true, name: true, title: true },
    orderBy: { name: "asc" },
  })
  if (interns.length === 0) return []

  const internIds = interns.map((row) => row.id)
  const [jobScores, questScores] = await Promise.all([
    prisma.taskScore.groupBy({
      by: ["internId"],
      where: { internId: { in: internIds } },
      _sum: { points: true },
      _count: { _all: true },
    }),
    prisma.internQuestAnswer.groupBy({
      by: ["internId"],
      where: { internId: { in: internIds }, points: { not: null } },
      _sum: { points: true },
      _count: { _all: true },
    }),
  ])

  const jobMap = new Map(jobScores.map((row) => [row.internId, row]))
  const questMap = new Map(questScores.map((row) => [row.internId, row]))

  return interns
    .map((intern) => {
      const jobs = jobMap.get(intern.id)
      const quests = questMap.get(intern.id)
      const xp = (jobs?._sum.points ?? 0) + (quests?._sum.points ?? 0)
      const rank = internRank(xp)
      return {
        id: intern.id,
        name: intern.name,
        title: intern.title,
        xp: rank.xp,
        level: rank.level,
        rankTitle: rank.title,
        into: rank.into,
        need: rank.need,
        progress: rank.progress,
        jobCount: jobs?._count._all ?? 0,
        questCount: quests?._count._all ?? 0,
        isYou: intern.id === actor.id,
      }
    })
    .sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name, "tr"))
}

export async function getTaskScoreState(actor: SessionUser, taskId: string) {
  await ensureXpSchema()
  const task = await visibleScoredTask(taskId, actor)
  if (!task) return null
  const score = await prisma.taskScore.findUnique({
    where: { taskId },
    include: { lawyer: { select: { name: true } } },
  })
  const internAssignee = task.assignee.role === "INTERN"
  const canScore =
    internAssignee &&
    task.status === "TAMAMLANDI" &&
    !score &&
    canCreateTask(actor.role) &&
    (isAdmin(actor.role) || task.assignerId === actor.id)
  return {
    internName: task.assignee.name,
    internId: task.assigneeId,
    canScore,
    score: score
      ? {
          points: score.points,
          note: score.note,
          lawyerName: score.lawyer.name,
        }
      : null,
  }
}

export async function scoreCompletedTask(
  actor: SessionUser,
  taskId: string,
  rawPoints: string,
  rawNote: string,
) {
  const points = parsePoints(rawPoints)
  if (!points) throw new WorkflowError("Puan 1 ile 10 arasında olmalı.")
  await ensureXpSchema()
  const task = await visibleScoredTask(taskId, actor)
  if (!task) throw new WorkflowError("Görev bulunamadı.")
  if (task.assignee.role !== "INTERN") {
    throw new WorkflowError("Puan yalnızca stajyerin tamamladığı işe verilir.")
  }
  if (task.status !== "TAMAMLANDI") {
    throw new WorkflowError("İş tamamlanmadan puan verilemez.")
  }
  if (!canCreateTask(actor.role) || (!isAdmin(actor.role) && task.assignerId !== actor.id)) {
    throw new WorkflowError("Bu işe puan vermeye yetkiniz yok.")
  }

  const existing = await prisma.taskScore.findUnique({ where: { taskId } })
  if (existing) throw new WorkflowError("Bu işe zaten puan verilmiş.")

  await prisma.$transaction(async (tx) => {
    await tx.taskScore.create({
      data: {
        taskId,
        internId: task.assigneeId,
        lawyerId: actor.id,
        points,
        note: clean(rawNote, 400),
      },
    })
    await tx.notification.create({
      data: {
        userId: task.assigneeId,
        taskId,
        title: `+${points} XP kazandınız`,
        body: `${actor.name} tamamlanan işe ${points} puan verdi: ${task.title}`,
      },
    })
  })
}

export async function listQuests(actor: SessionUser): Promise<QuestDTO[]> {
  await ensureXpSchema()
  const lawyerView = canCreateTask(actor.role)
  const rows = await prisma.internQuest.findMany({
    include: {
      createdBy: { select: { name: true } },
      answers: {
        include: { intern: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return rows.map((quest) => {
    const mine = quest.answers.find((row) => row.internId === actor.id)
    return {
      id: quest.id,
      title: quest.title,
      prompt: quest.prompt,
      createdByName: quest.createdBy.name,
      createdAt: quest.createdAt.toISOString(),
      closed: Boolean(quest.closedAt),
      answerCount: quest.answers.length,
      myAnswer: mine ? { body: mine.body, points: mine.points } : null,
      answers: lawyerView
        ? quest.answers.map((row) => ({
            id: row.id,
            internName: row.intern.name,
            internId: row.intern.id,
            body: row.body,
            points: row.points,
            when: row.createdAt.toISOString(),
          }))
        : [],
    }
  })
}

export async function createQuest(actor: SessionUser, title: string, prompt: string) {
  if (!canCreateTask(actor.role)) {
    throw new WorkflowError("Araştırma konusunu avukat veya yönetici ekler.")
  }
  const cleanTitle = clean(title, 120)
  const cleanPrompt = clean(prompt, 4000)
  if (cleanTitle.length < 4) throw new WorkflowError("Konu başlığı en az 4 karakter olmalı.")
  if (cleanPrompt.length < 10) throw new WorkflowError("Araştırma sorusu daha ayrıntılı yazın.")
  await ensureXpSchema()
  const quest = await prisma.internQuest.create({
    data: {
      title: cleanTitle,
      prompt: cleanPrompt,
      createdById: actor.id,
    },
  })
  const interns = await prisma.user.findMany({
    where: { role: "INTERN" },
    select: { id: true },
  })
  if (interns.length) {
    await prisma.notification.createMany({
      data: interns.map((intern) => ({
        userId: intern.id,
        title: "Yeni araştırma görevi",
        body: `${actor.name} bir konu açtı: ${cleanTitle}`,
      })),
    })
  }
  return quest.id
}

export async function answerQuest(actor: SessionUser, questId: string, body: string) {
  if (actor.role !== "INTERN") {
    throw new WorkflowError("Araştırma sorusunu stajyer yanıtlar.")
  }
  const text = clean(body, 6000)
  if (text.length < 20) throw new WorkflowError("Yanıt en az birkaç cümle olmalı.")
  await ensureXpSchema()
  const quest = await prisma.internQuest.findUnique({ where: { id: questId } })
  if (!quest) throw new WorkflowError("Konu bulunamadı.")
  if (quest.closedAt) throw new WorkflowError("Bu konu kapanmış.")

  const existing = await prisma.internQuestAnswer.findUnique({
    where: { questId_internId: { questId, internId: actor.id } },
  })
  if (existing?.points != null) {
    throw new WorkflowError("Puanlanmış yanıt değiştirilemez.")
  }

  await prisma.internQuestAnswer.upsert({
    where: { questId_internId: { questId, internId: actor.id } },
    create: { questId, internId: actor.id, body: text },
    update: { body: text },
  })
  await prisma.notification.create({
    data: {
      userId: quest.createdById,
      title: "Araştırma yanıtı geldi",
      body: `${actor.name} «${quest.title}» konusuna yanıt yazdı.`,
    },
  })
}

export async function scoreQuestAnswer(
  actor: SessionUser,
  answerId: string,
  rawPoints: string,
) {
  if (!canCreateTask(actor.role)) {
    throw new WorkflowError("Puanı avukat verir.")
  }
  const points = parsePoints(rawPoints)
  if (!points) throw new WorkflowError("Puan 1 ile 10 arasında olmalı.")
  await ensureXpSchema()
  const answer = await prisma.internQuestAnswer.findUnique({
    where: { id: answerId },
    include: { quest: true },
  })
  if (!answer) throw new WorkflowError("Yanıt bulunamadı.")
  if (answer.points != null) throw new WorkflowError("Bu yanıt zaten puanlanmış.")

  await prisma.$transaction(async (tx) => {
    await tx.internQuestAnswer.update({
      where: { id: answerId },
      data: {
        points,
        scoredById: actor.id,
        scoredAt: new Date(),
      },
    })
    await tx.notification.create({
      data: {
        userId: answer.internId,
        title: `Araştırmadan +${points} XP`,
        body: `${actor.name} «${answer.quest.title}» yanıtını ${points} puanla ödüllendirdi.`,
      },
    })
  })
}

export async function closeQuest(actor: SessionUser, questId: string) {
  if (!canCreateTask(actor.role)) throw new WorkflowError("Konuyu kapatmaya yetkiniz yok.")
  await ensureXpSchema()
  const quest = await prisma.internQuest.findUnique({ where: { id: questId } })
  if (!quest) throw new WorkflowError("Konu bulunamadı.")
  if (quest.closedAt) return
  if (!isAdmin(actor.role) && quest.createdById !== actor.id) {
    throw new WorkflowError("Yalnızca konuyu açan avukat kapatabilir.")
  }
  await prisma.internQuest.update({
    where: { id: questId },
    data: { closedAt: new Date() },
  })
}
