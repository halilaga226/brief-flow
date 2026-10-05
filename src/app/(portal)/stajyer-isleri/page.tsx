import { TaskWorkList } from "@/components/portal/task-work-list"
import { WorkItemAgenda } from "@/components/portal/work-item-agenda"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { requireUser } from "@/lib/session"
import { canAssignTask, canCreateTask } from "@/lib/workflow"
import { listTasksCached } from "@/server/cached"
import {
  listInternsForWorkView,
  listWorkItems,
} from "@/server/work-items"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Stajyer işleri" }
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function InternWorkPage({
  searchParams,
}: {
  searchParams: Promise<{ stajyer?: string }>
}) {
  const user = await requireUser()

  if (!canCreateTask(user.role)) {
    return (
      <div className="mx-auto max-w-lg px-6 py-12 text-center">
        <h1 className="text-2xl font-semibold">Yetki yok</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Stajyer iş listeleri yalnızca avukat ve yöneticilere açıktır. Herkes yalnızca kendi
          listesini görür.
        </p>
        <Button asChild className="mt-5">
          <Link href="/is-listesi">İş listesine dön</Link>
        </Button>
      </div>
    )
  }

  const params = await searchParams
  const canAssign = canAssignTask(user.role)
  const [interns, tasks] = await Promise.all([
    listInternsForWorkView(user),
    listTasksCached(user.id, user.role),
  ])

  const selectedId =
    params.stajyer && interns.some((person) => person.id === params.stajyer)
      ? params.stajyer
      : (interns[0]?.id ?? null)

  const selected = interns.find((person) => person.id === selectedId) ?? null
  const workItems = selectedId
    ? await listWorkItems(user, "intern", selectedId)
    : []

  const internTasks = tasks
    .filter((task) => task.assigneeRole === "INTERN")
    .filter((task) => (selectedId ? task.assigneeId === selectedId : true))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  return (
    <div className="mx-auto w-full max-w-[80rem] space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Stajyer işleri</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Stajyerlerin kişisel iş listelerini ve görev aşamalarını görün. Müdahale yalnızca sizin
            atadığınız kayıtlarda mümkündür.
          </p>
        </div>
        {selected ? (
          <span className="text-sm text-muted-foreground tabular-nums">
            {selected.workItemCount} kişisel · {selected.openTaskCount} açık görev
          </span>
        ) : null}
      </div>

      {interns.length === 0 ? (
        <p className="border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          Henüz stajyer hesabı yok.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {interns.map((person) => {
              const active = person.id === selectedId
              return (
                <Link
                  key={person.id}
                  href={`/stajyer-isleri?stajyer=${person.id}`}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm ring-1 transition",
                    active
                      ? "bg-primary font-semibold text-primary-foreground ring-primary"
                      : "bg-card font-medium text-foreground ring-border hover:bg-muted",
                  )}
                >
                  {person.name}
                  <span className="ml-1.5 opacity-70 tabular-nums">
                    ({person.openTaskCount})
                  </span>
                </Link>
              )
            })}
          </div>

          {selected ? (
            <>
              <section className="space-y-3">
                <div>
                  <h2 className="text-base font-semibold">
                    {selected.name} — kişisel iş listesi
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Stajyerin kendi eklediği kayıtlar ve aşamaları.
                  </p>
                </div>
                <WorkItemAgenda
                  items={workItems}
                  canCreate={false}
                  canAssign={false}
                  currentUserId={user.id}
                  showOwner
                  emptyMessage={`${selected.name} henüz kişisel iş eklememiş.`}
                />
              </section>

              <section className="space-y-3">
                <div>
                  <h2 className="text-base font-semibold">Atanan görevler / aşama</h2>
                  <p className="text-sm text-muted-foreground">
                    Bu stajyere atanmış görevler — ne alemde, hangi aşamada.
                  </p>
                </div>
                <TaskWorkList
                  tasks={internTasks}
                  canAssign={canAssign}
                  userId={user.id}
                  actOnlyOwnAssignments
                />
              </section>
            </>
          ) : null}
        </>
      )}
    </div>
  )
}
