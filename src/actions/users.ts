"use server"

import type { ActionState } from "@/lib/dto"
import { requireUser } from "@/lib/session"
import { WorkflowError } from "@/lib/workflow"
import {
  changeOwnPassword,
  createOfficeUser,
  deleteOfficeUser,
  resetOfficePassword,
} from "@/server/users"
import { revalidatePath } from "next/cache"

function actionError(error: unknown): ActionState {
  if (error instanceof WorkflowError) return { error: error.message }
  console.error(error)
  return { error: "İşlem tamamlanamadı. Lütfen yeniden deneyin." }
}

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "")
}

export async function createUserAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireUser()
  try {
    const created = await createOfficeUser(actor, {
      name: readText(formData, "name"),
      email: readText(formData, "email"),
      title: readText(formData, "title"),
      role: readText(formData, "role"),
      password: readText(formData, "password"),
    })
    revalidatePath("/kullanicilar")
    revalidatePath("/gorevler/yeni")
    return {
      ok: true,
      message: `${created.name} eklendi. Giriş: ${created.email}`,
    }
  } catch (error) {
    return actionError(error)
  }
}

export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireUser()
  try {
    const result = await resetOfficePassword(
      actor,
      readText(formData, "userId"),
      readText(formData, "password"),
    )
    revalidatePath("/kullanicilar")
    return {
      ok: true,
      message: `${result.name} için yeni parola kaydedildi.`,
    }
  } catch (error) {
    return actionError(error)
  }
}

export async function deleteUserAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireUser()
  try {
    const result = await deleteOfficeUser(actor, readText(formData, "userId"))
    revalidatePath("/kullanicilar")
    revalidatePath("/gorevler/yeni")
    return { ok: true, message: `${result.name} silindi.` }
  } catch (error) {
    return actionError(error)
  }
}

export async function changePasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireUser()
  try {
    await changeOwnPassword(
      actor,
      readText(formData, "currentPassword"),
      readText(formData, "nextPassword"),
    )
    revalidatePath("/ayarlar")
    return { ok: true, message: "Parolanız güncellendi." }
  } catch (error) {
    return actionError(error)
  }
}
