import { RANK_LADDER, XP_PER_LEVEL } from "@/lib/xp"
import { cn } from "@/lib/utils"

export function RankLadder({ currentLevel }: { currentLevel?: number }) {
  return (
    <section className="rounded-2xl border border-amber-300/20 bg-black/20 p-4">
      <h3 className="text-sm font-bold">Ünvan listesi</h3>
      <p className="mt-1 text-xs text-amber-100/70">
        Her seviye {XP_PER_LEVEL} XP. Puan birikince unvan değişir.
      </p>
      <ol className="mt-3 grid gap-1.5 sm:grid-cols-2">
        {RANK_LADDER.map((rank) => {
          const range =
            rank.toXp == null ? `${rank.fromXp}+ XP` : `${rank.fromXp}–${rank.toXp} XP`
          const active = currentLevel === rank.level || (rank.toXp == null && (currentLevel ?? 0) >= rank.level)
          return (
            <li
              key={rank.level}
              className={cn(
                "flex items-center justify-between rounded-xl px-3 py-2 text-sm",
                active ? "bg-amber-400/20 font-bold" : "bg-white/5",
              )}
            >
              <span>
                Sv. {rank.level} · {rank.title}
              </span>
              <span className="font-mono text-xs text-amber-200">{range}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
