import { LoginForm } from "@/components/portal/login-form"
import { ThemeToggle } from "@/components/theme-toggle"
import { BRAND } from "@/lib/brand"
import { Scale } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Giriş",
}

export default function LoginPage() {
  const showDemo = process.env.DEMO_LOGIN === "true"

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,color-mix(in_oklab,var(--primary)_22%,transparent),transparent_42%),radial-gradient(circle_at_85%_10%,color-mix(in_oklab,var(--brand-accent)_28%,transparent),transparent_38%)]" />
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="relative mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-5 py-10">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <Scale className="size-6" />
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {BRAND.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Kullanıcı adınızla giriş yapın</p>
        </div>
        <div className="rounded-3xl border border-border bg-card/95 p-5 shadow-xl shadow-primary/5 sm:p-7">
          <LoginForm showDemo={showDemo} />
        </div>
      </div>
    </div>
  )
}
