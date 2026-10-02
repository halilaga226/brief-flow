import { ClientsView } from "@/components/portal/clients-view"
import { PartyImportForm } from "@/components/portal/party-import-form"
import { requireUser } from "@/lib/session"
import { canResetPasswords } from "@/lib/users"
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
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      {canResetPasswords(user.username) ? <PartyImportForm /> : null}
      <ClientsView clients={clients} />
    </div>
  )
}
