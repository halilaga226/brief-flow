"use client"

import { StatusBadge } from "@/components/portal/status-badge"
import { Button } from "@/components/ui/button"
import type { TaskCardDTO } from "@/lib/dto"
import {
  elapsedWorkLabel,
  remainingDueDays,
  remainingDueLabel,
} from "@/lib/format"
import { cn } from "@/lib/utils"
import type { CourthouseJobDTO } from "@/server/courthouses"
import { courthouseJobKindLabel } from "@/server/courthouses"
import Link from "next/link"
import { useMemo, useState } from "react"

type Bucket = "geciken" | "bugun" | "yakin" | "ileri" | "tamam"

const BUCKETS: { id: Bucket; label: string }[] = [
  { id: "geciken", label: "Geciken" },
  { id: "bugun", label: "Bugün" },
  { id: "yakin", label: "3 gün" },
  { id: "ileri", label: "İlerisi" },
  { id: "tamam", label: "Tamamlanan" },
]

function bucketFor(dueIso: string | null, done: boolean): Bucket {
  if (done) return "tamam"
  if (!dueIso) return "ileri"
  const days = remainingDueDays(dueIso)
  if (days < 0) return "geciken"
  if (days === 0) return "bugun"
  if (days <= 3) return "yakin"
  return "ileri"
}

type Row = {
  id: string
  href: string
  title: string
  client: string
  file: string
  people: string
  dueIso: string | null
  dueLabel: string
  remain: string
  elapsed: string
  status: TaskCardDTO["status"] | "ADLIYE"
  done: boolean
  bucket: Bucket
  sort: number
}

export function DurationBoard({
  tasks,
  courthouseJobs,
}: {
  tasks: TaskCardDTO[]
  courthouseJobs: CourthouseJobDTO[]
}) {
  const [filter, setFilter] = useState<Bucket | "aktif">("aktif")

  const rows = useMemo(() => {
    const taskRows: Row[] = tasks.map((task) => {
      const done = task.status === "TAMAMLANDI"
      const remainDays = remainingDueDays(task.dueDate)
      return {
        id: `t-${task.id}`,
        href: `/gorevler/${task.id}`,
        title: task.title,
        client: task.clientName,
        file: task.fileNumber,
        people: `${task.assignerName} → ${task.assigneeName}`,
        dueIso: task.dueDate,
        dueLabel: task.dueLabel,
        remain: remainingDueLabel(task.dueDate, task.status),
        elapsed: elapsedWorkLabel(task.createdAt),
        status: task.status,
        done,
        bucket: bucketFor(task.dueDate, done),
        sort: done ? 10_000 : remainDays,
      }
    })
    const jobRows: Row[] = courthouseJobs.map((job) => {
      const done = Boolean(job.completedAt)
      const remainDays = job.dueDate ? remainingDueDays(job.dueDate) : 999
      return {
        id: `c-${job.id}`,
        href: "/adliye",
        title: job.title,
        client: job.clientName || courthouseJobKindLabel(job.kind),
        file: job.courthouseName,
        people: job.assigneeName
          ? `${job.assignerName} → ${job.assigneeName}`
          : `${job.assignerName} → havuz`,
        dueIso: job.dueDate,
        dueLabel: job.dueDate
          ? remainingDueLabel(job.dueDate, done ? "TAMAMLANDI" : "ATANDI")
          : "Tarih yok",
        remain: job.dueDate
          ? remainingDueLabel(job.dueDate, done ? "TAMAMLANDI" : "ATANDI")
          : "Süresiz",
        elapsed: elapsedWorkLabel(job.createdAt),
        status: "ADLIYE",
        done,
        bucket: bucketFor(job.dueDate, done),
        sort: done ? 10_000 : remainDays,
      }
    })
    return [...taskRows, ...jobRows].sort((a, b) => a.sort - b.sort)
  }, [tasks, courthouseJobs])

  const visible = rows.filter((row) =>
    filter === "aktif" ? !row.done : row.bucket === filter,
  )

  const counts = {
    aktif: rows.filter((row) => !row.done).length,
    geciken: rows.filter((row) => row.bucket === "geciken").length,
    bugun: rows.filter((row) => row.bucket === "bugun").length,
    yakin: rows.filter((row) => row.bucket === "yakin").length,
    ileri: rows.filter((row) => row.bucket === "ileri").length,
    tamam: rows.filter((row) => row.bucket === "tamam").length,
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setFilter("aktif")}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm ring-1",
            filter === "aktif"
              ? "bg-primary font-semibold text-primary-foreground ring-primary"
              : "bg-card font-medium ring-border hover:bg-muted",
          )}
        >
          Açık ({counts.aktif})
        </button>
        {BUCKETS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm ring-1",
              filter === item.id
                ? item.id === "geciken"
                  ? "bg-[#ff3b30] font-semibold text-white ring-[#ff3b30]"
                  : "bg-primary font-semibold text-primary-foreground ring-primary"
                : "bg-card font-medium ring-border hover:bg-muted",
            )}
          >
            {item.label} ({counts[item.id]})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          Bu aralıkta iş yok.
        </p>
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <div className="hidden grid-cols-[minmax(10rem,1.6fr)_minmax(7rem,1fr)_minmax(8rem,1.1fr)_7rem_7rem_minmax(6rem,0.9fr)_auto] gap-2 bg-muted/50 px-3 py-2 text-[10px] font-bold tracking-wide text-muted-foreground uppercase md:grid">
            <span>İş</span>
            <span>Müvekkil / yer</span>
            <span>Kim</span>
            <span>Son gün</span>
            <span>Kalan</span>
            <span>Süre</span>
            <span />
          </div>
          <ul>
            {visible.map((row) => (
              <li
                key={row.id}
                className={cn(
                  "grid gap-2 border-b border-border px-3 py-3 last:border-b-0 md:grid-cols-[minmax(10rem,1.6fr)_minmax(7rem,1fr)_minmax(8rem,1.1fr)_7rem_7rem_minmax(6rem,0.9fr)_auto] md:items-center",
                  row.bucket === "geciken" && "bg-[#ff3b30]/10",
                  row.bucket === "bugun" && "bg-[#ff9f0a]/10",
                )}
              >
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase md:hidden">
                    İş
                  </p>
                  <Link href={row.href} className="text-sm font-semibold hover:underline">
                    {row.title}
                  </Link>
                  <p className="font-mono text-[11px] text-muted-foreground">{row.file}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase md:hidden">
                    Müvekkil
                  </p>
                  <p className="text-sm">{row.client || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase md:hidden">
                    Kim
                  </p>
                  <p className="truncate text-sm text-muted-foreground">{row.people}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase md:hidden">
                    Son gün
                  </p>
                  <p className="text-sm font-medium">{row.dueLabel}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase md:hidden">
                    Kalan
                  </p>
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      row.bucket === "geciken" && "text-[#ff3b30]",
                      row.bucket === "bugun" && "text-[#c2410c] dark:text-[#ff9f0a]",
                    )}
                  >
                    {row.remain}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase md:hidden">
                    Süre
                  </p>
                  <p className="text-sm text-muted-foreground">{row.elapsed}</p>
                  {row.status === "ADLIYE" ? (
                    <p className="text-[11px] font-medium text-muted-foreground">Adliye</p>
                  ) : (
                    <StatusBadge status={row.status} />
                  )}
                </div>
                <div className="md:justify-self-end">
                  <Button asChild size="sm" variant="ghost" className="h-8 font-semibold">
                    <Link href={row.href}>Aç</Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
