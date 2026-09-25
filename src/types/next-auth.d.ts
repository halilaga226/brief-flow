import type { DefaultSession } from "next-auth"
import type { Role } from "@/lib/workflow"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role
      title: string
    } & DefaultSession["user"]
  }

  interface User {
    role: Role
    title: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: Role
    title: string
  }
}
