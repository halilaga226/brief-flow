import type { Metadata } from "next"
import { Newsreader, Outfit } from "next/font/google"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const outfit = Outfit({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
})

const newsreader = Newsreader({
  subsets: ["latin", "latin-ext"],
  variable: "--font-newsreader",
})

export const metadata: Metadata = {
  title: {
    default: "Vekâlet",
    template: "%s · Vekâlet",
  },
  description: "Hukuk bürosu için görev, taslak inceleme ve evrak gönderim akışı.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr">
      <body className={`${outfit.variable} ${newsreader.variable} antialiased`}>
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  )
}
