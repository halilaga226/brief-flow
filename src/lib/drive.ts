import { google } from "googleapis"
import { Readable } from "node:stream"
import { WorkflowError, safeFileName } from "@/lib/workflow"

export type StoredFile = {
  driveFileId: string
  name: string
  mimeType: string
  size: number
  webViewLink: string
  storageMode: "google" | "mock"
}

export type DriveStatus = {
  mode: "google" | "mock"
  reason: string | null
}

export function getDriveStatus(): DriveStatus {
  const hasJson = Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim())
  const hasFolder = Boolean(process.env.GOOGLE_DRIVE_FOLDER_ID?.trim())
  if (hasJson && hasFolder) return { mode: "google", reason: null }
  if (!hasJson && !hasFolder) {
    return {
      mode: "mock",
      reason: "Google Drive kimliği tanımlı değil. Dosya içeriği sunucuda tutulmaz.",
    }
  }
  if (!hasJson) {
    return { mode: "mock", reason: "GOOGLE_SERVICE_ACCOUNT_JSON eksik." }
  }
  return {
    mode: "mock",
    reason: "GOOGLE_DRIVE_FOLDER_ID eksik. Klasörü servis hesabıyla paylaşın.",
  }
}

function readCredentials() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!raw) throw new WorkflowError("Servis hesabı tanımlı değil.")
  try {
    return JSON.parse(raw) as { client_email: string; private_key: string }
  } catch {
    throw new WorkflowError("Servis hesabı JSON biçimi okunamadı.")
  }
}

function driveClient() {
  const credentials = readCredentials()
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/drive"],
  })
  return google.drive({ version: "v3", auth })
}

export async function ensureOfficeFolder() {
  const status = getDriveStatus()
  if (status.mode === "mock") {
    return { id: "mock-folder", name: "Vekalet Evrak", mode: "mock" as const }
  }

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID!.trim()
  const drive = driveClient()
  const found = await drive.files.get({
    fileId: folderId,
    fields: "id, name, mimeType",
    supportsAllDrives: true,
  })
  if (found.data.mimeType !== "application/vnd.google-apps.folder") {
    throw new WorkflowError("GOOGLE_DRIVE_FOLDER_ID bir klasörü göstermiyor.")
  }
  return {
    id: folderId,
    name: found.data.name ?? "Vekalet Evrak",
    mode: "google" as const,
  }
}

export async function uploadToDrive(input: {
  buffer: Buffer
  name: string
  mimeType: string
  /** Avukatın kendi klasörü (isteğe bağlı) */
  folderId?: string | null
}): Promise<StoredFile> {
  const name = safeFileName(input.name)
  const mimeType = input.mimeType || "application/octet-stream"
  const status = getDriveStatus()
  const folderId = (input.folderId?.trim() || process.env.GOOGLE_DRIVE_FOLDER_ID?.trim()) ?? ""

  if (status.mode === "mock" && !folderId) {
    const driveFileId = `mock_${crypto.randomUUID()}`
    return {
      driveFileId,
      name,
      mimeType,
      size: input.buffer.length,
      webViewLink: `/onizleme/dosya/${driveFileId}`,
      storageMode: "mock",
    }
  }

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() || !folderId) {
    const driveFileId = `mock_${crypto.randomUUID()}`
    return {
      driveFileId,
      name,
      mimeType,
      size: input.buffer.length,
      webViewLink: `/onizleme/dosya/${driveFileId}`,
      storageMode: "mock",
    }
  }

  try {
    const drive = driveClient()
    const created = await drive.files.create({
      requestBody: {
        name,
        parents: [folderId],
      },
      media: {
        mimeType,
        body: Readable.from(input.buffer),
      },
      fields: "id, name, mimeType, size, webViewLink",
      supportsAllDrives: true,
    })

    const fileId = created.data.id
    if (!fileId) throw new Error("Drive dosya kimliği boş döndü.")

    const link = await createShareLink(fileId)
    return {
      driveFileId: fileId,
      name: created.data.name ?? name,
      mimeType: created.data.mimeType ?? mimeType,
      size: Number(created.data.size ?? input.buffer.length),
      webViewLink: link,
      storageMode: "google",
    }
  } catch (error) {
    if (error instanceof WorkflowError) throw error
    console.error("Google Drive upload failed", error)
    throw new WorkflowError(
      "Dosya Google Drive'a yüklenemedi. Klasörün servis hesabıyla paylaşıldığını kontrol edin.",
    )
  }
}

export async function createShareLink(fileId: string) {
  const status = getDriveStatus()
  if (status.mode === "mock") return `/onizleme/dosya/${fileId}`

  const drive = driveClient()
  if (process.env.DRIVE_SHARE_MODE === "anyone") {
    try {
      await drive.permissions.create({
        fileId,
        requestBody: { role: "reader", type: "anyone" },
        supportsAllDrives: true,
      })
    } catch (error) {
      console.error("Drive share permission", error)
    }
  }
  const meta = await drive.files.get({
    fileId,
    fields: "webViewLink",
    supportsAllDrives: true,
  })
  return meta.data.webViewLink ?? `https://drive.google.com/file/d/${fileId}/view`
}

export function folderLinkFromId(folderId: string) {
  const id = folderId.trim()
  if (!id) return null
  return `https://drive.google.com/drive/folders/${id}`
}

/** Servis hesabı ile klasörü e-postal listesine okuyucu olarak paylaşır. */
export async function shareFolderWithEmails(folderId: string, emails: string[]) {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim()) {
    return { shared: 0, skipped: emails.length, reason: "Servis hesabı yok" as const }
  }
  const drive = driveClient()
  let shared = 0
  for (const email of emails) {
    const value = email.trim().toLowerCase()
    if (!value || !value.includes("@")) continue
    try {
      await drive.permissions.create({
        fileId: folderId,
        requestBody: { role: "writer", type: "user", emailAddress: value },
        sendNotificationEmail: true,
        supportsAllDrives: true,
      })
      shared += 1
    } catch (error) {
      console.error("Drive share with intern failed", value, error)
    }
  }
  return { shared, skipped: emails.length - shared, reason: null }
}

export async function resolveFolderMeta(folderId: string) {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim()) {
    return {
      id: folderId,
      name: "Drive klasörü",
      link: folderLinkFromId(folderId)!,
      verified: false,
    }
  }
  const drive = driveClient()
  const found = await drive.files.get({
    fileId: folderId,
    fields: "id, name, mimeType, webViewLink",
    supportsAllDrives: true,
  })
  if (found.data.mimeType !== "application/vnd.google-apps.folder") {
    throw new WorkflowError("Girdiğiniz kimlik bir Drive klasörü değil.")
  }
  return {
    id: found.data.id ?? folderId,
    name: found.data.name ?? "Drive klasörü",
    link:
      found.data.webViewLink ??
      folderLinkFromId(folderId)!,
    verified: true,
  }
}

export async function deleteDriveFile(file: StoredFile) {
  if (file.storageMode !== "google") return
  try {
    const drive = driveClient()
    await drive.files.delete({
      fileId: file.driveFileId,
      supportsAllDrives: true,
    })
  } catch (error) {
    console.error("Drive cleanup failed", error)
  }
}
