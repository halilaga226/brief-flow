"use server"

import type { ActionState } from "@/lib/dto"
import { requireUser } from "@/lib/session"
import { WorkflowError } from "@/lib/workflow"
import {
  answerQuest,
  closeQuest,
  createQuest,
  awardBonusXp,
  scoreCompletedTask,
  scoreQuestAnswer,
} from "@/server/xp"
import { revalidatePath } from "next/cache"

function actionError(error: unknown): ActionState {
  if (error instanceof WorkflowError) return { error: error.message }
  console.error(error)
  return { error: "İşlem tamamlanamadı. Lütfen yeniden deneyin." }
}

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "")
}

function revalidateXp(taskId?: string) {
  revalidatePath("/ana")
  revalidatePath("/arastirma")
  revalidatePath("/stajyer-ilerleme")
  revalidatePath("/stajyer-isleri")
  if (taskId) revalidatePath(`/gorevler/${taskId}`)
}

export async function scoreTaskAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  const taskId = readText(formData, "taskId")
  try {
    await scoreCompletedTask(
      user,
      taskId,
      readText(formData, "points"),
      readText(formData, "note"),
    )
  } catch (error) {
    return actionError(error)
  }
  revalidateXp(taskId)
  return { ok: true, message: "Puan kaydedildi. Stajyer XP kazandı." }
}

export async function createQuestAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  try {
    await createQuest(user, readText(formData, "title"), readText(formData, "prompt"))
  } catch (error) {
    return actionError(error)
  }
  revalidateXp()
  return { ok: true, message: "Araştırma konusu stajyerlere açıldı." }
}

export async function answerQuestAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  try {
    await answerQuest(user, readText(formData, "questId"), readText(formData, "body"))
  } catch (error) {
    return actionError(error)
  }
  revalidateXp()
  return { ok: true, message: "Yanıtınız gönderildi." }
}

export async function scoreQuestAnswerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  try {
    await scoreQuestAnswer(user, readText(formData, "answerId"), readText(formData, "points"))
  } catch (error) {
    return actionError(error)
  }
  revalidateXp()
  return { ok: true, message: "Yanıta XP verildi." }
}

export async function awardBonusXpAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  try {
    await awardBonusXp(
      user,
      readText(formData, "internId"),
      readText(formData, "points"),
      readText(formData, "note"),
    )
  } catch (error) {
    return actionError(error)
  }
  revalidateXp()
  return { ok: true, message: "Ek XP stajyere işlendi." }
}

export async function closeQuestAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  try {
    await closeQuest(user, readText(formData, "questId"))
  } catch (error) {
    return actionError(error)
  }
  revalidateXp()
  return { ok: true, message: "Konu kapatıldı." }
}
