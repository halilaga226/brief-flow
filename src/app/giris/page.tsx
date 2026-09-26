import { LoginForm } from "@/components/portal/login-form"
import { BRAND } from "@/lib/brand"
import { Scale } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Giriş",
}

export default function LoginPage() {
  const showDemo = process.env.DEMO_LOGIN === "true"

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--brand-canvas)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(46,196,182,0.22),transparent_42%),radial-gradient(circle_at_88%_12%,rgba(255,159,67,0.28),transparent_36%),radial-gradient(circle_at_70%_80%,rgba(15,61,46,0.08),transparent_40%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-5 py-10">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-[var(--brand-primary)] text-white shadow-lg shadow-[var(--brand-primary)]/25">
            <Scale className="size-6" />
          </span>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[var(--brand-ink)] sm:text-4xl">
            {BRAND.name}
          </h1>
          <p className="mt-2 text-sm font-semibold text-[var(--brand-muted)]">Büro hesabınızla giriş yapın</p>
        </div>
        <div className="rounded-3xl border border-[var(--brand-border)] bg-white/95 p-5 shadow-[0_18px_50px_rgba(15,61,46,0.08)] sm:p-7">
          <LoginForm showDemo={showDemo} />
        </div>
      </div>
    </div>
  )
}
