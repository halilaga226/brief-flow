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
import { LayoutGrid, List, Plus, Search } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Görevler" }

const filterLabels: { id: TaskFilter; label: string }[] = [
  { id: "tum", label: "Tümü" },
  { id: "bekleyen", label: "Bekleyen" },
  { id: "geciken", label: "Geciken" },
  { id: "yaklasan", label: "Yaklaşan" },
  { id: "inceleme", label: "İnceleme" },
  { id: "arama", label: "Arama" },
  { id: "tamam", label: "Tamam" },
]

function hrefFor(params: { q?: string; filtre?: TaskFilter; gorunum?: TaskView }) {
  const search = new URLSearchParams()
  if (params.q) search.set("q", params.q)
  if (params.filtre && params.filtre !== "tum") search.set("filtre", params.filtre)
  if (params.gorunum === "pano") search.set("gorunum", "pano")
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
    <div className="grid gap-4 sm:gap-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight md:text-4xl">
            Görevler
          </h1>
          <p className="mt-1 text-sm font-semibold text-[var(--brand-muted)]">
            {visible.length} iş listeleniyor
          </p>
        </div>
        {canCreateTask(user.role) ? (
          <Button
            asChild
            className="bg-[var(--brand-accent)] font-bold text-[var(--brand-ink)] hover:bg-[var(--brand-accent-hover)] md:hidden"
            size="icon"
            aria-label="Yeni görev"
          >
            <Link href="/gorevler/yeni">
              <Plus />
            </Link>
          </Button>
        ) : null}
        {canCreateTask(user.role) ? (
          <Button
            asChild
            className="hidden bg-[var(--brand-accent)] font-bold text-[var(--brand-ink)] hover:bg-[var(--brand-accent-hover)] md:inline-flex"
          >
            <Link href="/gorevler/yeni">Yeni görev</Link>
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <form action="/gorevler" className="flex w-full gap-2 lg:max-w-md">
          {filter !== "tum" ? <input type="hidden" name="filtre" value={filter} /> : null}
          {view === "pano" ? <input type="hidden" name="gorunum" value="pano" /> : null}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-[var(--brand-muted)]" />
            <Input
              name="q"
              defaultValue={query}
              placeholder="Müvekkil, dosya no, başlık"
              aria-label="Görev ara"
              className="h-11 rounded-xl border-[var(--brand-border)] bg-white pl-8 font-medium"
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            className="h-11 rounded-xl bg-[var(--brand-soft)] font-bold text-[var(--brand-ink)]"
          >
            Ara
          </Button>
        </form>
        <div className="hidden rounded-xl border border-[var(--brand-border)] bg-white p-1 sm:flex">
          <Link
            href={hrefFor({ q: query, filtre: filter, gorunum: "liste" })}
            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-bold ${view === "liste" ? "bg-[var(--brand-soft)] text-[var(--brand-primary)]" : "text-[var(--brand-muted)]"}`}
          >
            <List className="size-4" />
            Liste
          </Link>
          <Link
            href={hrefFor({ q: query, filtre: filter, gorunum: "pano" })}
            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-bold ${view === "pano" ? "bg-[var(--brand-soft)] text-[var(--brand-primary)]" : "text-[var(--brand-muted)]"}`}
          >
            <LayoutGrid className="size-4" />
            Pano
          </Link>
        </div>
      </div>

      <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0">
        {filterLabels.map((item) => {
          const count = tasks.filter((task) => matchesFilter(task, item.id) && matchesQuery(task, query)).length
          const active = filter === item.id
          return (
            <Link
              key={item.id}
              href={hrefFor({ q: query, filtre: item.id, gorunum: view })}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-bold ring-1 ${active ? "bg-[var(--brand-primary)] text-white ring-[var(--brand-primary)]" : "bg-white text-[var(--brand-ink)] ring-[var(--brand-border)]"}`}
            >
              {item.label}
              <span className="ml-1 text-xs opacity-70">{count}</span>
            </Link>
          )
        })}
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--brand-border)] bg-white px-6 py-16 text-center">
          <p className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
            Henüz iş yok
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm font-medium text-[var(--brand-muted)]">
            {canCreateTask(user.role)
              ? "Bir stajyere veya avukata ilk işi atayın."
              : "Size iş atandığında burada görünür."}
          </p>
          {canCreateTask(user.role) ? (
            <Button
              asChild
              className="mt-4 bg-[var(--brand-primary)] font-bold hover:bg-[var(--brand-primary-hover)]"
            >
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
