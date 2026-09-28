"use server"

import type { ActionState } from "@/lib/dto"
import { parseDueDate } from "@/lib/format"
import { requireUser } from "@/lib/session"
import { WorkflowError } from "@/lib/workflow"
import {
  addComment,
  acceptTask,
  approveTask,
  completeTask,
  createTask,
  deleteTask,
  markExpensePaid,
  queueForSend,
  requestRevision,
  setClientCallStatus,
  setTaskListColor,
  uploadDraft,
  markDraftSent,
} from "@/server/tasks"
import { clearDemoData } from "@/server/admin"
import type { ClientCallStatus } from "@/lib/workflow"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

function revalidateTask(taskId: string) {
  revalidatePath("/ayarlar")
  revalidatePath("/ana")
  revalidatePath("/gorevler")
  revalidatePath("/is-listesi")
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
        workItemId: readText(formData, "workItemId") || null,
      },
      file instanceof File ? file : null,
    )
  } catch (error) {
    return actionError(error)
  }
  revalidateTask(taskId)
  revalidatePath("/is-listesi")
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

export async function markDraftSentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  const taskId = readText(formData, "taskId")
  try {
    await markDraftSent(user, taskId)
  } catch (error) {
    return actionError(error)
  }
  revalidateTask(taskId)
  return { ok: true, message: "Taslak gönderildi olarak işaretlendi. Avukat incelemesine geçildi." }
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
  return { ok: true, message: "Taslak onaylandı. Masraf, arama ve gönderim sizin kararınız." }
}

export async function markExpenseAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  const taskId = readText(formData, "taskId")
  try {
    await markExpensePaid(user, taskId)
  } catch (error) {
    return actionError(error)
  }
  revalidateTask(taskId)
  return { ok: true, message: "Masraf yatırıldı olarak işaretlendi." }
}

export async function setClientCallAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  const taskId = readText(formData, "taskId")
  const status = readText(formData, "status") as ClientCallStatus
  try {
    await setClientCallStatus(user, taskId, status)
  } catch (error) {
    return actionError(error)
  }
  revalidateTask(taskId)
  revalidatePath("/ayarlar")
  revalidatePath("/ayarlar")
  return { ok: true, message: "Müvekkil araması güncellendi." }
}

export async function queueSendAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  const taskId = readText(formData, "taskId")
  try {
    await queueForSend(user, taskId)
  } catch (error) {
    return actionError(error)
  }
  revalidateTask(taskId)
  return { ok: true, message: "İş gönderime alındı." }
}

export async function clearDemoAction(
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  void _prev
  void _formData
  const user = await requireUser()
  try {
    const result = await clearDemoData(user)
    revalidatePath("/ayarlar")
    revalidatePath("/gorevler")
    revalidatePath("/kullanicilar")
    return {
      ok: true,
      message: `${result.tasks} görev ve ${result.users} örnek hesap silindi.`,
    }
  } catch (error) {
    return actionError(error)
  }
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

export async function setTaskColorAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  const taskId = readText(formData, "taskId")
  try {
    await setTaskListColor(user, taskId, readText(formData, "listColor") || null)
  } catch (error) {
    return actionError(error)
  }
  revalidateTask(taskId)
  return { ok: true, message: "Renk güncellendi." }
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

export async function acceptTaskAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  const taskId = readText(formData, "taskId")
  try {
    await acceptTask(user, taskId)
  } catch (error) {
    return actionError(error)
  }
  revalidateTask(taskId)
  redirect("/is-listesi")
}

export async function deleteTaskAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  const taskId = readText(formData, "taskId")
  try {
    await deleteTask(user, taskId)
  } catch (error) {
    return actionError(error)
  }
  revalidatePath("/ana")
  revalidatePath("/gorevler")
  revalidatePath("/is-listesi")
  revalidatePath("/ayarlar")
  redirect("/is-listesi")
}
