import { QuestBoard } from "@/components/portal/quest-board"
import { InternGameBoard } from "@/components/portal/intern-game-board"
import { requireUser } from "@/lib/session"
import { canCreateTask } from "@/lib/workflow"
import { listInternBoard, listQuests } from "@/server/xp"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Araştırma ve lig" }

export default async function ArastirmaPage() {
  const user = await requireUser()
  const [quests, board] = await Promise.all([listQuests(user), listInternBoard(user)])
  const canAssign = canCreateTask(user.role)

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Araştırma görevleri</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Avukat konu açar, stajyer yanıtlar, doğru ve özenli yanıt XP kazandırır.
        </p>
      </div>
      <InternGameBoard rows={board} canAssign={canAssign} />
      <QuestBoard quests={quests} canAssign={canAssign} isIntern={user.role === "INTERN"} />
    </div>
  )
}
