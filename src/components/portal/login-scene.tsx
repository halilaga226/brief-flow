"use client"

import { LoginForm } from "@/components/portal/login-form"
import { ThemeToggle } from "@/components/theme-toggle"
import { BRAND } from "@/lib/brand"
import { Scale } from "lucide-react"

export function LoginScene({ showDemo = false }: { showDemo?: boolean }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b14] text-white">
      <div className="absolute inset-0 overflow-hidden">
        <video
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-70 blur-[2px]"
          autoPlay
          muted
          loop
          playsInline
          poster="/media/horses-poster.jpg"
          aria-hidden
        >
          <source src="/media/horses.mp4" type="video/mp4" />
        </video>
        <div
          className="absolute inset-0 scale-105 bg-cover bg-center opacity-55 blur-[1.5px] motion-safe:animate-[login-drift_28s_ease-in-out_infinite_alternate]"
          style={{ backgroundImage: "url(/media/horses-poster.jpg)" }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-[#070b14]/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070b14]/95 via-[#070b14]/65 to-[#070b14]/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-transparent to-[#070b14]/45" />
      </div>

      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-5 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div className="max-w-xl">
          <span className="mb-5 inline-flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/40">
            <Scale className="size-6" />
          </span>
          <p className="text-sm font-semibold tracking-[0.2em] text-orange-300 uppercase">
            Hukuk bürosu portalı
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {BRAND.name}
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-slate-200/90">
            Görev, inceleme ve gönderim akışı tek yerde. Canlı durum renkleriyle geciken,
            yaklaşan ve tamamlanan işleri bir bakışta görün.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {[
              { label: "Geciken", color: "bg-red-500" },
              { label: "Yaklaşan", color: "bg-orange-500" },
              { label: "İnceleme", color: "bg-violet-500" },
              { label: "Tamam", color: "bg-emerald-500" },
            ].map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/15 backdrop-blur"
              >
                <span className={`size-2 rounded-full ${item.color}`} />
                {item.label}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/15 bg-white/10 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-7">
          <p className="mb-4 text-sm font-medium text-slate-200">Kullanıcı adınızla giriş yapın</p>
          <div className="rounded-2xl bg-card p-4 text-card-foreground sm:p-5">
            <LoginForm showDemo={showDemo} />
          </div>
        </div>
      </div>
    </div>
  )
}
