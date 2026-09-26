import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { authConfig } from "@/auth.config"
import { prisma } from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Kullanıcı adı", type: "text" },
        password: { label: "Parola", type: "password" },
      },
      async authorize(credentials) {
        const parsed = z
          .object({
            username: z.string().trim().min(3).max(32),
            password: z.string().min(1),
          })
          .safeParse(credentials)
        if (!parsed.success) return null

        try {
          const username = parsed.data.username.toLowerCase()
          const user = await prisma.user.findUnique({
            where: { username },
          })
          if (!user) return null
          const ok = await bcrypt.compare(parsed.data.password, user.passwordHash)
          if (!ok) return null
          return {
            id: user.id,
            name: user.name,
            email: user.email ?? `${user.username}@local`,
            role: user.role,
            title: user.title,
          }
        } catch (error) {
          console.error("Authorize failed", error)
          return null
        }
      },
    }),
  ],
})
