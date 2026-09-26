import { TaskBoard } from "@/components/portal/task-board"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { requireUser } from "@/lib/session"
import {
  canCreateTask,
  matchesFilter,
  matchesQuery,
  parseFilter,
  parseView,
  type TaskFilter,
  type TaskView,
} from "@/lib/workflow"
import { listTasks } from "@/server/tasks"
import { LayoutGrid, List, Search } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Görevler" }

const filterLabels: { id: TaskFilter; label: string }[] = [
  { id: "tum", label: "Tümü" },
  { id: "bekleyen", label: "Sizden beklenen" },
  { id: "geciken", label: "Geciken" },
  { id: "yaklasan", label: "Yaklaşan" },
  { id: "inceleme", label: "İnceleme" },
  { id: "tamam", label: "Tamamlanan" },
]

function hrefFor(params: { q?: string; filtre?: TaskFilter; gorunum?: TaskView }) {
  const search = new URLSearchParams()
  if (params.q) search.set("q", params.q)
  if (params.filtre && params.filtre !== "tum") search.set("filtre", params.filtre)
  if (params.gorunum === "liste") search.set("gorunum", "liste")
  const value = search.toString()
  return value ? `/gorevler?${value}` : "/gorevler"
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filtre?: string; gorunum?: string }>
}) {
  const user = await requireUser()
  const params = await searchParams
  const query = params.q ?? ""
  const filter = parseFilter(params.filtre)
  const view = parseView(params.gorunum)
  const tasks = await listTasks(user.id, user.role)
  const visible = tasks.filter((task) => matchesFilter(task, filter) && matchesQuery(task, query))

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">İş akışı</p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Görevler</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Sütunlar serbest sürüklenmez. Durum, taslak, onay ve evrak kodu adımlarıyla ilerler.
          </p>
        </div>
        {canCreateTask(user.role) ? (
          <Button asChild className="bg-zinc-900">
            <Link href="/gorevler/yeni">Yeni görev</Link>
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <form action="/gorevler" className="flex w-full max-w-md gap-2">
          {filter !== "tum" ? <input type="hidden" name="filtre" value={filter} /> : null}
          {view === "liste" ? <input type="hidden" name="gorunum" value="liste" /> : null}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={query}
              placeholder="Müvekkil, dosya no, başlık"
              aria-label="Görev ara"
              className="h-10 pl-8"
            />
          </div>
          <Button type="submit" variant="secondary" className="h-10">
            Ara
          </Button>
        </form>
        <div className="flex rounded-lg bg-muted p-1">
          <Link
            href={hrefFor({ q: query, filtre: filter, gorunum: "pano" })}
            className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm ${view === "pano" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
          >
            <LayoutGrid className="size-4" />
            Pano
          </Link>
          <Link
            href={hrefFor({ q: query, filtre: filter, gorunum: "liste" })}
            className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm ${view === "liste" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
          >
            <List className="size-4" />
            Liste
          </Link>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filterLabels.map((item) => {
          const count = tasks.filter((task) => matchesFilter(task, item.id) && matchesQuery(task, query)).length
          const active = filter === item.id
          return (
            <Link
              key={item.id}
              href={hrefFor({ q: query, filtre: item.id, gorunum: view })}
              className={`shrink-0 rounded-full px-3 py-1 text-sm ring-1 ${active ? "bg-zinc-900 text-white ring-zinc-900" : "bg-card text-foreground ring-border"}`}
            >
              {item.label}
              <span className="ml-1 text-xs opacity-70">{count}</span>
            </Link>
          )
        })}
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card px-6 py-16 text-center">
          <p className="text-3xl font-semibold tracking-tight">Henüz dahil olduğunuz bir iş yok</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {canCreateTask(user.role)
              ? "Bir stajyere veya başka bir avukata ilk işi atayın."
              : "Bir avukat size iş atadığında burada görünecek."}
          </p>
          {canCreateTask(user.role) ? (
            <Button asChild className="mt-4 bg-[#16324f]">
              <Link href="/gorevler/yeni">İlk görevi ata</Link>
            </Button>
          ) : null}
        </div>
      ) : (
        <TaskBoard tasks={visible} view={view} />
      )}
    </div>
  )
}
