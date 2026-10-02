import { ClientsView } from "@/components/portal/clients-view"
import { PartyImportForm } from "@/components/portal/party-import-form"
import { requireUser } from "@/lib/session"
import { canResetPasswords } from "@/lib/users"
import { canCreateTask } from "@/lib/workflow"
import { listClients } from "@/server/clients"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Müvekkiller" }
export const dynamic = "force-dynamic"

export default async function ClientsPage() {
  const user = await requireUser()
  const canManage = canCreateTask(user.role)
  const clients = await listClients(user)
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      {canResetPasswords(user.username) ? <PartyImportForm /> : null}
      <ClientsView clients={clients} canManage={canManage} />
    </div>
  )
}
