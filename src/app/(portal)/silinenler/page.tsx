import { TrashRestoreList } from "@/components/portal/trash-view"
import { Button } from "@/components/ui/button"
import { requireUser } from "@/lib/session"
import { canCreateTask } from "@/lib/workflow"
import { listDeletedItems } from "@/server/clients"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Silinenler" }
export const dynamic = "force-dynamic"

export default async function TrashPage() {
  const user = await requireUser()
  if (!canCreateTask(user.role)) {
    return (
      <div className="mx-auto max-w-lg px-6 py-12 text-center">
        <h1 className="text-2xl font-semibold">Yetki yok</h1>
        <Button asChild className="mt-5">
          <Link href="/is-listesi">İş listesi</Link>
        </Button>
      </div>
    )
  }

  const items = await listDeletedItems(user)
  return <TrashRestoreList items={items} />
}
