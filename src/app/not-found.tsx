import { BRAND } from "@/lib/brand"
import Link from "next/link"

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="font-[family-name:var(--font-display)] text-3xl font-bold">{BRAND.shortName}</p>
      <h1 className="mt-4 text-xl font-bold">Sayfa bulunamadı</h1>
      <Link href="/gorevler" className="mt-4 text-sm font-bold text-[var(--brand-primary)] underline underline-offset-4">
        Görevlere dön
      </Link>
    </main>
  )
}
