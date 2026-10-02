"use server"

import type { ActionState } from "@/lib/dto"
import { folderLinkFromId, resolveFolderMeta, shareFolderWithEmails } from "@/lib/drive"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/session"
import { WorkflowError } from "@/lib/workflow"
import {
  createCaseFile,
  createClient,
  addClientNote,
  deleteClientNote,
  restoreCaseFile,
  restoreClient,
  restoreTask,
  softDeleteCaseFile,
  softDeleteClient,
  updateCaseFile,
  updateClient,
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

export async function updateClientAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  const clientId = readText(formData, "clientId")
  try {
    await updateClient(user, clientId, readText(formData, "name"))
  } catch (error) {
    return actionError(error)
  }
  revalidatePath("/muvekkiller")
  revalidatePath(`/muvekkiller/${clientId}`)
  return { ok: true, message: "Müvekkil güncellendi." }
}

export async function deleteClientAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  try {
    await softDeleteClient(user, readText(formData, "clientId"))
  } catch (error) {
    return actionError(error)
  }
  revalidatePath("/muvekkiller")
  revalidatePath("/silinenler")
  redirect("/muvekkiller")
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

export async function updateCaseFileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  const clientId = readText(formData, "clientId")
  const caseFileId = readText(formData, "caseFileId")
  try {
    await updateCaseFile(user, caseFileId, {
      fileNumber: readText(formData, "fileNumber"),
      courtName: readText(formData, "courtName"),
      notes: readText(formData, "notes"),
    })
  } catch (error) {
    return actionError(error)
  }
  revalidatePath("/muvekkiller")
  revalidatePath(`/muvekkiller/${clientId}`)
  revalidatePath(`/muvekkiller/${clientId}/dosya/${caseFileId}`)
  return { ok: true, message: "Dosya güncellendi." }
}

export async function deleteCaseFileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  const clientId = readText(formData, "clientId")
  try {
    await softDeleteCaseFile(user, readText(formData, "caseFileId"))
  } catch (error) {
    return actionError(error)
  }
  revalidatePath("/muvekkiller")
  revalidatePath(`/muvekkiller/${clientId}`)
  revalidatePath("/silinenler")
  redirect(`/muvekkiller/${clientId}`)
}

export async function restoreClientAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  try {
    await restoreClient(user, readText(formData, "clientId"))
  } catch (error) {
    return actionError(error)
  }
  revalidatePath("/muvekkiller")
  revalidatePath("/silinenler")
  return { ok: true, message: "Müvekkil geri yüklendi." }
}

export async function restoreCaseFileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  try {
    await restoreCaseFile(user, readText(formData, "caseFileId"))
  } catch (error) {
    return actionError(error)
  }
  revalidatePath("/muvekkiller")
  revalidatePath("/silinenler")
  return { ok: true, message: "Dosya geri yüklendi." }
}

export async function restoreTaskAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  try {
    await restoreTask(user, readText(formData, "taskId"))
  } catch (error) {
    return actionError(error)
  }
  revalidatePath("/gorevler")
  revalidatePath("/is-listesi")
  revalidatePath("/silinenler")
  return { ok: true, message: "İş geri yüklendi." }
}

export async function addClientNoteAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  const clientId = readText(formData, "clientId")
  try {
    await addClientNote(user, clientId, readText(formData, "body"))
  } catch (error) {
    return actionError(error)
  }
  revalidatePath(`/muvekkiller/${clientId}`)
  return { ok: true, message: "Not eklendi." }
}

export async function deleteClientNoteAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  try {
    const clientId = await deleteClientNote(user, readText(formData, "noteId"))
    revalidatePath(`/muvekkiller/${clientId}`)
  } catch (error) {
    return actionError(error)
  }
  return { ok: true, message: "Not silindi." }
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
  const shareInterns = readText(formData, "shareInterns") === "1"

  try {
    if (!folderId) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          driveFolderId: null,
          driveFolderLink: null,
          driveConnectedAt: null,
        },
      })
      revalidatePath("/ayarlar")
      return { ok: true, message: "Drive klasörü kaldırıldı." }
    }

    const meta = await resolveFolderMeta(folderId)
    let shareNote = ""
    if (shareInterns) {
      const interns = await prisma.user.findMany({
        where: { role: "INTERN", email: { not: null } },
        select: { email: true, name: true },
      })
      const emails = interns.map((row) => row.email!).filter(Boolean)
      const result = await shareFolderWithEmails(meta.id, emails)
      shareNote =
        result.reason === "Servis hesabı yok"
          ? " Klasör kaydedildi; otomatik paylaşım için büro Drive API gerekir — bağlantıyı stajyerlere elle iletin."
          : ` ${result.shared} stajyere yazma erişimi verildi.`
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        driveFolderId: meta.id,
        driveFolderLink: meta.link || folderLinkFromId(meta.id),
        driveConnectedAt: new Date(),
      },
    })
    revalidatePath("/ayarlar")
    return {
      ok: true,
      message: `Drive klasörü bağlandı (${meta.name}).${shareNote}`,
    }
  } catch (error) {
    return actionError(error)
  }
}
