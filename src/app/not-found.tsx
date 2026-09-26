import { BRAND } from "@/lib/brand"
import Link from "next/link"

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="text-3xl font-semibold">{BRAND.shortName}</p>
      <h1 className="mt-4 text-xl font-semibold">Sayfa bulunamadı</h1>
      <Link href="/gorevler" className="mt-4 text-sm font-semibold text-[var(--brand-primary)] underline underline-offset-4">
        Görevlere dön
      </Link>
    </main>
  )
}
