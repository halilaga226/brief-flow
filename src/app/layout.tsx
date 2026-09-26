import type { Metadata } from "next"
import { Newsreader, Outfit } from "next/font/google"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const outfit = Outfit({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
})

const newsreader = Newsreader({
  subsets: ["latin", "latin-ext"],
  variable: "--font-newsreader",
  weight: ["400", "600", "700"],
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
