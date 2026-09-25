import { PasswordForm } from "@/components/portal/password-form"
import { requireUser } from "@/lib/session"
import { roleLabel } from "@/lib/workflow"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Hesabım" }

export default async function AccountPage() {
  const user = await requireUser()
  return (
    <div className="mx-auto grid max-w-3xl gap-5">
      <div>
        <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Hesap</p>
        <h1 className="font-serif text-3xl md:text-4xl">{user.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {user.title || roleLabel(user.role)} · {user.email}
        </p>
      </div>
      <PasswordForm />
    </div>
  )
}
