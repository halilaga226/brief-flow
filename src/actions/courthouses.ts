"use server"

import type { ActionState } from "@/lib/dto"
import { requireUser } from "@/lib/session"
import { WorkflowError } from "@/lib/workflow"
import {
  completeCourthouseJob,
  createCourthouse,
  createCourthouseJob,
  deleteCourthouse,
  deleteCourthouseJob,
  reopenCourthouseJob,
} from "@/server/courthouses"
import { revalidatePath } from "next/cache"

function actionError(error: unknown): ActionState {
  if (error instanceof WorkflowError) return { error: error.message }
  console.error(error)
  return { error: "İşlem tamamlanamadı. Lütfen yeniden deneyin." }
}

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "")
}

function revalidateAdliye() {
  revalidatePath("/adliye")
  revalidatePath("/is-listesi")
  revalidatePath("/ana")
}

export async function createCourthouseAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  try {
    await createCourthouse(user, {
      name: readText(formData, "name"),
      city: readText(formData, "city"),
      notes: readText(formData, "notes"),
    })
  } catch (error) {
    return actionError(error)
  }
  revalidateAdliye()
  return { ok: true, message: "Adliye eklendi." }
}

export async function deleteCourthouseAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  try {
    await deleteCourthouse(user, readText(formData, "courthouseId"))
  } catch (error) {
    return actionError(error)
  }
  revalidateAdliye()
  return { ok: true, message: "Adliye silindi." }
}

export async function createCourthouseJobAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  try {
    await createCourthouseJob(user, {
      courthouseId: readText(formData, "courthouseId"),
      kind: readText(formData, "kind"),
      title: readText(formData, "title"),
      description: readText(formData, "description"),
      clientName: readText(formData, "clientName"),
      fileNumber: readText(formData, "fileNumber"),
      dueDate: readText(formData, "dueDate"),
      assigneeId: readText(formData, "assigneeId"),
    })
  } catch (error) {
    return actionError(error)
  }
  revalidateAdliye()
  return { ok: true, message: "Adliye işi atandı." }
}

export async function completeCourthouseJobAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  try {
    await completeCourthouseJob(user, readText(formData, "jobId"))
  } catch (error) {
    return actionError(error)
  }
  revalidateAdliye()
  return { ok: true, message: "İş tamamlandı; tamamlananlara taşındı." }
}

export async function reopenCourthouseJobAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  try {
    await reopenCourthouseJob(user, readText(formData, "jobId"))
  } catch (error) {
    return actionError(error)
  }
  revalidateAdliye()
  return { ok: true, message: "İş yeniden açıldı." }
}

export async function deleteCourthouseJobAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  try {
    await deleteCourthouseJob(user, readText(formData, "jobId"))
  } catch (error) {
    return actionError(error)
  }
  revalidateAdliye()
  return { ok: true, message: "Adliye işi silindi." }
}
