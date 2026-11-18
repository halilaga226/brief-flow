"use client"

import { awardBonusXpAction } from "@/actions/xp"
import { useActionResult } from "@/components/portal/use-action-result"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { InternBoardRow } from "@/lib/xp"
import { MAX_POINTS } from "@/lib/xp"
import { cn } from "@/lib/utils"
import { Crown, Sparkles, Trophy } from "lucide-react"
import { useActionState } from "react"

function BonusForm({ interns }: { interns: InternBoardRow[] }) {
  const [state, action, pending] = useActionState(awardBonusXpAction, null)
  useActionResult(state)
  if (interns.length === 0) return null
  return (
    <form
      action={action}
      className="mt-6 grid gap-3 rounded-2xl border border-amber-300/25 bg-black/25 p-4"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-amber-300" />
        <h3 className="text-sm font-bold">Ek puan ver</h3>
      </div>
      <p className="text-xs text-amber-100/70">
        İş veya araştırmaya bağlı olmadan, özen veya hız için 1–{MAX_POINTS} XP.
      </p>
      <div className="grid gap-2 sm:grid-cols-3">
        <select
          name="internId"
          required
          className="h-10 rounded-lg border border-white/15 bg-black/40 px-2 text-sm font-semibold"
          defaultValue={interns[0]?.id}
        >
          {interns.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </select>
        <select
          name="points"
          className="h-10 rounded-lg border border-white/15 bg-black/40 px-2 text-sm font-semibold"
          defaultValue="3"
        >
          {Array.from({ length: MAX_POINTS }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} XP
            </option>
          ))}
        </select>
        <Input name="note" placeholder="Kısa gerekçe" className="h-10 border-white/15 bg-black/40 text-amber-50" />
      </div>
      {state?.error ? (
        <p className="text-sm font-medium text-red-200" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-fit bg-amber-400 font-bold text-stone-900 hover:bg-amber-300">
        {pending ? "İşleniyor…" : "XP ekle"}
      </Button>
    </form>
  )
}

export function InternGameBoard({
  rows,
  canAssign,
}: {
  rows: InternBoardRow[]
  canAssign: boolean
}) {
  const you = rows.find((row) => row.isYou)
  const podium = rows.slice(0, 3)

  return (
    <section className="relative overflow-hidden rounded-3xl border border-amber-400/35 bg-gradient-to-br from-[#0f241c] via-[#163528] to-[#2a1616] p-5 text-amber-50 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/80 to-transparent" />
      <div className="relative">
        <p className="text-[11px] font-bold tracking-[0.22em] text-amber-200/80 uppercase">
          Sezon ligi
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
          Stajyer ilerlemesi
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-amber-100/75">
          Avukatlar tamamlanan işe, araştırmaya ve buradan ek puana XP verir. Tüm avukatlar sıralamayı görür.
        </p>
      </div>

      {you ? (
        <div className="relative mt-5 rounded-2xl border border-amber-300/25 bg-gradient-to-r from-amber-500/10 to-red-700/10 p-4">
          <p className="text-sm font-bold">
            Seviye {you.level} · {you.rankTitle}
          </p>
          <p className="text-xs text-amber-100/70">
            {you.xp} XP · {you.jobCount} iş · {you.questCount} araştırma · {you.bonusCount} ek puan
          </p>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-black/45">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-200 via-amber-400 to-red-500"
              style={{ width: `${Math.round(you.progress * 100)}%` }}
            />
          </div>
          <p className="mt-1 text-right font-mono text-xs text-amber-200">
            {you.into}/{you.need}
          </p>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-amber-100/70">Henüz stajyer kaydı yok.</p>
      ) : (
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {podium.map((row, index) => (
            <div
              key={row.id}
              className={cn(
                "rounded-2xl border p-4",
                index === 0
                  ? "border-amber-300/60 bg-amber-400/15 shadow-[0_0_24px_rgba(251,191,36,0.18)]"
                  : "border-white/10 bg-black/20",
              )}
            >
              <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-amber-200">
                {index === 0 ? <Crown className="size-3.5" /> : <Trophy className="size-3.5" />}
                {index + 1}. sıra
              </p>
              <p className="mt-2 text-lg font-bold leading-tight">{row.name}</p>
              <p className="text-xs text-amber-100/70">
                Sv. {row.level} · {row.rankTitle}
              </p>
              <p className="mt-2 font-mono text-sm font-bold">{row.xp} XP</p>
            </div>
          ))}
        </div>
      )}

      {rows.length > 0 ? (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="text-[11px] tracking-wide text-amber-200/70 uppercase">
              <tr>
                <th className="py-2 pr-2 font-semibold">Sıra</th>
                <th className="py-2 pr-2 font-semibold">Stajyer</th>
                <th className="py-2 pr-2 font-semibold">Unvan</th>
                <th className="py-2 pr-2 font-semibold">Sv.</th>
                <th className="py-2 pr-2 font-semibold">XP</th>
                <th className="py-2 font-semibold">İlerleme</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={cn("border-t border-white/10", row.isYou && "bg-amber-300/10")}
                >
                  <td className="py-2 pr-2 font-mono">{index + 1}</td>
                  <td className="py-2 pr-2 font-semibold">
                    {row.name}
                    {row.isYou ? " (siz)" : ""}
                  </td>
                  <td className="py-2 pr-2 text-amber-100/80">{row.rankTitle}</td>
                  <td className="py-2 pr-2 font-mono">{row.level}</td>
                  <td className="py-2 pr-2 font-mono">{row.xp}</td>
                  <td className="py-2">
                    <div className="h-2 w-28 overflow-hidden rounded-full bg-black/40">
                      <div
                        className="h-full rounded-full bg-amber-300"
                        style={{ width: `${Math.round(row.progress * 100)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {canAssign ? <BonusForm interns={rows} /> : null}
    </section>
  )
}
