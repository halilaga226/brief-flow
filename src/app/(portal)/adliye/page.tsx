import { CourthouseBoard } from "@/components/portal/courthouse-board"
import { requireUser } from "@/lib/session"
import {
  canAssignCourthouseJob,
  canCompleteCourthouseJob,
  canManageCourthouses,
  canReopenCourthouseJob,
} from "@/lib/workflow"
import { listCourthouseJobs, listCourthouses } from "@/server/courthouses"
import { prisma } from "@/lib/prisma"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Adliyedeki işler" }
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function CourthousePage() {
  const user = await requireUser()
  const canAssign = canAssignCourthouseJob(user.role)
  const canManageCourts = canManageCourthouses(user.role)
  const canComplete = canCompleteCourthouseJob({ completedAt: null }, user.role)
  const canReopen = canReopenCourthouseJob(user.role)

  const [courthouses, jobs, internRows] = await Promise.all([
    listCourthouses(),
    listCourthouseJobs(),
    canAssign
      ? prisma.user.findMany({
          where: { role: "INTERN" },
          orderBy: { name: "asc" },
          select: { id: true, name: true, title: true, role: true, email: true },
        })
      : Promise.resolve([]),
  ])

  const interns = internRows.map((row) => ({
    id: row.id,
    name: row.name,
    title: row.title,
    role: row.role,
    email: row.email ?? "",
  }))

  return (
    <div className="mx-auto w-full max-w-[80rem] space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Adliyedeki işler</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Adliyede görüşme ve işlemler. Stajyer adliyede açık işlerin tamamını görür; biten iş
          listeden kalkıp tamamlananlara düşer.
        </p>
      </div>
      <CourthouseBoard
        courthouses={courthouses}
        jobs={jobs}
        interns={interns}
        canAssign={canAssign}
        canManageCourts={canManageCourts}
        canComplete={canComplete}
        canReopen={canReopen}
        currentUserId={user.id}
      />
    </div>
  )
}
