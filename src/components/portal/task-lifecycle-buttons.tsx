"use client"

import { acceptTaskAction, deleteTaskAction } from "@/actions/tasks"
import { useActionResult } from "@/components/portal/use-action-result"
import { Button } from "@/components/ui/button"
import { Check, Trash2 } from "lucide-react"
import { useActionState } from "react"

export function AcceptTaskButton({ taskId }: { taskId: string }) {
  const [state, action, pending] = useActionState(acceptTaskAction, null)
  useActionResult(state)
  return (
    <form action={action}>
      <input type="hidden" name="taskId" value={taskId} />
      <Button type="submit" disabled={pending} className="font-semibold">
        <Check className="size-4" />
        {pending ? "Kabul ediliyor…" : "Kabul et"}
      </Button>
    </form>
  )
}

export function DeleteTaskButton({
  taskId,
  completed = false,
}: {
  taskId: string
  completed?: boolean
}) {
  const [state, action, pending] = useActionState(deleteTaskAction, null)
  useActionResult(state)
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (
          !window.confirm(
            completed
              ? "Tamamlanan iş silinsin mi? Stajyer ekranından da kalkar."
              : "Bu iş kalıcı olarak silinsin mi?",
          )
        ) {
          event.preventDefault()
        }
      }}
    >
      <input type="hidden" name="taskId" value={taskId} />
      <Button type="submit" disabled={pending} variant="destructive" className="font-semibold">
        <Trash2 className="size-4" />
        {pending ? "Siliniyor…" : completed ? "Tamamlananı sil" : "İşi sil"}
      </Button>
    </form>
  )
}
