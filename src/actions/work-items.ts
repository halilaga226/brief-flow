"use server"

import type { ActionState } from "@/lib/dto"
import { requireUser } from "@/lib/session"
import { WorkflowError } from "@/lib/workflow"
import { createWorkItem, deleteWorkItem } from "@/server/work-items"
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
  try {
    await createWorkItem(user, {
      clientName: readText(formData, "clientName"),
      opposingParty: readText(formData, "opposingParty"),
      courtName: readText(formData, "courtName"),
      fileNumber: readText(formData, "fileNumber"),
      workToDo: readText(formData, "workToDo"),
      notes: readText(formData, "notes"),
    })
  } catch (error) {
    return actionError(error)
  }
  revalidatePath("/is-listesi")
  return { ok: true, message: "İş listesine eklendi." }
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
