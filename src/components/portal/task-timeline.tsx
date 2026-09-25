import type { TimelineEventDTO } from "@/lib/dto"

export function TaskTimeline({ events }: { events: TimelineEventDTO[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">Henüz işlem kaydı yok.</p>
  }

  return (
    <ol>
      {events.map((event, index) => (
        <li key={event.id} className="relative pb-4 pl-5 last:pb-0">
          {index !== events.length - 1 ? (
            <span className="absolute top-2 bottom-0 left-[5px] w-px bg-border" />
          ) : null}
          <span className="absolute top-1.5 left-0 size-2.5 rounded-full bg-[#16324f] ring-2 ring-card" />
          <p className="text-sm leading-tight font-medium">{event.label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {event.actorName} · {event.when}
          </p>
          {event.note ? (
            <p className="mt-1 text-sm leading-snug text-foreground/80">{event.note}</p>
          ) : null}
          {event.fileName ? (
            <p className="mt-1 text-xs text-muted-foreground">Dosya: {event.fileName}</p>
          ) : null}
          {event.trackingCode ? (
            <p className="mt-1 font-mono text-xs break-all">Kod: {event.trackingCode}</p>
          ) : null}
        </li>
      ))}
    </ol>
  )
}
