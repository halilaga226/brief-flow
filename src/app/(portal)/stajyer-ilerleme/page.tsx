import { InternGameBoard } from "@/components/portal/intern-game-board"
import { QuestBoard } from "@/components/portal/quest-board"
import { requireUser } from "@/lib/session"
import { canCreateTask } from "@/lib/workflow"
import { listInternBoard, listQuests } from "@/server/xp"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Stajyer ilerlemesi" }

export default async function StajyerIlerlemePage() {
  const user = await requireUser()
  const [quests, board] = await Promise.all([listQuests(user), listInternBoard(user)])
  const canAssign = canCreateTask(user.role)

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <div>
        <p className="text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">
          Oyun tahtası
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Stajyer ilerlemesi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tamamlanan her görev +5 XP. Lig ve araştırma tek yerde; avukatlar ek puan verebilir.
        </p>
      </div>
      <InternGameBoard rows={board} canAssign={canAssign} />
      <section className="grid gap-3">
        <h2 className="text-xl font-semibold tracking-tight">Araştırma görevleri</h2>
        <QuestBoard quests={quests} canAssign={canAssign} isIntern={user.role === "INTERN"} />
      </section>
    </div>
  )
}
