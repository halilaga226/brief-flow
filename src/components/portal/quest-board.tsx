"use client"

import {
  answerQuestAction,
  closeQuestAction,
  createQuestAction,
  scoreQuestAnswerAction,
} from "@/actions/xp"
import { useActionResult } from "@/components/portal/use-action-result"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { formatDateTime } from "@/lib/format"
import { MAX_POINTS } from "@/lib/xp"
import type { QuestDTO } from "@/lib/xp"
import { useActionState } from "react"

function CreateQuestForm() {
  const [state, action, pending] = useActionState(createQuestAction, null)
  useActionResult(state)
  return (
    <form action={action} className="grid gap-3 rounded-2xl border border-border bg-card p-4">
      <h2 className="text-sm font-bold">Yeni araştırma konusu</h2>
      <Input name="title" required maxLength={120} placeholder="Örn. İhtiyati tedbir şartları" />
      <Textarea
        name="prompt"
        required
        rows={4}
        placeholder="Stajyerin yanıtlaması gereken soru, kaynak beklentisi, dosya bağlamı…"
      />
      {state?.error ? (
        <p className="text-sm font-medium text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-fit font-semibold">
        {pending ? "Açılıyor…" : "Stajyerlere aç"}
      </Button>
    </form>
  )
}

function AnswerForm({ questId }: { questId: string }) {
  const [state, action, pending] = useActionState(answerQuestAction, null)
  useActionResult(state)
  return (
    <form action={action} className="mt-3 grid gap-2">
      <input type="hidden" name="questId" value={questId} />
      <Textarea name="body" required rows={5} placeholder="Yanıtınızı yazın. Kaynak veya madde numarası belirtin." />
      {state?.error ? (
        <p className="text-sm font-medium text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-fit font-semibold">
        {pending ? "Gönderiliyor…" : "Yanıtı gönder"}
      </Button>
    </form>
  )
}

function GradeForm({ answerId }: { answerId: string }) {
  const [state, action, pending] = useActionState(scoreQuestAnswerAction, null)
  useActionResult(state)
  return (
    <form action={action} className="mt-2 flex flex-wrap items-center gap-2">
      <input type="hidden" name="answerId" value={answerId} />
      <select
        name="points"
        className="h-9 rounded-lg border border-input bg-background px-2 text-sm font-semibold"
        defaultValue="7"
      >
        {Array.from({ length: MAX_POINTS }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {n} XP
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" disabled={pending} className="font-semibold">
        {pending ? "…" : "Puanla"}
      </Button>
      {state?.error ? <span className="text-xs text-destructive">{state.error}</span> : null}
    </form>
  )
}

function CloseForm({ questId }: { questId: string }) {
  const [state, action, pending] = useActionState(closeQuestAction, null)
  useActionResult(state)
  return (
    <form action={action}>
      <input type="hidden" name="questId" value={questId} />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        Konuyu kapat
      </Button>
    </form>
  )
}

export function QuestBoard({
  quests,
  canAssign,
  isIntern,
}: {
  quests: QuestDTO[]
  canAssign: boolean
  isIntern: boolean
}) {
  return (
    <div className="grid gap-5">
      {canAssign ? <CreateQuestForm /> : null}
      {quests.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-sm text-muted-foreground">
          {canAssign
            ? "Henüz konu yok. Yukarıdan bir araştırma görevi açın."
            : "Açık araştırma görevi yok. Avukat konu eklediğinde burada görünür."}
        </p>
      ) : null}
      {quests.map((quest) => (
        <article key={quest.id} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                {quest.closed ? "Kapalı" : "Açık görev"} · {quest.createdByName}
              </p>
              <h2 className="mt-1 text-lg font-bold">{quest.title}</h2>
            </div>
            {canAssign && !quest.closed ? <CloseForm questId={quest.id} /> : null}
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{quest.prompt}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {formatDateTime(quest.createdAt)} · {quest.answerCount} yanıt
          </p>

          {isIntern && !quest.closed ? (
            quest.myAnswer ? (
              <div className="mt-3 rounded-xl bg-muted/60 p-3 text-sm">
                <p className="font-semibold">Sizin yanıtınız</p>
                <p className="mt-1 whitespace-pre-wrap">{quest.myAnswer.body}</p>
                <p className="mt-2 text-xs font-bold">
                  {quest.myAnswer.points != null
                    ? `+${quest.myAnswer.points} XP`
                    : "Avukat puanı bekleniyor"}
                </p>
                {quest.myAnswer.points == null ? <AnswerForm questId={quest.id} /> : null}
              </div>
            ) : (
              <AnswerForm questId={quest.id} />
            )
          ) : null}

          {isIntern && quest.closed && quest.myAnswer ? (
            <p className="mt-3 text-sm">
              Yanıtınız kaydedildi
              {quest.myAnswer.points != null ? ` · +${quest.myAnswer.points} XP` : ""}.
            </p>
          ) : null}

          {canAssign ? (
            <ul className="mt-4 grid gap-3">
              {quest.answers.length === 0 ? (
                <li className="text-sm text-muted-foreground">Henüz yanıt yok.</li>
              ) : (
                quest.answers.map((answer) => (
                  <li key={answer.id} className="rounded-xl border border-border/70 p-3">
                    <p className="text-sm font-bold">{answer.internName}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{answer.body}</p>
                    {answer.points != null ? (
                      <p className="mt-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        +{answer.points} XP verildi
                      </p>
                    ) : (
                      <GradeForm answerId={answer.id} />
                    )}
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </article>
      ))}
    </div>
  )
}
