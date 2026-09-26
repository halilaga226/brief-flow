import { ClearDemoButton } from "@/components/portal/clear-demo-button"
import { StatusBadge } from "@/components/portal/status-badge"
import { requireUser } from "@/lib/session"
import { CLIENT_CALL_META, isAdmin, type TaskStatus } from "@/lib/workflow"
import { getAdminOverview } from "@/server/admin"
import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

export const metadata: Metadata = { title: "Yönetim" }

export default async function AdminPage() {
  const user = await requireUser()
  if (!isAdmin(user.role)) {
    redirect("/panel")
  }
  const overview = await getAdminOverview(user)

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <div>
        <p className="text-xs font-bold tracking-[0.14em] text-zinc-500 uppercase">Büro</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">Yönetim paneli</h1>
        <p className="mt-2 max-w-2xl text-sm font-medium text-zinc-600">
          Tüm işler, örnek veri temizliği ve müvekkil arama kuyruğu burada.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Toplam iş", value: overview.counts.tasks },
          { label: "Açık iş", value: overview.counts.open },
          { label: "Arama bekleyen", value: overview.counts.calls },
          { label: "Kullanıcı", value: overview.counts.users },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-bold tracking-wide text-zinc-500 uppercase">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-lg font-bold">Örnek veriyi sıfırla</h2>
        <p className="mt-1 text-sm font-medium text-zinc-600">
          Seed ile gelen örnek işleri ve{" "}
          <span className="font-mono text-xs">@vekalet.local</span> hesaplarını siler. Kendi
          yönetici hesabınız ve gerçek kullanıcılar kalır. Giriş ekranındaki örnek kartlar da
          bu hesaplarla çalıştığı için sıfırladıktan sonra yalnızca oluşturduğunuz hesaplarla
          devam edersiniz.
        </p>
        <div className="mt-4">
          <ClearDemoButton />
        </div>
        {overview.demoUsers.length > 0 ? (
          <ul className="mt-4 grid gap-1 text-sm font-medium text-zinc-600">
            {overview.demoUsers.map((demo) => (
              <li key={demo.id}>
                {demo.name}{" "}
                <span className="font-mono text-xs text-zinc-400">{demo.email}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm font-semibold text-yellow-800">Örnek hesap kalmamış.</p>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
          <h2 className="text-lg font-bold">Son işler</h2>
          <Link href="/gorevler" className="text-sm font-bold underline-offset-4 hover:underline">
            Tümü
          </Link>
        </div>
        {overview.recentTasks.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm font-medium text-zinc-500">İş yok.</p>
        ) : (
          <ul>
            {overview.recentTasks.map((task) => (
              <li key={task.id} className="border-b border-zinc-100 last:border-b-0">
                <Link
                  href={`/gorevler/${task.id}`}
                  className="grid gap-2 px-4 py-3 transition hover:bg-yellow-50 md:grid-cols-[1.4fr_0.9fr_0.7fr_0.8fr] md:items-center"
                >
                  <div>
                    <p className="text-sm font-bold">{task.title}</p>
                    <p className="text-xs font-medium text-zinc-500">{task.clientName}</p>
                  </div>
                  <p className="text-sm font-medium text-zinc-600">
                    {task.assignerName}
                    <span className="mx-1 text-zinc-300">→</span>
                    {task.assigneeName}
                  </p>
                  <StatusBadge status={task.status as TaskStatus} />
                  <p className="text-xs font-semibold text-zinc-500">
                    {task.expensePaid ? "Masraf ✓" : "Masraf —"}
                    <span className="mx-1">·</span>
                    {CLIENT_CALL_META[task.clientCallStatus]}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
