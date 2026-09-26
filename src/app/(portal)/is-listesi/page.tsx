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
      <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card px-6 py-12 text-center">
        <h1 className="text-2xl font-semibold">Yetki yok</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          İş listesi yalnızca avukat ve yöneticilere açıktır.
        </p>
        <Button asChild className="mt-5">
          <Link href="/gorevler">Görevlere dön</Link>
        </Button>
      </div>
    )
  }

  const items = await listWorkItems(user)

  return (
    <div className="mx-auto grid max-w-6xl gap-5">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">İş listesi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ajandanız. Kayıt ekleyin, satırdan doğrudan görev verin.
        </p>
      </div>
      <WorkItemAgenda items={items} />
    </div>
  )
}
