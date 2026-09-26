import type { NextAuthConfig } from "next-auth"
import { NextResponse } from "next/server"

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
      if (pathname === "/giris") {
        if (loggedIn) {
          const dest = auth?.user?.role === "INTERN" ? "/gorevler" : "/is-listesi"
          return NextResponse.redirect(new URL(dest, request.nextUrl))
        }
        return true
      }
      return loggedIn
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? ""
        token.role = user.role
        token.title = user.title
      }
      return token
    },
    session({ session, token }) {
      session.user.id = typeof token.id === "string" ? token.id : ""
      session.user.role =
        token.role === "ADMIN"
          ? "ADMIN"
          : token.role === "INTERN"
            ? "INTERN"
            : "LAWYER"
      session.user.title = typeof token.title === "string" ? token.title : ""
      return session
    },
  },
} satisfies NextAuthConfig
