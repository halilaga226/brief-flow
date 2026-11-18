"use client"

import type { InternBoardRow } from "@/lib/xp"
import { cn } from "@/lib/utils"
import { Crown, Swords, Trophy } from "lucide-react"
import Link from "next/link"

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
    <section className="overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-[#14261c] via-[#1c3b28] to-[#3b1d1d] p-5 text-amber-50 shadow-xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-[0.2em] text-amber-200/80 uppercase">
            Stajyer ligi
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
            Seviye tahtası
          </h2>
          <p className="mt-1 max-w-xl text-sm text-amber-100/75">
            Tamamlanan işlere avukat puan verir. Araştırma görevlerini yanıtlamak da XP kazandırır.
          </p>
        </div>
        <Link
          href="/arastirma"
          className="rounded-full bg-red-700 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-red-900/40 hover:bg-red-600"
        >
          {canAssign ? "Konu ekle / yanıtları oku" : "Araştırma görevleri"}
        </Link>
      </div>

      {you ? (
        <div className="mt-5 rounded-2xl border border-amber-300/20 bg-black/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Swords className="size-5 text-amber-300" />
              <div>
                <p className="text-sm font-bold">
                  Seviye {you.level} · {you.rankTitle}
                </p>
                <p className="text-xs text-amber-100/70">
                  {you.xp} XP · {you.jobCount} iş · {you.questCount} araştırma
                </p>
              </div>
            </div>
            <p className="font-mono text-sm font-bold text-amber-200">
              {you.into}/{you.need}
            </p>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-black/40">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-300 to-red-500"
              style={{ width: `${Math.round(you.progress * 100)}%` }}
            />
          </div>
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
                  ? "border-amber-300/50 bg-amber-400/15"
                  : "border-white/10 bg-black/15",
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
          <table className="w-full min-w-[28rem] text-left text-sm">
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
                  className={cn(
                    "border-t border-white/10",
                    row.isYou && "bg-amber-300/10",
                  )}
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
    </section>
  )
}
