import { UsersManager } from "@/components/portal/users-manager"
import { Button } from "@/components/ui/button"
import { requireUser } from "@/lib/session"
import { canManageUsers } from "@/lib/workflow"
import { listManagedUsers } from "@/server/users"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Kullanıcılar" }

export default async function UsersPage() {
  const user = await requireUser()
  if (!canManageUsers(user.role)) {
    return (
      <div className="mx-auto max-w-lg rounded-xl bg-card px-6 py-12 text-center ring-1 ring-foreground/10">
        <h1 className="text-3xl font-semibold tracking-tight">Yetki yok</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Kullanıcı ekleme ve silme yalnızca avukatlara açıktır.
        </p>
        <Button asChild className="mt-5 bg-[#16324f]">
          <Link href="/panel">Panele dön</Link>
        </Button>
      </div>
    )
  }

  const users = await listManagedUsers(user)
  return (
    <div className="mx-auto grid max-w-3xl gap-5">
      <div>
        <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Büro</p>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Kullanıcılar</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Avukat ve stajyer hesaplarını buradan açın. Görev atarken yalnızca bu listedekiler görünür.
        </p>
      </div>
      <UsersManager users={users} />
    </div>
  )
}
