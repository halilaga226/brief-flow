import type { Metadata } from "next"
import { Nunito_Sans, Sora } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { BRAND } from "@/lib/brand"
import "./globals.css"

const nunito = Nunito_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
})

const sora = Sora({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
})

export const metadata: Metadata = {
  title: {
    default: BRAND.name,
    template: `%s · ${BRAND.shortName}`,
  },
  description: `${BRAND.name} görev, taslak inceleme ve evrak gönderim akışı.`,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr" suppressHydrationWarning className={`${nunito.variable} ${sora.variable}`}>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
