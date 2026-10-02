import { google } from "googleapis"
import { Readable } from "node:stream"
import { prisma } from "@/lib/prisma"
import { decryptSecret } from "@/lib/secret-box"
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
  serviceEmail: string | null
  folderId: string | null
}

type DriveCredentials = {
  client_email: string
  private_key: string
}

type ResolvedDriveConfig = {
  credentials: DriveCredentials | null
  folderId: string | null
  serviceEmail: string | null
  source: "env" | "db" | "none"
}

let configCache: { at: number; value: ResolvedDriveConfig } | null = null
const CACHE_MS = 15_000

export function invalidateDriveConfigCache() {
  configCache = null
}

async function loadDriveConfig(): Promise<ResolvedDriveConfig> {
  const now = Date.now()
  if (configCache && now - configCache.at < CACHE_MS) return configCache.value

  const envJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() || ""
  const envFolder = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim() || ""
  if (envJson && envFolder) {
    try {
      const credentials = JSON.parse(envJson) as DriveCredentials
      const value: ResolvedDriveConfig = {
        credentials,
        folderId: envFolder,
        serviceEmail: credentials.client_email ?? null,
        source: "env",
      }
      configCache = { at: now, value }
      return value
    } catch {
      /* fall through to db */
    }
  }

  const row = await prisma.officeConfig.findUnique({ where: { id: "office" } })
  if (row?.driveServiceAccountEnc && row.driveFolderId) {
    try {
      const plain = decryptSecret(row.driveServiceAccountEnc)
      const credentials = JSON.parse(plain) as DriveCredentials
      const value: ResolvedDriveConfig = {
        credentials,
        folderId: row.driveFolderId,
        serviceEmail: row.driveServiceEmail || credentials.client_email || null,
        source: "db",
      }
      configCache = { at: now, value }
      return value
    } catch (error) {
      console.error("Drive office config decrypt/parse failed", error)
    }
  }

  const value: ResolvedDriveConfig = {
    credentials: null,
    folderId: row?.driveFolderId ?? (envFolder || null),
    serviceEmail: row?.driveServiceEmail ?? null,
    source: "none",
  }
  configCache = { at: now, value }
  return value
}

export async function getDriveStatus(): Promise<DriveStatus> {
  const config = await loadDriveConfig()
  if (config.credentials && config.folderId) {
    return {
      mode: "google",
      reason: null,
      serviceEmail: config.serviceEmail,
      folderId: config.folderId,
    }
  }
  if (!config.credentials && !config.folderId) {
    return {
      mode: "mock",
      reason: "Google Drive kimliği tanımlı değil. Dosya içeriği sunucuda tutulmaz.",
      serviceEmail: null,
      folderId: null,
    }
  }
  if (!config.credentials) {
    return {
      mode: "mock",
      reason: "Servis hesabı JSON eksik. Halil Ayarlar’dan büro Drive’ını bağlamalı.",
      serviceEmail: config.serviceEmail,
      folderId: config.folderId,
    }
  }
  return {
    mode: "mock",
    reason: "Büro Drive klasör kimliği eksik.",
    serviceEmail: config.serviceEmail,
    folderId: null,
  }
}

export async function getOfficeDriveAdminState() {
  const envSet = Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() &&
      process.env.GOOGLE_DRIVE_FOLDER_ID?.trim(),
  )
  const row = await prisma.officeConfig.findUnique({ where: { id: "office" } })
  const status = await getDriveStatus()
  return {
    envSet,
    folderId: row?.driveFolderId ?? process.env.GOOGLE_DRIVE_FOLDER_ID?.trim() ?? null,
    serviceEmail: status.serviceEmail,
    connected: status.mode === "google",
    reason: status.reason,
    updatedAt: row?.updatedAt?.toISOString() ?? null,
  }
}

async function readCredentials() {
  const config = await loadDriveConfig()
  if (!config.credentials) throw new WorkflowError("Servis hesabı tanımlı değil.")
  return config.credentials
}

async function driveClient() {
  const credentials = await readCredentials()
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/drive"],
  })
  return google.drive({ version: "v3", auth })
}

export async function ensureOfficeFolder() {
  const status = await getDriveStatus()
  if (status.mode === "mock") {
    return { id: "mock-folder", name: "Vekalet Evrak", mode: "mock" as const }
  }

  const config = await loadDriveConfig()
  const folderId = config.folderId!
  const drive = await driveClient()
  const found = await drive.files.get({
    fileId: folderId,
    fields: "id, name, mimeType",
    supportsAllDrives: true,
  })
  if (found.data.mimeType !== "application/vnd.google-apps.folder") {
    throw new WorkflowError("Büro Drive klasör kimliği bir klasörü göstermiyor.")
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
  const status = await getDriveStatus()
  const config = await loadDriveConfig()
  const folderId = (input.folderId?.trim() || config.folderId || "") ?? ""

  if (status.mode === "mock" || !config.credentials || !folderId) {
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
    const drive = await driveClient()
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
  const status = await getDriveStatus()
  if (status.mode === "mock") return `/onizleme/dosya/${fileId}`

  const drive = await driveClient()
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

/** Servis hesabı ile klasörü e-posta listesine yazıcı olarak paylaşır. */
export async function shareFolderWithEmails(folderId: string, emails: string[]) {
  const config = await loadDriveConfig()
  if (!config.credentials) {
    return { shared: 0, skipped: emails.length, reason: "Servis hesabı yok" as const }
  }
  const drive = await driveClient()
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
  const config = await loadDriveConfig()
  if (!config.credentials) {
    return {
      id: folderId,
      name: "Drive klasörü",
      link: folderLinkFromId(folderId)!,
      verified: false,
    }
  }
  const drive = await driveClient()
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
    link: found.data.webViewLink ?? folderLinkFromId(folderId)!,
    verified: true,
  }
}

export async function testOfficeDriveConnection(folderId: string, serviceAccountJson: string) {
  let credentials: DriveCredentials
  try {
    credentials = JSON.parse(serviceAccountJson) as DriveCredentials
  } catch {
    throw new WorkflowError("Servis hesabı JSON biçimi okunamadı.")
  }
  if (!credentials.client_email || !credentials.private_key) {
    throw new WorkflowError("JSON içinde client_email ve private_key olmalı.")
  }
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/drive"],
  })
  const drive = google.drive({ version: "v3", auth })
  const found = await drive.files.get({
    fileId: folderId.trim(),
    fields: "id, name, mimeType",
    supportsAllDrives: true,
  })
  if (found.data.mimeType !== "application/vnd.google-apps.folder") {
    throw new WorkflowError("Klasör kimliği bir Drive klasörüne ait değil.")
  }
  return {
    folderId: found.data.id ?? folderId.trim(),
    folderName: found.data.name ?? "Drive klasörü",
    serviceEmail: credentials.client_email,
  }
}

export async function deleteDriveFile(file: StoredFile) {
  if (file.storageMode !== "google") return
  try {
    const drive = await driveClient()
    await drive.files.delete({
      fileId: file.driveFileId,
      supportsAllDrives: true,
    })
  } catch (error) {
    console.error("Drive cleanup failed", error)
  }
}
