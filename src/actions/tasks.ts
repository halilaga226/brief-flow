"use server"

import type { ActionState } from "@/lib/dto"
import { parseDueDate } from "@/lib/format"
import { requireUser } from "@/lib/session"
import { WorkflowError } from "@/lib/workflow"
import {
  addComment,
  approveTask,
  completeTask,
  createTask,
  requestRevision,
  uploadDraft,
} from "@/server/tasks"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

function revalidateTask(taskId: string) {
  revalidatePath("/panel")
  revalidatePath("/gorevler")
  revalidatePath(`/gorevler/${taskId}`)
}

function actionError(error: unknown): ActionState {
  if (error instanceof WorkflowError) return { error: error.message }
  console.error(error)
  return { error: "İşlem tamamlanamadı. Lütfen yeniden deneyin." }
}

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "")
}

export async function createTaskAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  const file = formData.get("file")
  let taskId = ""
  try {
    taskId = await createTask(
      user,
      {
        title: readText(formData, "title"),
        clientName: readText(formData, "clientName"),
        fileNumber: readText(formData, "fileNumber"),
        description: readText(formData, "description"),
        dueDate: parseDueDate(readText(formData, "dueDate")),
        assigneeId: readText(formData, "assigneeId"),
      },
      file instanceof File ? file : null,
    )
  } catch (error) {
    return actionError(error)
  }
  revalidateTask(taskId)
  redirect(`/gorevler/${taskId}`)
}

export async function uploadDraftAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  const taskId = readText(formData, "taskId")
  const file = formData.get("file")
  try {
    if (!(file instanceof File) || file.size <= 0) {
      return { error: "Dosya seçin." }
    }
    await uploadDraft(user, taskId, file)
  } catch (error) {
    return actionError(error)
  }
  revalidateTask(taskId)
  return { ok: true, message: "Taslak incelemeye gönderildi." }
}

export async function requestRevisionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  const taskId = readText(formData, "taskId")
  try {
    await requestRevision(user, taskId, readText(formData, "note"))
  } catch (error) {
    return actionError(error)
  }
  revalidateTask(taskId)
  return { ok: true, message: "Revizyon istendi." }
}

export async function approveTaskAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  const taskId = readText(formData, "taskId")
  try {
    await approveTask(user, taskId, readText(formData, "note"))
  } catch (error) {
    return actionError(error)
  }
  revalidateTask(taskId)
  return { ok: true, message: "Taslak onaylandı. İş gönderime düştü." }
}

export async function completeTaskAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  const taskId = readText(formData, "taskId")
  try {
    await completeTask(user, taskId, readText(formData, "trackingCode"))
  } catch (error) {
    return actionError(error)
  }
  revalidateTask(taskId)
  return { ok: true, message: "Görev evrak koduyla tamamlandı." }
}

export async function addCommentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  const taskId = readText(formData, "taskId")
  try {
    await addComment(user, taskId, readText(formData, "body"))
  } catch (error) {
    return actionError(error)
  }
  revalidateTask(taskId)
  return { ok: true, message: "Not iletildi." }
}
