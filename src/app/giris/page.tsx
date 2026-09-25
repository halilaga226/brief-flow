import { LoginForm } from "@/components/portal/login-form"
import { Scale } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Giriş",
}

const steps = [
  ["01", "Atama", "Avukat başlık, dosya ve talimatla işi iletir."],
  ["02", "Taslak", "Yürüten kişi belgeyi Drive klasörüne yükler."],
  ["03", "İnceleme", "Avukat onaylar ya da notla revize ister."],
  ["04", "Kod", "Barkod girilmeden dosya kapanmaz."],
]

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-[#12263a] text-[#e7eef5] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Scale className="pointer-events-none absolute -right-10 -bottom-16 size-80 text-white/5" />
        <div>
          <p className="text-xs tracking-[0.22em] text-[#b08968] uppercase">Hukuk bürosu</p>
          <h1 className="mt-4 max-w-md font-serif text-5xl leading-tight">
            İş, taslak ve gönderim aynı defterde.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[#c5d2df]">
            Avukat atar, stajyer yürütür, inceleme notu düşer. Her adım saatle tutulur. Bir işi yalnızca tarafları görür.
          </p>
        </div>
        <ol className="relative grid max-w-lg gap-4">
          {steps.map(([index, title, body]) => (
            <li key={index} className="grid grid-cols-[auto_1fr] gap-3">
              <span className="font-mono text-xs text-[#b08968]">{index}</span>
              <span>
                <span className="block text-sm font-medium">{title}</span>
                <span className="mt-0.5 block text-sm text-[#c5d2df]">{body}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="relative text-xs text-[#9aafc2]">
          Belgeler Google Drive klasöründe durur. Büro sunucusunda dosya kopyası tutulmaz.
        </p>
      </section>
      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <p className="font-serif text-4xl">Vekâlet</p>
            <p className="mt-2 text-sm text-muted-foreground lg:hidden">
              Avukat atar, stajyer yürütür. Kod girilmeden dosya kapanmaz.
            </p>
            <p className="mt-2 hidden text-sm text-muted-foreground lg:block">Hesabınızla büro akışına girin.</p>
          </div>
          <LoginForm />
        </div>
      </section>
    </div>
  )
}
