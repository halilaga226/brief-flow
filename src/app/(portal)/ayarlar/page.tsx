import { ClearDemoButton } from "@/components/portal/clear-demo-button"
import { PasswordForm } from "@/components/portal/password-form"
import { StatusBadge } from "@/components/portal/status-badge"
import { Button } from "@/components/ui/button"
import { formatTodayLabel, greeting } from "@/lib/format"
import { requireUser } from "@/lib/session"
import {
  canManageUsers,
  CLIENT_CALL_META,
  isAdmin,
  roleLabel,
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
        <p className="text-xs font-bold tracking-[0.14em] text-[var(--brand-muted)] uppercase">
          {formatTodayLabel()}
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight md:text-4xl">
          {greeting()}, {firstName}
        </h1>
        <p className="mt-2 text-sm font-medium text-[var(--brand-muted)]">
          {user.title || roleLabel(user.role)} · {user.email}
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "Sizden beklenen",
            value: dashboard.counts.awaiting,
            href: "/gorevler?filtre=bekleyen",
          },
          {
            label: "Arama yapılacak",
            value: calls.length,
            href: "/gorevler?filtre=arama",
          },
          {
            label: "Açık iş",
            value: dashboard.counts.active,
            href: "/gorevler",
          },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-2xl border border-[var(--brand-border)] bg-white p-4 shadow-[0_1px_0_rgba(15,61,46,0.04)] transition hover:border-[var(--brand-accent)] hover:bg-[var(--brand-soft)]"
          >
            <p className="text-xs font-bold tracking-wide text-[var(--brand-muted)] uppercase">
              {stat.label}
            </p>
            <p className="mt-2 text-3xl font-bold text-[var(--brand-ink)]">{stat.value}</p>
          </Link>
        ))}
      </section>

      {calls.length > 0 ? (
        <section className="rounded-2xl border border-[var(--brand-border)] bg-white p-4">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Phone className="size-5 text-[var(--brand-danger)]" />
            Arama yapılacak
          </h2>
          <ul className="mt-3 divide-y divide-[var(--brand-border)]">
            {calls.slice(0, 6).map((item) => (
              <li key={item.id} className="py-3">
                <Link href={`/gorevler/${item.id}`} className="block">
                  <span className="block text-sm font-bold">{item.clientName}</span>
                  <span className="text-sm font-medium text-[var(--brand-muted)]">{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {manageUsers ? (
        <section className="rounded-2xl border border-[var(--brand-border)] bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Users className="size-5 text-[var(--brand-primary)]" />
                Kullanıcılar
              </h2>
              <p className="mt-1 text-sm font-medium text-[var(--brand-muted)]">
                Avukat ve stajyer ekleyin veya silin.
              </p>
            </div>
            <Button asChild className="bg-[var(--brand-primary)] font-bold hover:bg-[var(--brand-primary-hover)]">
              <Link href="/kullanicilar">Kullanıcı paneli</Link>
            </Button>
          </div>
        </section>
      ) : null}

      {overview ? (
        <section className="rounded-2xl border border-[var(--brand-border)] bg-white p-4">
          <h2 className="text-lg font-bold">Büro özeti</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            {[
              { label: "Toplam iş", value: overview.counts.tasks },
              { label: "Açık", value: overview.counts.open },
              { label: "Arama", value: overview.counts.calls },
              { label: "Kullanıcı", value: overview.counts.users },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-[var(--brand-soft)] px-3 py-2">
                <p className="text-[11px] font-bold tracking-wide text-[var(--brand-muted)] uppercase">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-[var(--brand-border)] pt-4">
            <h3 className="font-bold">Örnek veriyi sıfırla</h3>
            <p className="mt-1 text-sm font-medium text-[var(--brand-muted)]">
              Seed işlerini ve @vekalet.local hesaplarını siler. Sizin hesabınız kalır.
            </p>
            <div className="mt-3">
              <ClearDemoButton />
            </div>
          </div>

          {overview.recentTasks.length > 0 ? (
            <div className="mt-5 border-t border-[var(--brand-border)] pt-4">
              <h3 className="font-bold">Son işler</h3>
              <ul className="mt-2 divide-y divide-[var(--brand-border)]">
                {overview.recentTasks.slice(0, 6).map((task) => (
                  <li key={task.id}>
                    <Link
                      href={`/gorevler/${task.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 py-3"
                    >
                      <span>
                        <span className="block text-sm font-bold">{task.title}</span>
                        <span className="text-xs font-medium text-[var(--brand-muted)]">
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

      <section className="rounded-2xl border border-[var(--brand-border)] bg-white p-4">
        <h2 className="text-lg font-bold">Parola</h2>
        <div className="mt-3">
          <PasswordForm />
        </div>
      </section>
    </div>
  )
}
