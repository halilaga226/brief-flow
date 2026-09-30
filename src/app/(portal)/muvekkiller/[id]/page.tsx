import { ClientDetailView } from "@/components/portal/clients-view"
import { Button } from "@/components/ui/button"
import { requireUser } from "@/lib/session"
import { canCreateTask } from "@/lib/workflow"
import { getClientWithFiles } from "@/server/clients"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Müvekkil" }
export const dynamic = "force-dynamic"

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  const { id } = await params
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
  const client = await getClientWithFiles(user, id)
  return <ClientDetailView client={client} />
}
