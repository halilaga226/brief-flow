"use client"

import { Button } from "@/components/ui/button"

export default function RootError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="font-serif text-4xl">Vekâlet</p>
      <h1 className="mt-3 text-xl">Bir sorun oluştu</h1>
      <p className="mt-2 text-sm text-muted-foreground">Sayfa yenilenemedi.</p>
      <Button type="button" className="mt-5" onClick={() => reset()}>
        Yeniden dene
      </Button>
    </main>
  )
}
