"use server"

import type { ActionState } from "@/lib/dto"
import { requireUser } from "@/lib/session"
import { WorkflowError } from "@/lib/workflow"
import {
  addWorkItemEntry,
  createWorkItem,
  deleteWorkItem,
} from "@/server/work-items"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

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
      opposingParty: readText(formData, "opposingParty"),
      courtName: readText(formData, "courtName"),
      fileNumber,
      courtFile: readText(formData, "courtFile") || fileNumber,
      workToDo: readText(formData, "workToDo"),
      notes: readText(formData, "notes"),
    })
    revalidatePath("/is-listesi")
    redirect(`/is-listesi/${id}`)
  } catch (error) {
    // redirect throws; rethrow those
    if (error && typeof error === "object" && "digest" in error) throw error
    return actionError(error)
  }
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
  return { ok: true, message: "Yapılanlara eklendi." }
}
