"use client"

import { StatusBadge } from "@/components/portal/status-badge"
import { Button } from "@/components/ui/button"
import type { ActivityDTO, TaskCardDTO } from "@/lib/dto"
import { cn } from "@/lib/utils"
import {
  CheckCircle2,
  ClipboardList,
  FolderOpen,
  Inbox,
  Plus,
  Send,
  ShieldCheck,
} from "lucide-react"
import Link from "next/link"

type Counts = {
  awaiting: number
  assigned: number
  inReview: number
  toSend: number
  dueSoon: number
  overdue: number
  completedThisMonth: number
  completed: number
  active: number
}

const zones = [
  {
    key: "assigned",
    label: "Atanan işler",
    href: "/gorevler?filtre=atandi",
    icon: Inbox,
    valueKey: "assigned" as const,
    tone: "from-[#007aff] to-[#5ac8fa]",
    chip: "text-[#007aff]",
  },
  {
    key: "review",
    label: "Onaya gidenler",
    href: "/gorevler?filtre=inceleme",
    icon: ShieldCheck,
    valueKey: "inReview" as const,
    tone: "from-[#ff9f0a] to-[#ffb340]",
    chip: "text-[#ff9f0a]",
  },
  {
    key: "send",
    label: "Gönderilecekler",
    href: "/gorevler?filtre=gonderilecek",
    icon: Send,
    valueKey: "toSend" as const,
    tone: "from-[#ff2d55] to-[#ff6b8a]",
    chip: "text-[#ff2d55]",
  },
  {
    key: "done",
    label: "Tamamlananlar",
    href: "/gorevler?filtre=tamam",
    icon: CheckCircle2,
    valueKey: "completed" as const,
    tone: "from-[#34c759] to-[#30d158]",
    chip: "text-[#34c759]",
  },
] as const

export function HomeDashboard({
  greeting,
  canAssign,
  counts,
  awaiting,
  activity,
}: {
  greeting: string
  title: string
  canAssign: boolean
  counts: Counts
  awaiting: TaskCardDTO[]
  activity: ActivityDTO[]
}) {
  return (
    <div className="mx-auto grid max-w-6xl gap-5">
      <section className="glass rounded-[1.5rem] p-6 md:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{greeting}</h1>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary" className="font-bold">
              <Link href="/is-listesi">
                <ClipboardList />
                İş listesi
              </Link>
            </Button>
            {canAssign ? (
              <Button asChild className="font-bold">
                <Link href="/gorevler/yeni">
                  <Plus />
                  Görev olarak ata
                </Link>
              </Button>
            ) : (
              <Button asChild className="font-bold">
                <Link href="/gorevler">
                  <FolderOpen />
                  Görevler
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {zones.map((zone) => {
          const Icon = zone.icon
          const value = counts[zone.valueKey]
          return (
            <Link
              key={zone.key}
              href={zone.href}
              className="glass block rounded-2xl p-4 transition hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={cn("text-sm font-bold", zone.chip)}>{zone.label}</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">{value}</p>
                </div>
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md",
                    zone.tone,
                  )}
                >
                  <Icon className="size-4" />
                </span>
              </div>
            </Link>
          )
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="glass overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
            <h2 className="text-xl font-bold">Sıradaki</h2>
            <Button asChild variant="ghost" size="sm" className="font-semibold">
              <Link href="/gorevler?filtre=bekleyen">Tümü</Link>
            </Button>
          </div>
          {awaiting.length === 0 ? (
            <p className="px-4 py-10 text-center text-base text-muted-foreground">—</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {awaiting.map((task) => (
                <li key={task.id}>
                  <Link
                    href={`/gorevler/${task.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-muted/30"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold">{task.title}</p>
                      <p className="mt-0.5 text-sm font-medium text-muted-foreground">
                        {task.assignerName} · {task.dueLabel}
                      </p>
                    </div>
                    <StatusBadge status={task.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass overflow-hidden rounded-2xl">
          <div className="border-b border-border/70 px-4 py-3">
            <h2 className="text-xl font-bold">Hareket</h2>
          </div>
          {activity.length === 0 ? (
            <p className="px-4 py-10 text-center text-base text-muted-foreground">—</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {activity.map((item) => (
                <li key={item.id} className="px-4 py-3">
                  <p className="text-sm font-bold">{item.label}</p>
                  <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                    {item.actorName} · {item.when}
                  </p>
                  {item.taskTitle ? (
                    <Link href={`/gorevler/${item.taskId}`} className="mt-1 block text-sm font-semibold text-primary">
                      {item.taskTitle}
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
