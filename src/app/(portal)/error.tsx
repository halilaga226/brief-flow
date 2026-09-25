"use client"

import { Button } from "@/components/ui/button"

export default function PortalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg rounded-xl bg-card px-6 py-12 text-center ring-1 ring-foreground/10">
      <h1 className="font-serif text-3xl">Sayfa açılamadı</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Kayıt okunurken bir sorun oluştu. Yeniden deneyin.
      </p>
      <Button type="button" className="mt-5 bg-[#16324f]" onClick={() => reset()}>
        Yeniden dene
      </Button>
    </div>
  )
}
