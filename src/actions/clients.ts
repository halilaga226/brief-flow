"use server"

import type { ActionState } from "@/lib/dto"
import { requireUser } from "@/lib/session"
import { WorkflowError } from "@/lib/workflow"
import {
  createCaseFile,
  createClient,
} from "@/server/clients"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

function readText(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === "string" ? value : ""
}

function actionError(error: unknown): ActionState {
  if (error instanceof WorkflowError) return { error: error.message }
  console.error(error)
  return { error: "İşlem tamamlanamadı." }
}

export async function createClientAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  try {
    const created = await createClient(user, readText(formData, "name"))
    revalidatePath("/muvekkiller")
    redirect(`/muvekkiller/${created.id}`)
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error
    return actionError(error)
  }
}

export async function createCaseFileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  const clientId = readText(formData, "clientId")
  try {
    const created = await createCaseFile(user, clientId, {
      fileNumber: readText(formData, "fileNumber"),
      courtName: readText(formData, "courtName"),
      notes: readText(formData, "notes"),
    })
    revalidatePath("/muvekkiller")
    revalidatePath(`/muvekkiller/${clientId}`)
    redirect(`/muvekkiller/${clientId}/dosya/${created.id}`)
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error
    return actionError(error)
  }
}

export async function saveDriveFolderAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  if (user.role !== "LAWYER" && user.role !== "ADMIN") {
    return { error: "Yalnızca avukat Drive bağlayabilir." }
  }
  const folderId = readText(formData, "driveFolderId").trim()
  try {
    const { prisma } = await import("@/lib/prisma")
    await prisma.user.update({
      where: { id: user.id },
      data: {
        driveFolderId: folderId || null,
        driveConnectedAt: folderId ? new Date() : null,
      },
    })
  } catch (error) {
    return actionError(error)
  }
  revalidatePath("/ayarlar")
  return {
    ok: true,
    message: folderId
      ? "Drive klasörü kaydedildi. Ortak servis hesabı klasörü Düzenleyici olarak paylaşılmış olmalı."
      : "Drive klasörü kaldırıldı.",
  }
}
