import { getSessionUser, requireUser } from "@/lib/session"
import {
  createOfficeBackup,
  getOfficeBackupPayload,
  restoreOfficeBackup,
} from "@/server/backup"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/** Yedek JSON indir (yönetici). ?id=... veya son yedek. */
export async function GET(request: Request) {
  const user = await getSessionUser()
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  const url = new URL(request.url)
  let snapshotId = url.searchParams.get("id")
  if (!snapshotId) {
    const created = await createOfficeBackup(user, "İndirme yedeği")
    snapshotId = created.snapshotId
  }
  const snap = await getOfficeBackupPayload(user, snapshotId)
  const filename = `atli-karakaya-yedek-${snap.createdAt.slice(0, 10)}.json`
  return new NextResponse(snap.payload, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}

/** Yedek dosyasını yükleyip geri yükle (yönetici). */
export async function POST(request: Request) {
  const user = await requireUser()
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  const contentType = request.headers.get("content-type") ?? ""
  let raw = ""
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData()
    const file = form.get("file")
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Dosya gerekli." }, { status: 400 })
    }
    raw = await file.text()
  } else {
    raw = await request.text()
  }
  try {
    const result = await restoreOfficeBackup(user, raw)
    return NextResponse.json({ ok: true, result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Geri yükleme başarısız."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
