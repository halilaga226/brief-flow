"use server"

import { signOut } from "@/auth"
import { requireUser } from "@/lib/session"
import { markAllRead, markTaskRead } from "@/server/tasks"
import { revalidatePath } from "next/cache"

export async function signOutAction() {
  await signOut({ redirectTo: "/giris" })
}

export async function markTaskReadAction(taskId: string) {
  const user = await requireUser()
  const count = await markTaskRead(user.id, taskId, user.role)
  if (count > 0) {
    revalidatePath("/ayarlar")
    revalidatePath("/gorevler")
  }
  return count
}

export async function markAllReadAction() {
  const user = await requireUser()
  await markAllRead(user.id)
  revalidatePath("/ayarlar")
  revalidatePath("/gorevler")
}
