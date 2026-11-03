"use client"

import { forwardTaskToInternAction } from "@/actions/tasks"
import { useActionResult } from "@/components/portal/use-action-result"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { ColleagueDTO } from "@/lib/dto"
import { useActionState, useState } from "react"

export function ForwardInternForm({
  taskId,
  interns,
}: {
  taskId: string
  interns: ColleagueDTO[]
}) {
  const [assigneeId, setAssigneeId] = useState(interns[0]?.id ?? "")
  const [state, action, pending] = useActionState(forwardTaskToInternAction, null)
  useActionResult(state)

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="assigneeId" value={assigneeId} />
      {state?.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="grid gap-1.5">
        <Label htmlFor="intern">Stajyer</Label>
        <select
          id="intern"
          value={assigneeId}
          onChange={(event) => setAssigneeId(event.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          {interns.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
              {person.title ? ` · ${person.title}` : ""}
            </option>
          ))}
        </select>
      </div>
      <p className="text-xs text-muted-foreground">
        İş sizin listenizden kalkıp stajyerin listesine düşer. Esas avukat bildirim alır.
      </p>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending || !assigneeId} className="font-semibold">
          {pending ? "Aktarılıyor…" : "Stajyere aktar"}
        </Button>
      </div>
    </form>
  )
}
