import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function PortalNotFound() {
  return (
    <div className="mx-auto max-w-lg rounded-xl bg-card px-6 py-12 text-center ring-1 ring-foreground/10">
      <h1 className="font-serif text-3xl">Bu kayda ulaşılamıyor</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Kayıt yok ya da taraflarından biri değilsiniz. Başka bir avukatın işi burada açılmaz.
      </p>
      <Button asChild className="mt-5 bg-[#16324f]">
        <Link href="/gorevler">Görevlere dön</Link>
      </Button>
    </div>
  )
}
