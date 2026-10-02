import { isBackupAgentAuthorized } from "@/lib/backup-agent-auth"
import { prisma } from "@/lib/prisma"
import {
  OFFICE_BACKUP_KIND,
  createOfficeBackup,
  getOfficeBackupPayload,
  restoreOfficeBackup,
} from "@/server/backup"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const maxDuration = 60

async function agentActor() {
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
      name: true,
      username: true,
      title: true,
      email: true,
    },
  })
  if (!admin) return null
  return {
    id: admin.id,
    name: admin.name,
    username: admin.username,
    email: admin.email ?? "",
    role: "ADMIN" as const,
    title: admin.title,
  }
}

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 })
}

/** Masaüstü ajan: liste veya JSON yedek indir. */
export async function GET(request: Request) {
  if (!isBackupAgentAuthorized(request)) return unauthorized()

  const url = new URL(request.url)
  if (url.searchParams.get("list") === "1") {
    const rows = await prisma.dataSnapshot.findMany({
      where: { kind: OFFICE_BACKUP_KIND },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        label: true,
        createdAt: true,
        restoredAt: true,
      },
    })
    return NextResponse.json({
      ok: true,
      backups: rows.map((row) => ({
        id: row.id,
        label: row.label,
        createdAt: row.createdAt.toISOString(),
        restoredAt: row.restoredAt?.toISOString() ?? null,
      })),
    })
  }

  const actor = await agentActor()
  if (!actor) {
    return NextResponse.json({ error: "admin yok" }, { status: 500 })
  }

  let snapshotId = url.searchParams.get("id")
  if (!snapshotId) {
    const created = await createOfficeBackup(actor, "Masaüstü ajan yedeği")
    snapshotId = created.snapshotId
  }

  const snap = await getOfficeBackupPayload(actor, snapshotId)
  const filename = `atli-karakaya-yedek-${snap.createdAt.slice(0, 10)}.json`
  return new NextResponse(snap.payload, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Backup-Id": snap.id,
      "X-Backup-Created-At": snap.createdAt,
      "Cache-Control": "no-store",
    },
  })
}

/** Masaüstü ajan: yerel JSON’u siteye geri yükle. */
export async function POST(request: Request) {
  if (!isBackupAgentAuthorized(request)) return unauthorized()

  const actor = await agentActor()
  if (!actor) {
    return NextResponse.json({ error: "admin yok" }, { status: 500 })
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
    const result = await restoreOfficeBackup(actor, raw)
    return NextResponse.json({ ok: true, result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Geri yükleme başarısız."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
