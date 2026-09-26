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
  Sparkles,
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
    hint: "Hemen bakılmalı",
    href: "/gorevler?filtre=geciken",
    icon: AlertTriangle,
    valueKey: "overdue" as const,
    tone: "from-red-500 to-rose-600",
    glow: "shadow-red-500/25",
    chip: "bg-red-500/15 text-red-600 dark:text-red-300",
  },
  {
    key: "soon",
    label: "Yaklaşan",
    hint: "Bugün / yakın teslim",
    href: "/gorevler?filtre=bekleyen",
    icon: Clock3,
    valueKey: "dueSoon" as const,
    tone: "from-orange-500 to-amber-500",
    glow: "shadow-orange-500/25",
    chip: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  },
  {
    key: "awaiting",
    label: "Sıradaki",
    hint: "Sizden beklenen",
    href: "/gorevler?filtre=bekleyen",
    icon: Inbox,
    valueKey: "awaiting" as const,
    tone: "from-blue-500 to-indigo-600",
    glow: "shadow-blue-500/25",
    chip: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  },
  {
    key: "done",
    label: "Tamamlanan",
    hint: "Bu ay kapanan",
    href: "/gorevler?filtre=tamam",
    icon: CheckCircle2,
    valueKey: "completedThisMonth" as const,
    tone: "from-emerald-500 to-green-600",
    glow: "shadow-emerald-500/25",
    chip: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
] as const

export function HomeDashboard({
  greeting,
  title,
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
    <div className="mx-auto grid max-w-6xl gap-6">
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[1.75rem] border border-border bg-card p-6 md:p-8"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,color-mix(in_oklab,var(--primary)_22%,transparent),transparent_40%),radial-gradient(circle_at_10%_90%,color-mix(in_oklab,var(--brand-accent)_18%,transparent),transparent_35%)]" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.16em] text-primary uppercase">
              <Sparkles className="size-3.5" />
              Ana sayfa
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{greeting}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {title || "Büro paneli"} · {counts.active} açık iş
            </p>
          </div>
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
                  Görevlerim
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
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : 0.05 * index }}
            >
              <Link
                href={zone.href}
                className={cn(
                  "group relative block overflow-hidden rounded-2xl p-[1px] shadow-lg transition hover:-translate-y-0.5",
                  zone.glow,
                )}
              >
                <div className={cn("absolute inset-0 bg-gradient-to-br opacity-90", zone.tone)} />
                <div className="relative m-[1px] rounded-[0.95rem] bg-card/95 p-4 backdrop-blur dark:bg-card/90">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold", zone.chip)}>
                        {zone.label}
                      </p>
                      <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums">{value}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{zone.hint}</p>
                    </div>
                    <span
                      className={cn(
                        "flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md",
                        zone.tone,
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h2 className="text-lg font-bold">Sıradaki adımlar</h2>
              <p className="text-sm text-muted-foreground">Sizden beklenen işler</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/gorevler?filtre=bekleyen">Tümü</Link>
            </Button>
          </div>
          {awaiting.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              Şu an bekleyen adım yok.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {awaiting.map((task) => (
                <li key={task.id}>
                  <Link
                    href={`/gorevler/${task.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-muted/50"
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

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-lg font-bold">Son hareket</h2>
            <p className="text-sm text-muted-foreground">Büro akışından kısa özet</p>
          </div>
          {activity.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">Henüz hareket yok.</p>
          ) : (
            <ul className="divide-y divide-border">
              {activity.map((item) => (
                <li key={item.id} className="px-4 py-3">
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.actorName} · {item.when}
                  </p>
                  {item.taskTitle ? (
                    <Link href={`/gorevler/${item.taskId}`} className="mt-1 block text-sm text-primary hover:underline">
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
