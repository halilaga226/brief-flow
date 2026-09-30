import { ClientsView } from "@/components/portal/clients-view"
import { requireUser } from "@/lib/session"
import { canCreateTask } from "@/lib/workflow"
import { listClients } from "@/server/clients"
import { Button } from "@/components/ui/button"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Müvekkiller" }
export const dynamic = "force-dynamic"

export default async function ClientsPage() {
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
  const clients = await listClients(user)
  return <ClientsView clients={clients} />
}
