"use server"

import type { ActionState } from "@/lib/dto"
import { requireUser } from "@/lib/session"
import { WorkflowError } from "@/lib/workflow"
import {
  addWorkItemEntry,
  completeWorkItem,
  createWorkItem,
  deleteWorkItem,
  reopenWorkItem,
  updateWorkItem,
} from "@/server/work-items"
import { revalidatePath } from "next/cache"

function actionError(error: unknown): ActionState {
  if (error instanceof WorkflowError) return { error: error.message }
  console.error(error)
  return { error: "İşlem tamamlanamadı. Lütfen yeniden deneyin." }
}

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "")
}

export async function createWorkItemAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  const fileNumber = readText(formData, "fileNumber")
  try {
    const id = await createWorkItem(user, {
      clientName: readText(formData, "clientName"),
      clientId: readText(formData, "clientId") || null,
      opposingParty: readText(formData, "opposingParty"),
      courtName: readText(formData, "courtName"),
      fileNumber,
      courtFile: readText(formData, "courtFile") || fileNumber,
      workToDo: readText(formData, "workToDo"),
      notes: readText(formData, "notes"),
    })
    revalidatePath("/is-listesi")
    revalidatePath("/stajyer-isleri")
    revalidatePath(`/is-listesi/${id}`)
    return { ok: true, message: "İş listenize eklendi." }
  } catch (error) {
    return actionError(error)
  }
}

export async function updateWorkItemAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  const workItemId = readText(formData, "workItemId")
  const fileNumber = readText(formData, "fileNumber")
  try {
    await updateWorkItem(user, workItemId, {
      clientName: readText(formData, "clientName"),
      clientId: readText(formData, "clientId") || null,
      opposingParty: readText(formData, "opposingParty"),
      courtName: readText(formData, "courtName"),
      fileNumber,
      courtFile: readText(formData, "courtFile") || fileNumber,
      workToDo: readText(formData, "workToDo"),
      notes: readText(formData, "notes"),
    })
  } catch (error) {
    return actionError(error)
  }
  revalidatePath("/is-listesi")
  revalidatePath("/stajyer-isleri")
  revalidatePath(`/is-listesi/${workItemId}`)
  return { ok: true, message: "İş kaydı güncellendi." }
}

export async function completeWorkItemAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  const workItemId = readText(formData, "workItemId")
  try {
    await completeWorkItem(user, workItemId)
  } catch (error) {
    return actionError(error)
  }
  revalidatePath("/is-listesi")
  revalidatePath("/stajyer-isleri")
  revalidatePath(`/is-listesi/${workItemId}`)
  return { ok: true, message: "İş tamamlandı olarak işaretlendi." }
}

export async function reopenWorkItemAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  const workItemId = readText(formData, "workItemId")
  try {
    await reopenWorkItem(user, workItemId)
  } catch (error) {
    return actionError(error)
  }
  revalidatePath("/is-listesi")
  revalidatePath("/stajyer-isleri")
  revalidatePath(`/is-listesi/${workItemId}`)
  return { ok: true, message: "İş yeniden açıldı." }
}

export async function deleteWorkItemAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  try {
    await deleteWorkItem(user, readText(formData, "workItemId"))
  } catch (error) {
    return actionError(error)
  }
  revalidatePath("/is-listesi")
  revalidatePath("/stajyer-isleri")
  return { ok: true, message: "Kayıt silindi." }
}

export async function addWorkItemEntryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  const workItemId = readText(formData, "workItemId")
  try {
    await addWorkItemEntry(user, workItemId, readText(formData, "content"))
  } catch (error) {
    return actionError(error)
  }
  revalidatePath(`/is-listesi/${workItemId}`)
  revalidatePath("/is-listesi")
  revalidatePath("/stajyer-isleri")
  return { ok: true, message: "Yapılanlara eklendi." }
}
