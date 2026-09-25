import { auth } from "@/auth"
import type { SessionUser } from "@/lib/dto"
import { redirect } from "next/navigation"

export async function requireUser(): Promise<SessionUser> {
  const session = await auth()
  const user = session?.user
  if (!user?.id || (user.role !== "LAWYER" && user.role !== "INTERN")) {
    redirect("/giris")
  }
  return {
    id: user.id,
    name: user.name ?? "Kullanıcı",
    email: user.email ?? "",
    role: user.role,
    title: user.title ?? "",
  }
}
