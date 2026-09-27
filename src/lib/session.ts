import { auth } from "@/auth"
import type { SessionUser } from "@/lib/dto"
import { redirect } from "next/navigation"
import { cache } from "react"

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth()
  const user = session?.user
  if (!user?.id || (user.role !== "LAWYER" && user.role !== "INTERN" && user.role !== "ADMIN")) {
    return null
  }
  return {
    id: user.id,
    name: user.name ?? "Kullanıcı",
    email: user.email ?? "",
    role: user.role,
    title: user.title ?? "",
  }
})

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) redirect("/giris")
  return user
}
