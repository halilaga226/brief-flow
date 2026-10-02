"use server"

import type { ActionState } from "@/lib/dto"
import { requireUser } from "@/lib/session"
import { WorkflowError } from "@/lib/workflow"
import { importPartiesFromJson } from "@/server/party-import"
import { revalidatePath } from "next/cache"

function actionError(error: unknown): ActionState {
  if (error instanceof WorkflowError) return { error: error.message }
  console.error(error)
  return { error: "İçe aktarım tamamlanamadı." }
}

export async function importPartiesAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser()
  const file = formData.get("file")
  const pasted = String(formData.get("jsonText") ?? "").trim()

  let raw = pasted
  if (file instanceof File && file.size > 0) {
    raw = await file.text()
  }
  if (!raw) return { error: "JSON dosyası veya metin gerekli." }
  if (raw.length > 8_000_000) return { error: "JSON çok büyük (max 8 MB)." }

  try {
    const result = await importPartiesFromJson(user, raw)
    revalidatePath("/muvekkiller")
    revalidatePath("/silinenler")
    const errNote =
      result.errors.length > 0 ? ` · ${result.errors.length} satır hata` : ""
    return {
      ok: true,
      message: `${result.parsed} taraf: ${result.createdClients} yeni müvekkil, ${result.updatedClients} güncellendi, ${result.skipped} aynı (atlandı), ${result.createdFiles} yeni dosya, ${result.updatedFiles} dosya güncellendi${errNote}.`,
    }
  } catch (error) {
    return actionError(error)
  }
}
