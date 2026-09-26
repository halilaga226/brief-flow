"use client"

import { TaskTimeline } from "@/components/portal/task-timeline"
import { StatusBadge } from "@/components/portal/status-badge"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import type { TaskCardDTO } from "@/lib/dto"
import Link from "next/link"

export function TaskLinkList({ tasks }: { tasks: TaskCardDTO[] }) {
  if (tasks.length === 0) {
    return <p className="text-sm font-medium text-zinc-500">Şu an sizden beklenen bir adım yok.</p>
  }

  return (
    <ul className="divide-y">
      {tasks.slice(0, 6).map((task) => (
        <li key={task.id}>
          <HoverCard openDelay={400}>
            <HoverCardTrigger asChild>
              <Link href={`/gorevler/${task.id}`} className="block py-3 hover:bg-muted/60">
                <span className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-bold">{task.title}</span>
                  <StatusBadge status={task.status} />
                </span>
                <span className="mt-1 block text-xs font-medium text-zinc-500">
                  {task.clientName} · {task.fileNumber} · {task.dueLabel}
                </span>
              </Link>
            </HoverCardTrigger>
            <HoverCardContent className="w-80" align="start">
              <div className="max-h-72 overflow-y-auto">
                <TaskTimeline events={task.logs} />
              </div>
            </HoverCardContent>
          </HoverCard>
        </li>
      ))}
    </ul>
  )
}
