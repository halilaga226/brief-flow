import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/giris",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl
      const loggedIn = Boolean(auth?.user)
      if (pathname.startsWith("/api/auth")) return true
      // Vercel Cron; route içinde CRON_SECRET ile korunur
      if (pathname.startsWith("/api/cron")) return true
      if (pathname === "/giris") {
        return true
      }
      return loggedIn
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? ""
        token.username = user.username
        token.role = user.role
        token.title = user.title
        token.passwordUpdatedAt = user.passwordUpdatedAt
      }
      return token
    },
    session({ session, token }) {
      session.user.id = typeof token.id === "string" ? token.id : ""
      session.user.username =
        typeof token.username === "string" ? token.username : ""
      session.user.role =
        token.role === "ADMIN"
          ? "ADMIN"
          : token.role === "INTERN"
            ? "INTERN"
            : "LAWYER"
      session.user.title = typeof token.title === "string" ? token.title : ""
      session.user.passwordUpdatedAt =
        typeof token.passwordUpdatedAt === "string"
          ? token.passwordUpdatedAt
          : undefined
      return session
    },
  },
} satisfies NextAuthConfig
