import { TaskLinkList } from "@/components/portal/task-link-list"
import { Button } from "@/components/ui/button"
import { formatTodayLabel, greeting } from "@/lib/format"
import { requireUser } from "@/lib/session"
import { canCreateTask, isAdmin, roleLabel } from "@/lib/workflow"
import { listClientCalls } from "@/server/admin"
import { getDashboard } from "@/server/tasks"
import { Phone } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Panel" }

export default async function PanelPage() {
  const user = await requireUser()
  const [dashboard, calls] = await Promise.all([
    getDashboard(user.id, user.role),
    listClientCalls(user),
  ])
  const firstName = user.name.split(" ")[0]
  const stats = [
    {
      label: "Sizden beklenen",
      value: dashboard.counts.awaiting,
      href: "/gorevler?filtre=bekleyen",
      hint: dashboard.counts.overdue > 0 ? `${dashboard.counts.overdue} gecikmiş` : "Sıradaki adım sizde",
    },
    {
      label: "Arama yapılacak",
      value: calls.length,
      href: "/gorevler?filtre=arama",
      hint: "Müvekkil araması bekliyor",
    },
    {
      label: "İncelemede",
      value: dashboard.counts.inReview,
      href: "/gorevler?filtre=inceleme",
      hint: "Taslak avukat bakıyor",
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
          <p className="text-xs font-bold tracking-[0.14em] text-zinc-500 uppercase">
            {formatTodayLabel()}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">
            {greeting()}, {firstName}.
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-zinc-600">
            {isAdmin(user.role)
              ? "Yönetici olarak tüm işleri görür ve düzenlersiniz."
              : user.role === "LAWYER"
                ? "Atadığınız ve size atanan işleri görürsünüz."
                : "Yalnızca size atanan işleri görürsünüz."}{" "}
            Rolünüz: {user.title || roleLabel(user.role)}.
          </p>
        </div>
        {canCreateTask(user.role) ? (
          <Button asChild className="bg-zinc-900 font-bold">
            <Link href="/gorevler/yeni">İş ata</Link>
          </Button>
        ) : null}
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-yellow-300 hover:bg-yellow-50"
          >
            <p className="text-xs font-bold tracking-[0.14em] text-zinc-500 uppercase">{stat.label}</p>
            <p className="mt-2 text-4xl font-bold tracking-tight">{stat.value}</p>
            <p className="mt-1 text-xs font-medium text-zinc-500">{stat.hint}</p>
          </Link>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Sıradaki işleriniz</h2>
            <Link
              href="/gorevler?filtre=bekleyen"
              className="text-sm font-bold text-zinc-900 underline-offset-4 hover:underline"
            >
              Tümü
            </Link>
          </div>
          <div className="mt-2">
            <TaskLinkList tasks={dashboard.awaiting} />
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Phone className="size-5 text-red-600" />
              Arama yapılacak
            </h2>
            <Link
              href="/gorevler?filtre=arama"
              className="text-sm font-bold text-zinc-900 underline-offset-4 hover:underline"
            >
              Liste
            </Link>
          </div>
          {calls.length === 0 ? (
            <p className="mt-4 text-sm font-medium text-zinc-500">Bekleyen müvekkil araması yok.</p>
          ) : (
            <ul className="mt-3 divide-y divide-zinc-100">
              {calls.slice(0, 8).map((item) => (
                <li key={item.id} className="py-3">
                  <Link href={`/gorevler/${item.id}`} className="block hover:text-red-700">
                    <span className="block text-sm font-bold">{item.clientName}</span>
                    <span className="mt-0.5 block text-sm font-medium text-zinc-600">{item.title}</span>
                    <span className="mt-1 block font-mono text-xs text-zinc-400">{item.fileNumber}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-xl font-bold">Son hareket</h2>
        {dashboard.activity.length === 0 ? (
          <p className="mt-4 text-sm font-medium text-zinc-500">Henüz işlem kaydı yok.</p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-100">
            {dashboard.activity.map((item) => (
              <li key={item.id} className="py-3">
                <Link href={`/gorevler/${item.taskId}`} className="block hover:text-zinc-950">
                  <span className="block text-sm font-bold">{item.label}</span>
                  <span className="mt-0.5 block text-sm font-medium text-zinc-600">{item.taskTitle}</span>
                  <span className="mt-1 block text-xs font-medium text-zinc-400">
                    {item.actorName} · {item.when}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
