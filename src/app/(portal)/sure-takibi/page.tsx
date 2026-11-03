import { DurationBoard } from "@/components/portal/duration-board"
import { requireUser } from "@/lib/session"
import { listTasksCached } from "@/server/cached"
import { listCourthouseJobs } from "@/server/courthouses"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Süre takibi" }
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function DurationPage() {
  const user = await requireUser()
  const [tasks, jobs] = await Promise.all([
    listTasksCached(user.id, user.role),
    listCourthouseJobs(),
  ])

  return (
    <div className="mx-auto w-full max-w-[80rem] space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Süre takibi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          İşlerin son günü, kalan süre ve ne kadar süredir açık olduğu. Gecikenler en üstte.
        </p>
      </div>
      <DurationBoard tasks={tasks} courthouseJobs={jobs} />
    </div>
  )
}
