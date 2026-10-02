import { ClientDetailView } from "@/components/portal/clients-view"
import { requireUser } from "@/lib/session"
import { getClientWithFiles, listClientNotes } from "@/server/clients"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Müvekkil" }
export const dynamic = "force-dynamic"

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  const { id } = await params
  const [client, notes] = await Promise.all([
    getClientWithFiles(user, id),
    listClientNotes(user, id),
  ])
  return <ClientDetailView client={client} notes={notes} />
}
