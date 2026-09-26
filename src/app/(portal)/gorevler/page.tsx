import { TaskBoard } from "@/components/portal/task-board"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
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
import {
  CheckCircle2,
  ClipboardList,
  FolderOpen,
  Inbox,
  Phone,
  Plus,
  Search,
  Send,
  UserCheck,
  UserRound,
} from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"

export const metadata: Metadata = { title: "Görevler" }

const folders: { id: TaskFilter; label: string; icon: LucideIcon }[] = [
  { id: "tum", label: "Tüm işler", icon: FolderOpen },
  { id: "atanan", label: "Bana atanan", icon: UserRound },
  { id: "atadigim", label: "Atadığım", icon: UserCheck },
  { id: "bekleyen", label: "Sıradaki adımım", icon: Inbox },
  { id: "inceleme", label: "İncelemede", icon: ClipboardList },
  { id: "onay", label: "Onaylandı", icon: CheckCircle2 },
  { id: "gonderim", label: "Gönderimde", icon: Send },
  { id: "arama", label: "Arama yapılacak", icon: Phone },
  { id: "tamam", label: "Tamamlanan", icon: CheckCircle2 },
  { id: "geciken", label: "Geciken", icon: Inbox },
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
  const visible = tasks.filter(
    (task) => matchesFilter(task, filter, user.id) && matchesQuery(task, query),
  )
  const activeFolder = folders.find((item) => item.id === filter) ?? folders[0]

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6">
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-2xl border border-border bg-card p-2">
          <p className="px-2 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Klasörler
          </p>
          <nav className="mt-1 grid gap-0.5">
            {folders.map((item) => {
              const Icon = item.icon
              const count = tasks.filter(
                (task) => matchesFilter(task, item.id, user.id) && matchesQuery(task, query),
              ).length
              const active = filter === item.id
              return (
                <Link
                  key={item.id}
                  href={hrefFor({ q: query, filtre: item.id, gorunum: view })}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm transition",
                    active
                      ? "bg-primary font-semibold text-primary-foreground shadow-sm"
                      : "font-medium text-foreground/80 hover:bg-muted",
                  )}
                >
                  <Icon className="size-4 shrink-0 opacity-80" />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  <span className="text-xs tabular-nums opacity-70">{count}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>

      <div className="grid min-w-0 gap-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{activeFolder.label}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{visible.length} iş</p>
          </div>
          {canCreateTask(user.role) ? (
            <>
              <Button asChild size="icon" aria-label="Görev ver" className="md:hidden">
                <Link href="/gorevler/yeni">
                  <Plus />
                </Link>
              </Button>
              <Button asChild className="hidden font-semibold md:inline-flex">
                <Link href="/gorevler/yeni">Görev ver</Link>
              </Button>
            </>
          ) : null}
        </div>

        <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 lg:hidden">
          {folders.map((item) => {
            const active = filter === item.id
            const count = tasks.filter((task) => matchesFilter(task, item.id, user.id)).length
            return (
              <Link
                key={item.id}
                href={hrefFor({ q: query, filtre: item.id, gorunum: view })}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-sm ring-1",
                  active
                    ? "bg-primary font-semibold text-primary-foreground ring-primary"
                    : "bg-card font-medium text-foreground ring-border",
                )}
              >
                {item.label}
                <span className="ml-1 text-xs opacity-70">{count}</span>
              </Link>
            )
          })}
        </div>

        <form action="/gorevler" className="flex w-full gap-2 lg:max-w-md">
          {filter !== "tum" ? <input type="hidden" name="filtre" value={filter} /> : null}
          {view === "pano" ? <input type="hidden" name="gorunum" value="pano" /> : null}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={query}
              placeholder="Müvekkil, dosya no, başlık"
              aria-label="Görev ara"
              className="h-11 rounded-xl bg-card pl-8"
            />
          </div>
          <Button type="submit" variant="secondary" className="h-11 rounded-xl font-semibold">
            Ara
          </Button>
        </form>

        {tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <p className="text-2xl font-semibold tracking-tight">Henüz iş yok</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              {canCreateTask(user.role)
                ? "İş listesinden kayıt ekleyip görev atayın."
                : "Size iş atandığında burada görünür."}
            </p>
            {canCreateTask(user.role) ? (
              <Button asChild className="mt-4 font-semibold">
                <Link href="/is-listesi">İş listesine git</Link>
              </Button>
            ) : null}
          </div>
        ) : (
          <TaskBoard tasks={visible} view={view} />
        )}
      </div>
    </div>
  )
}
