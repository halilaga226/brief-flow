"use client"

import { markAllReadAction } from "@/actions/auth"
import type { NotificationDTO } from "@/lib/dto"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Bell } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

export function NotificationBell({ items }: { items: NotificationDTO[] }) {
  const unread = items.filter((item) => !item.read).length
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative" aria-label="Bildirimler">
          <Bell />
          {unread > 0 ? (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0f6e56] px-1 text-[10px] font-medium text-white">
              {unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-medium">Bildirimler</p>
          {unread > 0 ? (
            <button
              type="button"
              className="text-xs text-[#0f5c45] disabled:opacity-50"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  await markAllReadAction()
                  router.refresh()
                })
              }}
            >
              Tümünü okundu say
            </button>
          ) : null}
        </div>
        {items.length === 0 ? (
          <p className="px-3 py-6 text-sm text-muted-foreground">Yeni bildiriminiz yok.</p>
        ) : (
          <ul className="max-h-96 overflow-y-auto">
            {items.map((item) => (
              <li key={item.id} className="border-b last:border-b-0">
                <Link
                  href={`/gorevler/${item.taskId}`}
                  className="block px-3 py-2.5 hover:bg-muted"
                  onClick={() => setOpen(false)}
                >
                  <span className="flex items-start gap-2">
                    {!item.read ? (
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#0f6e56]" />
                    ) : (
                      <span className="mt-1.5 size-1.5 shrink-0" />
                    )}
                    <span>
                      <span className="block text-sm font-medium">{item.title}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{item.body}</span>
                      <span className="mt-1 block text-[11px] text-muted-foreground">{item.when}</span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
