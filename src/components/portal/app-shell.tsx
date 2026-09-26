"use client"

import { signOutAction } from "@/actions/auth"
import { NotificationBell } from "@/components/portal/notification-bell"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import type { NotificationDTO, SessionUser } from "@/lib/dto"
import { BRAND } from "@/lib/brand"
import { initials } from "@/lib/format"
import { canCreateTask, canManageUsers, roleLabel } from "@/lib/workflow"
import { cn } from "@/lib/utils"
import {
  ClipboardList,
  FolderOpen,
  LogOut,
  Menu,
  Plus,
  Scale,
  Settings,
  Users,
} from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

function isActive(pathname: string, href: string) {
  if (href === "/gorevler") {
    return pathname === "/gorevler" || pathname.startsWith("/gorevler/")
  }
  if (href === "/is-listesi") {
    return pathname === "/is-listesi" || pathname.startsWith("/is-listesi/")
  }
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
  const pathname = usePathname()
  const links = [
    ...(canAssign ? [{ href: "/is-listesi", label: "İş listesi", icon: ClipboardList }] : []),
    { href: "/gorevler", label: "Görevler", icon: FolderOpen },
    ...(canManage ? [{ href: "/kullanicilar", label: "Kullanıcılar", icon: Users }] : []),
    { href: "/ayarlar", label: "Ayarlar", icon: Settings },
  ]
  return (
    <nav className="grid gap-1">
      {links.map((link) => {
        const Icon = link.icon
        const active = isActive(pathname, link.href)
        const className = cn(
          "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition",
          active
            ? "bg-primary font-semibold text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#icerik"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:ring-1 focus:ring-border"
      >
        İçeriğe geç
      </a>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-card md:flex">
        <div className="border-b border-border px-4 py-4">
          <Link href={lawyer ? "/is-listesi" : "/gorevler"} className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Scale className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold leading-tight tracking-tight">
                {BRAND.shortName}
              </span>
              <span className="block text-[11px] font-medium text-muted-foreground">Hukuk Bürosu</span>
            </span>
          </Link>
        </div>
        <div className="flex-1 px-3 py-4">
          <NavLinks canAssign={lawyer} canManage={manager} />
          {lawyer ? (
            <Button asChild className="mt-4 w-full font-semibold">
              <Link href="/gorevler/yeni">
                <Plus />
                Görev ver
              </Link>
            </Button>
          ) : null}
        </div>
        <div className="border-t border-border p-3">
          <div className="mb-2 flex items-center gap-2 px-2">
            <span className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-semibold text-primary">
              {initials(user.name)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{user.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {user.title || roleLabel(user.role)}
              </span>
            </span>
          </div>
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" className="w-full justify-start text-muted-foreground">
              <LogOut />
              Çıkış
            </Button>
          </form>
        </div>
      </aside>

      <div className="md:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-card/90 px-3 backdrop-blur sm:px-4 md:px-8">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden" aria-label="Menüyü aç">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[min(20rem,92vw)] bg-card">
              <div className="mt-8 px-2">
                <p className="text-lg font-semibold leading-tight">{BRAND.shortName}</p>
                <p className="text-xs font-medium text-muted-foreground">Hukuk Bürosu</p>
                <div className="mt-4">
                  <NavLinks inSheet canAssign={lawyer} canManage={manager} />
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <p className="min-w-0 truncate text-sm font-semibold md:hidden">{BRAND.shortName}</p>
          <div className="flex-1" />
          <ThemeToggle />
          {lawyer ? (
            <Button asChild size="sm" className="hidden font-semibold sm:inline-flex">
              <Link href="/gorevler/yeni">
                <Plus />
                Görev ver
              </Link>
            </Button>
          ) : null}
          <NotificationBell items={notifications} />
        </header>
        <motion.main
          id="icerik"
          key={pathname}
          className="px-3 py-5 pb-24 sm:px-4 md:px-8 md:py-8 md:pb-8"
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {children}
        </motion.main>

        <nav
          className={cn(
            "fixed inset-x-0 bottom-0 z-30 grid border-t border-border bg-card/95 px-1 py-1 backdrop-blur md:hidden",
            lawyer ? "grid-cols-4" : manager ? "grid-cols-3" : "grid-cols-2",
          )}
        >
          {[
            ...(lawyer ? [{ href: "/is-listesi", label: "İşler", icon: ClipboardList }] : []),
            { href: "/gorevler", label: "Görevler", icon: FolderOpen },
            ...(manager ? [{ href: "/kullanicilar", label: "Kullanıcı", icon: Users }] : []),
            { href: "/ayarlar", label: "Ayarlar", icon: Settings },
          ].map((link) => {
            const Icon = link.icon
            const active = isActive(pathname, link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[11px] font-semibold",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
