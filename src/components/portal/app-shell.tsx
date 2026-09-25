"use client"

import { signOutAction } from "@/actions/auth"
import { NotificationBell } from "@/components/portal/notification-bell"
import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import type { NotificationDTO, SessionUser } from "@/lib/dto"
import { initials } from "@/lib/format"
import { roleLabel } from "@/lib/workflow"
import { cn } from "@/lib/utils"
import { FolderOpen, LayoutDashboard, LogOut, Menu, Plus, Scale, Users, UserRound } from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

const baseLinks = [
  { href: "/panel", label: "Panel", icon: LayoutDashboard },
  { href: "/gorevler", label: "Görevler", icon: FolderOpen },
]

function isActive(pathname: string, href: string) {
  if (href === "/panel") return pathname === "/panel"
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavLinks({
  inSheet = false,
  lawyer = false,
}: {
  inSheet?: boolean
  lawyer?: boolean
}) {
  const pathname = usePathname()
  const links = lawyer
    ? [
        ...baseLinks,
        { href: "/kullanicilar", label: "Kullanıcılar", icon: Users },
        { href: "/hesap", label: "Hesabım", icon: UserRound },
      ]
    : [...baseLinks, { href: "/hesap", label: "Hesabım", icon: UserRound }]
  return (
    <nav className="grid gap-1">
      {links.map((link) => {
        const Icon = link.icon
        const active = isActive(pathname, link.href)
        const className = cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
          active ? "bg-white/10 text-white" : "text-[#c9d4e0] hover:bg-white/5 hover:text-white",
        )
        if (inSheet) {
          return (
            <SheetClose asChild key={link.href}>
              <Link href={link.href} className={className}>
                <Icon className="size-4" />
                {link.label}
              </Link>
            </SheetClose>
          )
        }
        return (
          <Link key={link.href} href={link.href} className={className}>
            <Icon className="size-4" />
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function AppShell({
  user,
  notifications,
  children,
}: {
  user: SessionUser
  notifications: NotificationDTO[]
  children: ReactNode
}) {
  const pathname = usePathname()
  const reduce = useReducedMotion()
  const lawyer = user.role === "LAWYER"

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#icerik"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2"
      >
        İçeriğe geç
      </a>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-[#12263a] text-[#e6edf4] md:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <Link href="/panel" className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-white/10">
              <Scale className="size-4 text-[#d7efe4]" />
            </span>
            <span>
              <span className="block font-serif text-xl leading-none">Vekâlet</span>
              <span className="mt-1 block text-[11px] tracking-[0.16em] text-[#9aafc2] uppercase">
                Büro akışı
              </span>
            </span>
          </Link>
        </div>
        <div className="flex-1 px-3 py-4">
          <NavLinks lawyer={lawyer} />
          {lawyer ? (
            <Button asChild className="mt-4 w-full bg-[#0f6e56] text-white hover:bg-[#0c5b48]">
              <Link href="/gorevler/yeni">
                <Plus />
                Yeni görev
              </Link>
            </Button>
          ) : null}
        </div>
        <div className="border-t border-white/10 p-3">
          <div className="mb-2 flex items-center gap-2 px-2">
            <span className="flex size-9 items-center justify-center rounded-full bg-white/10 text-xs font-medium">
              {initials(user.name)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm">{user.name}</span>
              <span className="block truncate text-xs text-[#9aafc2]">
                {user.title || roleLabel(user.role)}
              </span>
            </span>
          </div>
          <form action={signOutAction}>
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start text-[#d5deea] hover:bg-white/10 hover:text-white"
            >
              <LogOut />
              Çıkış
            </Button>
          </form>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur md:px-8">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden" aria-label="Menüyü aç">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-0 bg-[#12263a] text-[#e6edf4]">
              <div className="mt-8 px-2">
                <p className="font-serif text-2xl">Vekâlet</p>
                <p className="mt-4 text-xs tracking-[0.16em] text-[#9aafc2] uppercase">Menü</p>
                <div className="mt-3">
                  <NavLinks inSheet lawyer={lawyer} />
                </div>
                {lawyer ? (
                  <SheetClose asChild>
                    <Link
                      href="/gorevler/yeni"
                      className="mt-4 flex h-9 items-center justify-center gap-2 rounded-lg bg-[#0f6e56] text-sm text-white"
                    >
                      <Plus className="size-4" />
                      Yeni görev
                    </Link>
                  </SheetClose>
                ) : null}
              </div>
            </SheetContent>
          </Sheet>
          <p className="font-serif text-lg md:hidden">Vekâlet</p>
          <div className="flex-1" />
          {lawyer ? (
            <Button asChild size="sm" className="hidden bg-[#16324f] sm:inline-flex">
              <Link href="/gorevler/yeni">
                <Plus />
                Yeni görev
              </Link>
            </Button>
          ) : null}
          <NotificationBell items={notifications} />
        </header>
        <motion.main
          id="icerik"
          key={pathname}
          className="px-4 py-6 md:px-8 md:py-8"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  )
}
