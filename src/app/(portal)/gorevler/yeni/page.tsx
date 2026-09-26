import { NewTaskForm } from "@/components/portal/new-task-form"
import { Button } from "@/components/ui/button"
import { getDriveStatus } from "@/lib/drive"
import { addDaysKey, istanbulDayKey } from "@/lib/format"
import { requireUser } from "@/lib/session"
import { canCreateTask } from "@/lib/workflow"
import { listAssignees } from "@/server/tasks"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Yeni görev" }

export default async function NewTaskPage() {
  const user = await requireUser()
  if (!canCreateTask(user.role)) {
    return (
      <div className="mx-auto max-w-lg rounded-xl bg-card px-6 py-12 text-center ring-1 ring-foreground/10">
        <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Yetki</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Bu hesap görev atayamaz</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Bu hesap yalnızca kendisine atanan işleri görür, taslağı yükler ve onaydan sonra evrak kodunu işler.
        </p>
        <Button asChild className="mt-5 bg-[#16324f]">
          <Link href="/gorevler">Görevlere dön</Link>
        </Button>
      </div>
    )
  }

  const people = await listAssignees(user)
  const drive = getDriveStatus()
  const defaultDue = addDaysKey(istanbulDayKey(new Date()), 3)

  return (
    <div className="mx-auto grid max-w-3xl gap-5">
      <div>
        <Link href="/gorevler" className="text-sm text-muted-foreground hover:text-foreground">
          Görevlere dön
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Yeni görev</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          İş, seçtiğiniz avukat veya stajyere düşer. Üçüncü kişiler bu kaydı göremez.
        </p>
      </div>
      <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10 md:p-6">
        {people.length === 0 ? (
          <p className="text-sm text-muted-foreground">Atanacak başka kullanıcı yok.</p>
        ) : (
          <NewTaskForm people={people} defaultDue={defaultDue} drive={drive} />
        )}
      </div>
    </div>
  )
}
