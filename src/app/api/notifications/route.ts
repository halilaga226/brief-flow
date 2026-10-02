import { getSessionUser } from "@/lib/session"
import { listNotifications } from "@/server/tasks"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  const items = await listNotifications(user.id)
  return NextResponse.json({ items })
}
