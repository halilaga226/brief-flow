import { auth, signOut } from "@/auth"
import type { SessionUser } from "@/lib/dto"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { cache } from "react"

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth()
  const user = session?.user
  if (!user?.id || (user.role !== "LAWYER" && user.role !== "INTERN" && user.role !== "ADMIN")) {
    return null
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      title: true,
      passwordUpdatedAt: true,
    },
  })
  // Silinen hesap — açık sekme yetkisiz kalır
  if (!dbUser) return null

  const tokenStamp =
    typeof user.passwordUpdatedAt === "string" ? user.passwordUpdatedAt : null
  if (tokenStamp && tokenStamp !== dbUser.passwordUpdatedAt.toISOString()) {
    return null
  }

  return {
    id: dbUser.id,
    name: dbUser.name,
    username: dbUser.username,
    email: dbUser.email ?? "",
    role: dbUser.role,
    title: dbUser.title,
  }
})

export async function requireUser(): Promise<SessionUser> {
  const session = await auth()
  const user = await getSessionUser()
  if (!user) {
    if (session?.user) {
      // Silinen / parola değişmiş oturumu düşür
      await signOut({ redirectTo: "/giris" })
    }
    redirect("/giris")
  }
  return user
}
