import { TaskBoard } from "@/components/portal/task-board"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { requireUser } from "@/lib/session"
import {
  canCreateTask,
  isAdmin,
  matchesFilter,
  matchesQuery,
  matchesRecentWindow,
  parseDueWindow,
  parseFilter,
  parseView,
  roleLabel,
  type DueWindow,
  type Role,
  type TaskFilter,
  type TaskView,
} from "@/lib/workflow"
import { prisma } from "@/lib/prisma"
import { listTasksCached } from "@/server/cached"
import {
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  FolderOpen,
  Inbox,
  LayoutGrid,
  List,
  Phone,
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
  { id: "tum", label: "Tümü", icon: FolderOpen },
  { id: "atandi", label: "Atanan işler", icon: Inbox },
  { id: "inceleme", label: "Onaya gidenler", icon: ClipboardList },
  { id: "kontrol", label: "Kontrol edilecekler", icon: ClipboardCheck },
  { id: "gonderilecek", label: "Gönderilecekler", icon: Send },
  { id: "tamam", label: "Tamamlananlar", icon: CheckCircle2 },
  { id: "atanan", label: "Bana atanan", icon: UserRound },
  { id: "atadigim", label: "Atadığım", icon: UserCheck },
  { id: "bekleyen", label: "Sıradaki", icon: Inbox },
  { id: "geciken", label: "Geciken", icon: Inbox },
  { id: "arama", label: "Arama", icon: Phone },
]

const windows: { id: DueWindow; label: string }[] = [
  { id: "1g", label: "Son 1 gün" },
  { id: "3g", label: "Son 3 gün" },
  { id: "1h", label: "Son 1 hafta" },
  { id: "1ay", label: "Son 1 ay" },
]

