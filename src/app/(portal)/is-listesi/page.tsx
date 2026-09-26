import { WorkItemAgenda } from "@/components/portal/work-item-agenda"
import { Button } from "@/components/ui/button"
import { requireUser } from "@/lib/session"
import { canCreateTask } from "@/lib/workflow"
import { listWorkItems } from "@/server/work-items"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "İş listesi" }

export default async function WorkListPage() {
  const user = await requireUser()
  if (!canCreateTask(user.role)) {
    return (
      <div className="glass mx-auto max-w-lg rounded-2xl px-6 py-12 text-center">
        <h1 className="text-2xl font-semibold">Yetki yok</h1>
        <Button asChild className="mt-5">
          <Link href="/gorevler">Görevler</Link>
        </Button>
      </div>
    )
  }

  const items = await listWorkItems(user)

  return (
    <div className="mx-auto grid max-w-6xl gap-5">
      <h1 className="text-3xl font-semibold tracking-tight">İş listesi</h1>
      <WorkItemAgenda items={items} />
    </div>
  )
}
