import { cache } from "react"
import {
  getDashboard as getDashboardRaw,
  listNotifications as listNotificationsRaw,
  listTasks as listTasksRaw,
} from "@/server/tasks"
import type { SessionUser } from "@/lib/dto"

export const getNotificationsCached = cache(async (userId: string) => {
  return listNotificationsRaw(userId)
})

export const listTasksCached = cache(async (userId: string, role: SessionUser["role"]) => {
  return listTasksRaw(userId, role)
})

export const getDashboardCached = cache(async (userId: string, role: SessionUser["role"]) => {
  return getDashboardRaw(userId, role)
})
