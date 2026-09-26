"use client"

import { Button } from "@/components/ui/button"
import { BRAND } from "@/lib/brand"

export default function RootError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="font-[family-name:var(--font-display)] text-3xl font-bold">{BRAND.shortName}</p>
      <h1 className="mt-3 text-xl font-bold">Bir sorun oluştu</h1>
      <p className="mt-2 text-sm font-medium text-[var(--brand-muted)]">Sayfa yenilenemedi.</p>
      <Button type="button" className="mt-5 bg-[var(--brand-primary)] font-bold" onClick={() => reset()}>
        Yeniden dene
      </Button>
    </main>
  )
}
