import type { DefaultSession } from "next-auth"
import type { Role } from "@/lib/workflow"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      username: string
      role: Role
      title: string
      passwordUpdatedAt?: string
    } & DefaultSession["user"]
  }

  interface User {
    username: string
    role: Role
    title: string
    passwordUpdatedAt?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    username: string
    role: Role
    title: string
    passwordUpdatedAt?: string
  }
}
