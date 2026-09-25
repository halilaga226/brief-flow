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
        email: { label: "E-posta", type: "email" },
        password: { label: "Parola", type: "password" },
      },
      async authorize(credentials) {
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string().min(1),
          })
          .safeParse(credentials)
        if (!parsed.success) return null

        try {
          const user = await prisma.user.findUnique({
            where: { email: parsed.data.email.toLowerCase() },
          })
          if (!user) return null
          const ok = await bcrypt.compare(parsed.data.password, user.passwordHash)
          if (!ok) return null
          return {
            id: user.id,
            name: user.name,
            email: user.email,
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
