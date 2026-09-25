import Link from "next/link"

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="font-serif text-4xl">Vekâlet</p>
      <h1 className="mt-4 text-xl">Sayfa bulunamadı</h1>
      <Link href="/panel" className="mt-4 text-sm underline underline-offset-4">
        Panele dön
      </Link>
    </main>
  )
}
