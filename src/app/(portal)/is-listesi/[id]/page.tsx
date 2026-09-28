import { WorkItemDetail } from "@/components/portal/work-item-detail"
import { requireUser } from "@/lib/session"
import { canAssignTask, canManageWorkItems } from "@/lib/workflow"
import { getWorkItemDetail } from "@/server/work-items"
import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = { title: "İş detayı" }

export default async function WorkItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireUser()
  const { id } = await params

  if (!canManageWorkItems(user.role)) {
    return (
      <div className="mx-auto max-w-lg px-6 py-12 text-center">
        <h1 className="text-2xl font-semibold">Yetki yok</h1>
        <Button asChild className="mt-5">
          <Link href="/gorevler">Görevlere dön</Link>
        </Button>
      </div>
    )
  }

  const item = await getWorkItemDetail(user, id)
  return <WorkItemDetail item={item} canAssign={canAssignTask(user.role)} />
}
