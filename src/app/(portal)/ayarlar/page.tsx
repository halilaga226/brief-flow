import { ClearDemoButton } from "@/components/portal/clear-demo-button"
import { IntroToggle } from "@/components/portal/intro-tour"
import { PasswordForm } from "@/components/portal/password-form"
import { StatusBadge } from "@/components/portal/status-badge"
import { Button } from "@/components/ui/button"
import { formatTodayLabel, greeting } from "@/lib/format"
import { requireUser } from "@/lib/session"
import {
  canManageUsers,
  CLIENT_CALL_META,
  isAdmin,
  type TaskStatus,
} from "@/lib/workflow"
import { getAdminOverview, listClientCalls } from "@/server/admin"
import { getDashboard } from "@/server/tasks"
import { Phone, Users } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Ayarlar" }

export default async function SettingsPage() {
  const user = await requireUser()
  const [dashboard, calls, overview] = await Promise.all([
    getDashboard(user.id, user.role),
    listClientCalls(user),
    isAdmin(user.role) ? getAdminOverview(user) : Promise.resolve(null),
  ])
  const firstName = user.name.split(" ")[0]
  const manageUsers = canManageUsers(user.role)

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          {formatTodayLabel()}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
          {greeting()}, {firstName}
        </h1>
      </div>

      <IntroToggle />

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "Sıradaki",
            value: dashboard.counts.awaiting,
            href: "/gorevler?filtre=bekleyen",
          },
          {
            label: "Arama",
            value: calls.length,
            href: "/gorevler?filtre=arama",
          },
          {
            label: "Açık",
            value: dashboard.counts.active,
            href: "/gorevler",
          },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="glass rounded-2xl p-4 transition hover:-translate-y-0.5"
          >
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {stat.label}
            </p>
            <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
          </Link>
        ))}
      </section>

      {calls.length > 0 ? (
        <section className="glass rounded-2xl p-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Phone className="size-5 text-destructive" />
            Arama
          </h2>
          <ul className="mt-3 divide-y divide-border">
            {calls.slice(0, 6).map((item) => (
              <li key={item.id} className="py-3">
                <Link href={`/gorevler/${item.id}`} className="block">
                  <span className="block text-sm font-semibold">{item.clientName}</span>
                  <span className="text-sm text-muted-foreground">{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {manageUsers ? (
        <section className="glass rounded-2xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Users className="size-5 text-primary" />
              Kullanıcılar
            </h2>
            <Button asChild className="font-semibold">
              <Link href="/kullanicilar">Aç</Link>
            </Button>
          </div>
        </section>
      ) : null}

      {overview ? (
        <section className="glass rounded-2xl p-4">
          <h2 className="text-lg font-semibold">Büro</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            {[
              { label: "İş", value: overview.counts.tasks },
              { label: "Açık", value: overview.counts.open },
              { label: "Arama", value: overview.counts.calls },
              { label: "Kullanıcı", value: overview.counts.users },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-muted/60 px-3 py-2">
                <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-border pt-4">
            <h3 className="font-semibold">Örnek veri</h3>
            <div className="mt-3">
              <ClearDemoButton />
            </div>
          </div>

          {overview.recentTasks.length > 0 ? (
            <div className="mt-5 border-t border-border pt-4">
              <h3 className="font-semibold">Son işler</h3>
              <ul className="mt-2 divide-y divide-border">
                {overview.recentTasks.slice(0, 6).map((task) => (
                  <li key={task.id}>
                    <Link
                      href={`/gorevler/${task.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 py-3"
                    >
                      <span>
                        <span className="block text-sm font-semibold">{task.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {task.clientName} · {CLIENT_CALL_META[task.clientCallStatus]}
                        </span>
                      </span>
                      <StatusBadge status={task.status as TaskStatus} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="glass rounded-2xl p-4">
        <h2 className="text-lg font-semibold">Parola</h2>
        <div className="mt-3">
          <PasswordForm />
        </div>
      </section>
    </div>
  )
}
