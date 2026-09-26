import { TaskLinkList } from "@/components/portal/task-link-list"
import { Button } from "@/components/ui/button"
import { formatTodayLabel, greeting } from "@/lib/format"
import { requireUser } from "@/lib/session"
import { canCreateTask, isAdmin, roleLabel } from "@/lib/workflow"
import { getDashboard } from "@/server/tasks"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Panel" }

const steps = [
  ["Atama", "Avukat işi ve talimatı açar."],
  ["Taslak", "Yürüten kişi belgeyi yükler."],
  ["İnceleme", "Onay ya da revizyon notu."],
  ["Gönderim", "Evrak merciye iletilir."],
  ["Kod", "Barkod olmadan kapanmaz."],
]

export default async function PanelPage() {
  const user = await requireUser()
  const dashboard = await getDashboard(user.id, user.role)
  const firstName = user.name.split(" ")[0]
  const stats = [
    {
      label: "Sizden beklenen",
      value: dashboard.counts.awaiting,
      href: "/gorevler?filtre=bekleyen",
      hint: dashboard.counts.overdue > 0 ? `${dashboard.counts.overdue} gecikmiş` : "Sıradaki adım sizde",
    },
    {
      label: "İncelemede",
      value: dashboard.counts.inReview,
      href: "/gorevler?filtre=inceleme",
      hint: "Taslak avukat bakıyor",
    },
    {
      label: "Yaklaşan teslim",
      value: dashboard.counts.dueSoon,
      href: "/gorevler?filtre=yaklasan",
      hint: "Bugün ve sonraki iki gün",
    },
    {
      label: "Bu ay kapanan",
      value: dashboard.counts.completedThisMonth,
      href: "/gorevler?filtre=tamam",
      hint: `${dashboard.counts.active} açık iş`,
    },
  ]

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">{formatTodayLabel()}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
            {greeting()}, {firstName}.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {isAdmin(user.role)
              ? "Yönetici olarak tüm işleri görür ve düzenlersiniz."
              : user.role === "LAWYER"
                ? "Atadığınız ve size atanan işleri görürsünüz."
                : "Yalnızca size atanan işleri görürsünüz."}{" "}
            Rolünüz: {user.title || roleLabel(user.role)}.
          </p>
        </div>
        {canCreateTask(user.role) ? (
          <Button asChild className="bg-zinc-900">
            <Link href="/gorevler/yeni">İş ata</Link>
          </Button>
        ) : null}
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition hover:-translate-y-px hover:ring-zinc-300"
          >
            <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">{stat.label}</p>
            <p className="mt-2 text-4xl font-semibold tracking-tight">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-zinc-800 sm:grid-cols-5">
        {steps.map(([title, body], index) => (
          <div key={title} className="border-zinc-200 sm:border-l sm:pl-3 sm:first:border-l-0 sm:first:pl-0">
            <p className="font-mono text-[11px] text-zinc-400">0{index + 1}</p>
            <p className="mt-1 text-sm font-medium">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">{body}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Sıradaki işleriniz</h2>
            <Link href="/gorevler?filtre=bekleyen" className="text-sm text-zinc-900 underline-offset-4 hover:underline">
              Tümü
            </Link>
          </div>
          <div className="mt-2">
            <TaskLinkList tasks={dashboard.awaiting} />
          </div>
        </section>
        <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <h2 className="text-xl font-semibold">Son hareket</h2>
          {dashboard.activity.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Henüz işlem kaydı yok.</p>
          ) : (
            <ul className="mt-3 divide-y">
              {dashboard.activity.map((item) => (
                <li key={item.id} className="py-3">
                  <Link href={`/gorevler/${item.taskId}`} className="block hover:text-[#16324f]">
                    <span className="block text-sm font-medium">{item.label}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">{item.taskTitle}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {item.actorName} · {item.when}
                    </span>
                    {item.note ? (
                      <span className="mt-1 line-clamp-2 block text-xs text-foreground/75">{item.note}</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
