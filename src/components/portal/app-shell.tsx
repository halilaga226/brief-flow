"use client"

import { signOutAction } from "@/actions/auth"
import { NotificationBell } from "@/components/portal/notification-bell"
import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import type { NotificationDTO, SessionUser } from "@/lib/dto"
import { initials } from "@/lib/format"
import { canCreateTask, canManageUsers, roleLabel } from "@/lib/workflow"
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
  canAssign = false,
  canManage = false,
}: {
  inSheet?: boolean
  canAssign?: boolean
  canManage?: boolean
}) {
  void canAssign
  const pathname = usePathname()
  const links = [
    ...baseLinks,
    ...(canManage ? [{ href: "/kullanicilar", label: "Kullanıcılar", icon: Users }] : []),
    { href: "/hesap", label: "Hesabım", icon: UserRound },
  ]
  return (
    <nav className="grid gap-1">
      {links.map((link) => {
        const Icon = link.icon
        const active = isActive(pathname, link.href)
        const className = cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
          active
            ? "bg-zinc-900 text-white"
            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
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
  const lawyer = canCreateTask(user.role)
  const manager = canManageUsers(user.role)

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <a
        href="#icerik"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:ring-1 focus:ring-zinc-200"
      >
        İçeriğe geç
      </a>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-zinc-200 bg-white md:flex">
        <div className="border-b border-zinc-200 px-4 py-4">
          <Link href="/panel" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-zinc-900 text-white">
              <Scale className="size-4" />
            </span>
            <span>
              <span className="block text-base font-semibold tracking-tight">Vekâlet</span>
              <span className="block text-[11px] text-zinc-500">İş ve belge akışı</span>
            </span>
          </Link>
        </div>
        <div className="flex-1 px-3 py-4">
          <NavLinks canAssign={lawyer} canManage={manager} />
          {lawyer ? (
            <Button asChild className="mt-4 w-full bg-zinc-900 text-white hover:bg-zinc-800">
              <Link href="/gorevler/yeni">
                <Plus />
                Yeni görev
              </Link>
            </Button>
          ) : null}
        </div>
        <div className="border-t border-zinc-200 p-3">
          <div className="mb-2 flex items-center gap-2 px-2">
            <span className="flex size-9 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-700">
              {initials(user.name)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{user.name}</span>
              <span className="block truncate text-xs text-zinc-500">
                {user.title || roleLabel(user.role)}
              </span>
            </span>
          </div>
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" className="w-full justify-start text-zinc-600">
              <LogOut />
              Çıkış
            </Button>
          </form>
        </div>
      </aside>

      <div className="md:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-zinc-200 bg-white/95 px-4 backdrop-blur md:px-8">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden" aria-label="Menüyü aç">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-white">
              <div className="mt-8 px-2">
                <p className="text-lg font-semibold">Vekâlet</p>
                <div className="mt-4">
                  <NavLinks inSheet canAssign={lawyer} canManage={manager} />
                </div>
                {lawyer ? (
                  <SheetClose asChild>
                    <Link
                      href="/gorevler/yeni"
                      className="mt-4 flex h-9 items-center justify-center gap-2 rounded-lg bg-zinc-900 text-sm text-white"
                    >
                      <Plus className="size-4" />
                      Yeni görev
                    </Link>
                  </SheetClose>
                ) : null}
              </div>
            </SheetContent>
          </Sheet>
          <p className="text-base font-semibold md:hidden">Vekâlet</p>
          <div className="flex-1" />
          {lawyer ? (
            <Button asChild size="sm" className="hidden bg-zinc-900 sm:inline-flex">
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
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  )
}
