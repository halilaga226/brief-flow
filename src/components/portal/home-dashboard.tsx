"use client"

import { StatusBadge } from "@/components/portal/status-badge"
import { AcceptTaskButton, DeleteTaskButton } from "@/components/portal/task-lifecycle-buttons"
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
    box: "bg-[#007aff] text-white shadow-blue-500/30",
  },
  {
    key: "review",
    label: "Onaya gidenler",
    href: "/gorevler?filtre=inceleme",
    icon: ShieldCheck,
    valueKey: "inReview" as const,
    box: "bg-[#ff9f0a] text-white shadow-orange-500/30",
  },
  {
    key: "send",
    label: "Gönderilecekler",
    href: "/gorevler?filtre=gonderilecek",
    icon: Send,
    valueKey: "toSend" as const,
    box: "bg-[#ff2d55] text-white shadow-pink-500/30",
  },
  {
    key: "done",
    label: "Tamamlananlar",
    href: "/gorevler?filtre=tamam",
    icon: CheckCircle2,
    valueKey: "completed" as const,
    box: "bg-[#34c759] text-white shadow-green-500/30",
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
      <section className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{greeting}</h1>
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
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {zones.map((zone) => {
          const Icon = zone.icon
          const value = counts[zone.valueKey]
          return (
            <Link
              key={zone.key}
              href={zone.href}
              className={cn(
                "block rounded-2xl p-4 shadow-lg transition hover:-translate-y-0.5 hover:brightness-105",
                zone.box,
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-white/95">{zone.label}</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums text-white">
                    {value}
                  </p>
                </div>
                <span className="flex size-10 items-center justify-center rounded-2xl bg-white/20 text-white">
                  <Icon className="size-4" />
                </span>
              </div>
            </Link>
          )
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Sıradaki</h2>
            <Button asChild variant="ghost" size="sm" className="font-medium">
              <Link href="/is-listesi">İş listesi</Link>
            </Button>
          </div>
          {awaiting.length === 0 ? (
            <p className="py-8 text-base text-muted-foreground">—</p>
          ) : (
            <ul className="divide-y divide-border/50 border-y border-border/50">
              {awaiting.map((task) => (
                <li key={task.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <Link href={`/gorevler/${task.id}`} className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold tracking-tight">{task.title}</p>
                      <p className="mt-0.5 text-sm font-medium text-muted-foreground">
                        {task.assignerName} · {task.dueLabel}
                        {task.needsAccept ? " · Kabul bekliyor" : ""}
                        {task.status === "TAMAMLANDI" ? " · Tamamlandı" : ""}
                      </p>
                    </Link>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={task.status} />
                      {task.needsAccept ? <AcceptTaskButton taskId={task.id} /> : null}
                      {task.canDelete && task.status === "TAMAMLANDI" ? (
                        <DeleteTaskButton taskId={task.id} completed />
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="mb-2 text-xl font-bold">Hareket</h2>
          {activity.length === 0 ? (
            <p className="py-8 text-base text-muted-foreground">—</p>
          ) : (
            <ul className="divide-y divide-border/50 border-y border-border/50">
              {activity.map((item) => (
                <li key={item.id} className="py-3">
                  <p className="text-sm font-bold">{item.label}</p>
                  <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                    {item.actorName} · {item.when}
                  </p>
                  {item.taskTitle ? (
                    <Link
                      href={`/gorevler/${item.taskId}`}
                      className="mt-1 block text-sm font-semibold text-primary"
                    >
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
