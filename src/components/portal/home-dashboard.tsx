"use client"

import { StatusBadge } from "@/components/portal/status-badge"
import { Button } from "@/components/ui/button"
import type { ActivityDTO, TaskCardDTO } from "@/lib/dto"
import { cn } from "@/lib/utils"
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FolderOpen,
  Inbox,
  Plus,
} from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"
import Link from "next/link"

type Counts = {
  awaiting: number
  inReview: number
  dueSoon: number
  overdue: number
  completedThisMonth: number
  active: number
}

const zones = [
  {
    key: "overdue",
    label: "Geciken",
    href: "/gorevler?filtre=geciken",
    icon: AlertTriangle,
    valueKey: "overdue" as const,
    tone: "from-[#ff3b30] to-[#ff6961]",
  },
  {
    key: "soon",
    label: "Yaklaşan",
    href: "/gorevler?sure=3g",
    icon: Clock3,
    valueKey: "dueSoon" as const,
    tone: "from-[#ff9f0a] to-[#ffb340]",
  },
  {
    key: "awaiting",
    label: "Sıradaki",
    href: "/gorevler?filtre=bekleyen",
    icon: Inbox,
    valueKey: "awaiting" as const,
    tone: "from-[#007aff] to-[#5ac8fa]",
  },
  {
    key: "done",
    label: "Tamam",
    href: "/gorevler?filtre=tamam",
    icon: CheckCircle2,
    valueKey: "completedThisMonth" as const,
    tone: "from-[#34c759] to-[#30d158]",
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
  const reduce = useReducedMotion()

  return (
    <div className="mx-auto grid max-w-6xl gap-5">
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass relative overflow-hidden rounded-[1.6rem] p-6 md:p-7"
      >
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{greeting}</h1>
          <div className="flex flex-wrap gap-2">
            {canAssign ? (
              <>
                <Button asChild variant="secondary" className="font-semibold">
                  <Link href="/is-listesi">
                    <ClipboardList />
                    İş listesi
                  </Link>
                </Button>
                <Button asChild className="font-semibold">
                  <Link href="/gorevler/yeni">
                    <Plus />
                    Görev ver
                  </Link>
                </Button>
              </>
            ) : (
              <Button asChild className="font-semibold">
                <Link href="/gorevler">
                  <FolderOpen />
                  Görevler
                </Link>
              </Button>
            )}
          </div>
        </div>
      </motion.section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {zones.map((zone, index) => {
          const Icon = zone.icon
          const value = counts[zone.valueKey]
          return (
            <motion.div
              key={zone.key}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : 0.04 * index }}
            >
              <Link href={zone.href} className="glass group block rounded-2xl p-4 transition hover:-translate-y-0.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{zone.label}</p>
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
            </motion.div>
          )
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="glass overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-lg font-semibold">Sıradaki</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/gorevler?filtre=bekleyen">Tümü</Link>
            </Button>
          </div>
          {awaiting.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">—</p>
          ) : (
            <ul className="divide-y divide-border">
              {awaiting.map((task) => (
                <li key={task.id}>
                  <Link
                    href={`/gorevler/${task.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{task.title}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {task.clientName} · {task.fileNumber}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-bold",
                          task.dueTone === "overdue" && "bg-red-500/15 text-red-600 dark:text-red-300",
                          (task.dueTone === "soon" || task.dueTone === "today") &&
                            "bg-orange-500/15 text-orange-700 dark:text-orange-300",
                          (task.dueTone === "later" || task.dueTone === "done") &&
                            "bg-blue-500/15 text-blue-700 dark:text-blue-300",
                        )}
                      >
                        {task.dueLabel}
                      </span>
                      <StatusBadge status={task.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass overflow-hidden rounded-2xl">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-lg font-semibold">Hareket</h2>
          </div>
          {activity.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">—</p>
          ) : (
            <ul className="divide-y divide-border">
              {activity.map((item) => (
                <li key={item.id} className="px-4 py-3">
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.actorName} · {item.when}
                  </p>
                  {item.taskTitle ? (
                    <Link href={`/gorevler/${item.taskId}`} className="mt-1 block text-sm text-primary">
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
