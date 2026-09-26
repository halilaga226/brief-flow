import { LoginForm } from "@/components/portal/login-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Giriş",
}

export default function LoginPage() {
  const showDemo = process.env.DEMO_LOGIN === "true"

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden items-end bg-zinc-950 px-10 py-12 text-white lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(250,204,21,0.18),transparent_42%)]" />
        <div className="relative max-w-md">
          <p className="text-sm font-medium text-yellow-300">Vekâlet</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            İşler net. Renkler net.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-zinc-300">
            Sarı: gelen veya biten iş. Kırmızı: süresi gelen veya revizeye dönen iş. Yönetici tüm
            dosyaları görür.
          </p>
        </div>
      </section>
      <section className="flex items-center justify-center bg-white px-5 py-10">
        <div className="w-full max-w-md">
          <p className="text-2xl font-semibold tracking-tight">Giriş</p>
          <p className="mt-1 text-sm text-zinc-500">Büro hesabınızla devam edin.</p>
          <div className="mt-8">
            <LoginForm showDemo={showDemo} />
          </div>
        </div>
      </section>
    </div>
  )
}
