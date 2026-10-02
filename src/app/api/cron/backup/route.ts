import { isCronAuthorized } from "@/lib/cron-auth"
import { prisma } from "@/lib/prisma"
import { createOfficeBackup } from "@/server/backup"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/** Vercel Cron: günlük otomatik yedek. CRON_SECRET ile korunur. */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true },
  })
  if (!admin) {
    return NextResponse.json({ error: "admin yok" }, { status: 500 })
  }

  const result = await createOfficeBackup(
    { id: admin.id, role: "ADMIN" },
    `Otomatik günlük yedek · ${new Date().toISOString().slice(0, 10)}`,
  )
  return NextResponse.json({
    ok: true,
    snapshotId: result.snapshotId,
    counts: result.counts,
  })
}
