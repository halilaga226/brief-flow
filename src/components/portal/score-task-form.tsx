"use client"

import { scoreTaskAction } from "@/actions/xp"
import { useActionResult } from "@/components/portal/use-action-result"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { TaskScoreDTO } from "@/lib/dto"
import { MAX_POINTS } from "@/lib/xp"
import { useActionState } from "react"

export function ScoreTaskForm({
  taskId,
  internName,
  canScore,
  score,
}: {
  taskId: string
  internName: string
  canScore: boolean
  score: TaskScoreDTO | null
}) {
  const [state, action, pending] = useActionState(scoreTaskAction, null)
  useActionResult(state)

  if (!canScore && !score) return null

  return (
    <section className="rounded-xl border border-amber-500/30 bg-amber-50/80 p-4 dark:bg-amber-950/40">
      <h2 className="text-xs font-bold tracking-[0.14em] text-amber-900 uppercase dark:text-amber-200">
        Stajyer XP
      </h2>
      {score ? (
        <p className="mt-2 text-sm font-medium">
          {internName} bu işten <span className="font-bold">{score.points} XP</span> aldı.
          {score.note ? ` ${score.lawyerName}: ${score.note}` : ` (${score.lawyerName})`}
        </p>
      ) : (
        <form action={action} className="mt-3 grid gap-3">
          <input type="hidden" name="taskId" value={taskId} />
          <p className="text-sm">
            {internName} işi tamamladı. 1–{MAX_POINTS} arası puan verin; lig tablosuna işlenir.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: MAX_POINTS }, (_, i) => i + 1).map((n) => (
              <label
                key={n}
                className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-amber-700/30 bg-white text-sm font-bold has-[:checked]:bg-red-700 has-[:checked]:text-white dark:bg-black/30"
              >
                <input type="radio" name="points" value={n} className="sr-only" required defaultChecked={n === 7} />
                {n}
              </label>
            ))}
          </div>
          <Textarea name="note" rows={2} placeholder="Kısa not (isteğe bağlı)" />
          {state?.error ? (
            <p className="text-sm font-medium text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}
          <Button type="submit" disabled={pending} className="w-fit bg-red-700 font-semibold text-white hover:bg-red-600">
            {pending ? "Kaydediliyor…" : "Puanı işle"}
          </Button>
        </form>
      )}
    </section>
  )
}
