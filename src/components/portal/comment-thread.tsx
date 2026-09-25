"use client"

import { addCommentAction } from "@/actions/tasks"
import { useActionResult } from "@/components/portal/use-action-result"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { CommentDTO } from "@/lib/dto"
import { cn } from "@/lib/utils"
import { useActionState, useEffect, useRef } from "react"

export function CommentThread({
  taskId,
  comments,
  currentUserId,
}: {
  taskId: string
  comments: CommentDTO[]
  currentUserId: string
}) {
  const [state, action, pending] = useActionState(addCommentAction, null)
  const formRef = useRef<HTMLFormElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  useActionResult(state, () => formRef.current?.reset())

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" })
  }, [comments.length])

  return (
    <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <h2 className="font-serif text-xl">İç notlar</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Avukat ile işi yürüten kişi arasındaki yazışma. Dışarıya gitmez.
      </p>
      <div className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <p className="rounded-lg bg-muted px-3 py-4 text-sm text-muted-foreground">
            Henüz iç not yok. Talimat, soru veya düzeltmeyi buradan yazın.
          </p>
        ) : (
          comments.map((comment) => {
            const mine = comment.authorId === currentUserId
            return (
              <div key={comment.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2",
                    mine ? "bg-[#16324f] text-[#f6f3ec]" : "bg-[#f7f4ee] ring-1 ring-border",
                  )}
                >
                  <p className={cn("text-xs", mine ? "text-white/70" : "text-muted-foreground")}>
                    {comment.authorName} · {comment.authorTitle}
                  </p>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{comment.body}</p>
                  <p className={cn("mt-1 text-[11px]", mine ? "text-white/60" : "text-muted-foreground")}>
                    {comment.when}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={endRef} />
      </div>
      <form ref={formRef} action={action} className="mt-4 grid gap-2">
        <input type="hidden" name="taskId" value={taskId} />
        <Textarea
          name="body"
          required
          maxLength={2000}
          rows={3}
          placeholder="Notunuzu yazın"
          aria-label="İç not"
        />
        {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        <div className="flex justify-end">
          <Button type="submit" disabled={pending} variant="secondary">
            {pending ? "Gönderiliyor…" : "Notu ilet"}
          </Button>
        </div>
      </form>
    </section>
  )
}