function hrefFor(params: {
  q?: string
  filtre?: TaskFilter
  gorunum?: TaskView
  sure?: DueWindow | null
  atanan?: string | null
}) {
  const search = new URLSearchParams()
  if (params.q) search.set("q", params.q)
  if (params.filtre && params.filtre !== "tum") search.set("filtre", params.filtre)
  if (params.gorunum === "pano") search.set("gorunum", "pano")
  if (params.sure) search.set("sure", params.sure)
  if (params.atanan) search.set("atanan", params.atanan)
  const value = search.toString()
  return value ? `/gorevler?${value}` : "/gorevler"
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    filtre?: string
    gorunum?: string
    sure?: string
    atanan?: string
  }>
}) {
  const user = await requireUser()
  const params = await searchParams
  const query = params.q ?? ""
  const filter = parseFilter(params.filtre)
  const view = parseView(params.gorunum)
  const sure = parseDueWindow(params.sure)
  const admin = isAdmin(user.role)
  const assigneeId = admin && params.atanan ? params.atanan : null

  const [tasks, assignees] = await Promise.all([
    listTasksCached(user.id, user.role),
    admin
      ? prisma.user.findMany({
          orderBy: { name: "asc" },
          select: { id: true, name: true, role: true },
        })
      : Promise.resolve([]),
  ])

  const visible = tasks.filter(
    (task) =>
      matchesFilter(task, filter, user.id) &&
      matchesQuery(task, query) &&
      matchesRecentWindow(task, sure) &&
      (!assigneeId || task.assigneeId === assigneeId),
  )
  const activeFolder = folders.find((item) => item.id === filter) ?? folders[0]

  return (
    <div className="grid gap-4 lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-6">
      <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
        <div className="glass rounded-2xl p-2">
          <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:grid lg:gap-0.5 lg:overflow-visible lg:px-0 lg:pb-0">
            {folders.map((item) => {
              const Icon = item.icon
              const count = tasks.filter(
                (task) =>
                  matchesFilter(task, item.id, user.id) &&
                  matchesQuery(task, query) &&
                  matchesRecentWindow(task, sure) &&
                  (!assigneeId || task.assigneeId === assigneeId),
              ).length
              const active = filter === item.id
              return (
                <Link
                  key={item.id}
                  href={hrefFor({
                    q: query,
                    filtre: item.id,
                    gorunum: view,
                    sure,
                    atanan: assigneeId,
                  })}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-xl px-2.5 py-2 text-sm transition lg:shrink",
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {activeFolder.label}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Atanmış tüm görevlerin durum takibi. Süre filtreleri son aktiviteye göredir.
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1 ring-1 ring-border">
            <Link
              href={hrefFor({
                q: query,
                filtre: filter,
                gorunum: "liste",
                sure,
                atanan: assigneeId,
              })}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition",
                view === "liste"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <List className="size-4" />
              Liste
            </Link>
            <Link
              href={hrefFor({
                q: query,
                filtre: filter,
                gorunum: "pano",
                sure,
                atanan: assigneeId,
              })}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition",
                view === "pano"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutGrid className="size-4" />
              Pano
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={hrefFor({
              q: query,
              filtre: filter,
              gorunum: view,
              sure: null,
              atanan: assigneeId,
            })}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm ring-1",
              !sure
                ? "bg-primary font-semibold text-primary-foreground ring-primary"
                : "glass font-medium ring-border",
            )}
          >
            Tümü
          </Link>
          {windows.map((item) => (
            <Link
              key={item.id}
              href={hrefFor({
                q: query,
                filtre: filter,
                gorunum: view,
                sure: item.id,
                atanan: assigneeId,
              })}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm ring-1",
                sure === item.id
                  ? "bg-orange-500 font-semibold text-white ring-orange-500"
                  : "glass font-medium ring-border",
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {admin && assignees.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Atanan:</span>
            <Link
              href={hrefFor({
                q: query,
                filtre: filter,
                gorunum: view,
                sure,
                atanan: null,
              })}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm ring-1",
                !assigneeId
                  ? "bg-primary font-semibold text-primary-foreground ring-primary"
                  : "glass font-medium ring-border",
              )}
            >
              Herkes
            </Link>
            {assignees.map((person) => (
              <Link
                key={person.id}
                href={hrefFor({
                  q: query,
                  filtre: filter,
                  gorunum: view,
                  sure,
                  atanan: person.id,
                })}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm ring-1",
                  assigneeId === person.id
                    ? "bg-orange-500 font-semibold text-white ring-orange-500"
                    : "glass font-medium ring-border",
                )}
              >
                {person.name}
                <span className="ml-1 opacity-70">
                  ({roleLabel(person.role as Role)})
                </span>
              </Link>
            ))}
          </div>
        ) : null}

        <form action="/gorevler" className="flex w-full gap-2 lg:max-w-md">
          {filter !== "tum" ? <input type="hidden" name="filtre" value={filter} /> : null}
          {view === "pano" ? <input type="hidden" name="gorunum" value="pano" /> : null}
          {sure ? <input type="hidden" name="sure" value={sure} /> : null}
          {assigneeId ? <input type="hidden" name="atanan" value={assigneeId} /> : null}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={query}
              placeholder="Ara"
              aria-label="Görev ara"
              className="glass h-11 rounded-xl pl-8"
            />
          </div>
          <Button type="submit" variant="secondary" className="h-11 rounded-xl font-semibold">
            Ara
          </Button>
        </form>

        {tasks.length === 0 ? (
          <div className="glass rounded-2xl border-dashed px-6 py-16 text-center">
            <p className="text-2xl font-semibold tracking-tight">Takip edilecek görev yok</p>
            {canCreateTask(user.role) ? (
              <Button asChild className="mt-4 font-semibold">
                <Link href="/is-listesi">İş listesi</Link>
              </Button>
            ) : null}
          </div>
        ) : visible.length === 0 ? (
          <div className="glass rounded-2xl border-dashed px-6 py-12 text-center">
            <p className="text-lg font-semibold">Bu filtreye uyan görev yok</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Durum, süre veya atanan filtresini değiştirin.
            </p>
          </div>
        ) : (
          <TaskBoard tasks={visible} view={view} />
        )}
      </div>
    </div>
  )
}
