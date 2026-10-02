"use server"

import type { ActionState } from "@/lib/dto"
import {
  getOfficeDriveAdminState,
  invalidateDriveConfigCache,
  testOfficeDriveConnection,
} from "@/lib/drive"
import { prisma } from "@/lib/prisma"
import { encryptSecret } from "@/lib/secret-box"
import { requireUser } from "@/lib/session"
import { assertPasswordAdmin } from "@/lib/users"
import { WorkflowError } from "@/lib/workflow"
import { revalidatePath } from "next/cache"

function actionError(error: unknown): ActionState {
  if (error instanceof WorkflowError) return { error: error.message }
  console.error(error)
  return { error: "İşlem tamamlanamadı." }
}

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "")
}

export async function saveOfficeDriveAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  try {
    assertPasswordAdmin(user.username)
  } catch (error) {
    return actionError(error)
  }

  const folderId = readText(formData, "driveFolderId").trim()
  const rawJson = readText(formData, "serviceAccountJson").trim()
  const clear = readText(formData, "clearDrive") === "1"

  try {
    if (clear) {
      await prisma.officeConfig.upsert({
        where: { id: "office" },
        create: {
          id: "office",
          driveServiceAccountEnc: null,
          driveFolderId: null,
          driveServiceEmail: null,
          updatedById: user.id,
        },
        update: {
          driveServiceAccountEnc: null,
          driveFolderId: null,
          driveServiceEmail: null,
          updatedById: user.id,
        },
      })
      invalidateDriveConfigCache()
      revalidatePath("/ayarlar")
      return { ok: true, message: "Büro Drive bağlantısı kaldırıldı." }
    }

    if (!folderId) {
      return { error: "Drive klasör kimliği gerekli." }
    }

    const existing = await prisma.officeConfig.findUnique({ where: { id: "office" } })
    let serviceAccountJson = rawJson
    if (!serviceAccountJson && existing?.driveServiceAccountEnc) {
      // Keep existing encrypted credentials; only re-test with new folder if JSON omitted
      const { decryptSecret } = await import("@/lib/secret-box")
      serviceAccountJson = decryptSecret(existing.driveServiceAccountEnc)
    }
    if (!serviceAccountJson) {
      return { error: "Servis hesabı JSON gerekli (ilk kurulumda)." }
    }

    const tested = await testOfficeDriveConnection(folderId, serviceAccountJson)
    await prisma.officeConfig.upsert({
      where: { id: "office" },
      create: {
        id: "office",
        driveServiceAccountEnc: encryptSecret(serviceAccountJson),
        driveFolderId: tested.folderId,
        driveServiceEmail: tested.serviceEmail,
        updatedById: user.id,
      },
      update: {
        driveServiceAccountEnc: encryptSecret(serviceAccountJson),
        driveFolderId: tested.folderId,
        driveServiceEmail: tested.serviceEmail,
        updatedById: user.id,
      },
    })
    invalidateDriveConfigCache()
    revalidatePath("/ayarlar")
    return {
      ok: true,
      message: `Büro Drive bağlandı: ${tested.folderName} (${tested.serviceEmail})`,
    }
  } catch (error) {
    return actionError(error)
  }
}

export async function getOfficeDriveStateAction(): Promise<
  Awaited<ReturnType<typeof getOfficeDriveAdminState>>
> {
  return getOfficeDriveAdminState()
}
