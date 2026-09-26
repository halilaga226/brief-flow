import type { Metadata } from "next"
import { Outfit, Source_Sans_3 } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { BRAND } from "@/lib/brand"
import "./globals.css"

const sourceSans = Source_Sans_3({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
})

const outfit = Outfit({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
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
    <html lang="tr" suppressHydrationWarning>
      <body className={`${sourceSans.variable} ${outfit.variable} antialiased`}>
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
