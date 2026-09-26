"use client"

import { StatusBadge } from "@/components/portal/status-badge"
import { TaskTimeline } from "@/components/portal/task-timeline"
import { Button } from "@/components/ui/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { TaskCardDTO } from "@/lib/dto"
import type { DueTone, TaskView, VisualTone } from "@/lib/workflow"
import { BOARD_COLUMNS } from "@/lib/workflow"
import { cn } from "@/lib/utils"
import { History } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

function dueText(task: TaskCardDTO) {
  if (task.dueTone === "overdue") return `Gecikti · ${task.dueLabel}`
  if (task.dueTone === "today") return `Bugün · ${task.dueLabel}`
  if (task.dueTone === "soon") return `Yakın · ${task.dueLabel}`
  return task.dueLabel
}

function dueClass(tone: DueTone) {
  if (tone === "overdue" || tone === "today") return "text-red-600"
  if (tone === "soon") return "text-amber-700"
  return "text-zinc-500"
}

function toneRing(tone: VisualTone) {
  if (tone === "red") return "ring-red-300 bg-red-50/70"
  if (tone === "yellow") return "ring-yellow-300 bg-yellow-50/80"
  return "ring-zinc-200 bg-white"
}

function HistoryButton({ task }: { task: TaskCardDTO }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="relative z-10"
          aria-label={`${task.title} işlem geçmişi`}
        >
          <History />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <p className="mb-2 text-xs font-medium text-zinc-500">İşlem geçmişi</p>
        <div className="max-h-80 overflow-y-auto">
          <TaskTimeline events={task.logs} />
        </div>
      </PopoverContent>
    </Popover>
  )
}

function TaskSurface({ task, children }: { task: TaskCardDTO; children: ReactNode }) {
  return (
    <HoverCard openDelay={350} closeDelay={80}>
      <HoverCardTrigger asChild>
        <article
          className={cn(
            "relative rounded-xl p-3 ring-1 transition hover:-translate-y-px",
            toneRing(task.visualTone),
          )}
        >
          <Link
            href={`/gorevler/${task.id}`}
            className="absolute inset-0 rounded-xl"
            aria-label={task.title}
          />
          {children}
        </article>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-80">
        <p className="mb-2 text-sm font-semibold">{task.title}</p>
        <div className="max-h-72 overflow-y-auto">
          <TaskTimeline events={task.logs} />
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

function CardBody({ task }: { task: TaskCardDTO }) {
  return (
    <>
      <div className="relative z-10 flex items-start justify-between gap-2 pointer-events-none">
        <p className="text-[11px] text-zinc-500">{task.relationLabel}</p>
        <div className="pointer-events-auto">
          <HistoryButton task={task} />
        </div>
      </div>
      <h2 className="relative mt-1 text-sm leading-snug font-semibold">{task.title}</h2>
      <p className="mt-1 text-xs text-zinc-500">
        {task.clientName}
        <span className="px-1">·</span>
        <span className="font-mono">{task.fileNumber}</span>
      </p>
      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-600">{task.description}</p>
      <div className="mt-3 flex items-center justify-between gap-2 text-xs">
        <span className={cn("font-medium", dueClass(task.dueTone))}>{dueText(task)}</span>
        <StatusBadge status={task.status} />
      </div>
    </>
  )
}

export function TaskBoard({ tasks, view }: { tasks: TaskCardDTO[]; view: TaskView }) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-14 text-center">
        <p className="text-lg font-semibold">Bu görünümde iş yok</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
          Süzgeci temizleyin. Yönetici değilseniz yalnızca tarafı olduğunuz işler listelenir.
        </p>
      </div>
    )
  }

  if (view === "liste") {
    return (
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="hidden grid-cols-[1.4fr_0.9fr_0.7fr_0.8fr_auto] gap-3 border-b border-zinc-100 px-4 py-2 text-xs font-medium text-zinc-500 md:grid">
          <span>İş</span>
          <span>Müvekkil</span>
          <span>Durum</span>
          <span>Teslim</span>
          <span className="sr-only">Geçmiş</span>
        </div>
        <ul>
          {tasks.map((task) => (
            <li key={task.id} className="border-b border-zinc-100 last:border-b-0">
              <HoverCard openDelay={400}>
                <HoverCardTrigger asChild>
                  <div
                    className={cn(
                      "relative grid gap-2 px-4 py-3 md:grid-cols-[1.4fr_0.9fr_0.7fr_0.8fr_auto] md:items-center",
                      task.visualTone === "red" && "bg-red-50/60",
                      task.visualTone === "yellow" && "bg-yellow-50/70",
                    )}
                  >
                    <Link href={`/gorevler/${task.id}`} className="absolute inset-0" aria-label={task.title} />
                    <div>
                      <p className="text-sm font-bold">{task.title}</p>
                      <p className="text-xs text-zinc-500 md:hidden">
                        {task.clientName} · {task.fileNumber}
                      </p>
                      <p className="text-[11px] text-zinc-500">{task.relationLabel}</p>
                    </div>
                    <p className="hidden text-sm md:block">
                      {task.clientName}
                      <span className="mt-0.5 block font-mono text-xs text-zinc-500">{task.fileNumber}</span>
                    </p>
                    <div>
                      <StatusBadge status={task.status} />
                    </div>
                    <p className={cn("text-sm", dueClass(task.dueTone))}>{dueText(task)}</p>
                    <div className="relative z-10 justify-self-end">
                      <HistoryButton task={task} />
                    </div>
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="max-h-72 overflow-y-auto">
                    <TaskTimeline events={task.logs} />
                  </div>
                </HoverCardContent>
              </HoverCard>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 xl:items-start">
      {BOARD_COLUMNS.map((column) => {
        const items = tasks.filter((task) => task.status === column.status)
        return (
          <section
            key={column.status}
            className="flex w-[82vw] max-w-80 shrink-0 flex-col rounded-xl border border-zinc-200 bg-zinc-50 p-2 xl:w-auto xl:min-w-0 xl:flex-1"
          >
            <header className="flex items-center justify-between px-1 py-1.5">
              <div>
                <p className="text-sm font-semibold">{column.title}</p>
                <p className="text-[11px] text-zinc-500">{column.description}</p>
              </div>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs ring-1 ring-zinc-200">
                {items.length}
              </span>
            </header>
            <div className="mt-1 grid max-h-[70vh] gap-2 overflow-y-auto pr-0.5">
              {items.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-zinc-400">Boş</p>
              ) : (
                items.map((task) => (
                  <TaskSurface key={task.id} task={task}>
                    <CardBody task={task} />
                  </TaskSurface>
                ))
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
