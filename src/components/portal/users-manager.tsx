"use client"

import {
  createUserAction,
  deleteUserAction,
  resetPasswordAction,
} from "@/actions/users"
import { useActionResult } from "@/components/portal/use-action-result"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ManagedUser } from "@/server/users"
import { useActionState, useState } from "react"

function CreateUserForm() {
  const [role, setRole] = useState("INTERN")
  const [state, action, pending] = useActionState(createUserAction, null)
  useActionResult(state)

  return (
    <form action={action} className="grid gap-3 rounded-2xl border border-border bg-card p-4">
      <div>
        <h2 className="text-xl font-semibold">Yeni kullanıcı</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Giriş kullanıcı adı ve geçici parolayı kişiye iletin.
        </p>
      </div>
      {state?.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="name">Ad soyad</Label>
          <Input id="name" name="name" required className="h-10" placeholder="Halil Karakaya" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="username">Kullanıcı adı</Label>
          <Input
            id="username"
            name="username"
            required
            className="h-10"
            placeholder="halil.karakaya"
            autoComplete="off"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="title">Unvan</Label>
          <Input id="title" name="title" required className="h-10" placeholder="Avukat" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="role">Rol</Label>
          <input type="hidden" name="role" value={role} />
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger id="role" className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LAWYER">Avukat</SelectItem>
              <SelectItem value="INTERN">Stajyer</SelectItem>
              <SelectItem value="ADMIN">Yönetici</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="email">E-posta (isteğe bağlı)</Label>
          <Input
            id="email"
            name="email"
            type="email"
            className="h-10"
            placeholder="halil@buroadi.com"
          />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="password">Geçici parola</Label>
        <Input
          id="password"
          name="password"
          type="text"
          required
          minLength={10}
          className="h-10 font-mono"
          placeholder="En az 10 karakter, harf ve rakam"
          autoComplete="new-password"
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending} className="bg-primary font-semibold">
          {pending ? "Ekleniyor…" : "Kullanıcıyı ekle"}
        </Button>
      </div>
    </form>
  )
}

function ResetPasswordDialog({ user }: { user: ManagedUser }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(resetPasswordAction, null)
  useActionResult(state, () => setOpen(false))
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        Parola sıfırla
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Parola sıfırla</DialogTitle>
          <DialogDescription>
            {user.name} (@{user.username}) için yeni geçici parola belirleyin.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-3">
          <input type="hidden" name="userId" value={user.id} />
          <Input
            name="password"
            type="text"
            required
            minLength={10}
            className="h-10 font-mono"
            placeholder="Yeni geçici parola"
            autoComplete="new-password"
          />
          {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Kaydediliyor…" : "Parolayı kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteUserButton({ user }: { user: ManagedUser }) {
  const [state, action, pending] = useActionState(deleteUserAction, null)
  useActionResult(state)
  if (!user.canDelete) return null
  return (
    <form action={action}>
      <input type="hidden" name="userId" value={user.id} />
      <Button
        type="submit"
        variant="destructive"
        size="sm"
        disabled={pending}
        onClick={(event) => {
          if (!window.confirm(`${user.name} silinsin mi?`)) event.preventDefault()
        }}
      >
        Sil
      </Button>
      {state?.error ? <p className="mt-1 text-xs text-destructive">{state.error}</p> : null}
    </form>
  )
}

export function UsersManager({
  users,
  canResetPasswords = false,
}: {
  users: ManagedUser[]
  canResetPasswords?: boolean
}) {
  return (
    <div className="grid gap-5">
      <CreateUserForm />
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-xl font-semibold">Büro kullanıcıları</h2>
          <p className="text-sm text-muted-foreground">
            Giriş kullanıcı adı ile yapılır.
            {canResetPasswords
              ? " Parola sıfırlama yalnızca sizin hesabınıza açık."
              : " Parola sıfırlama yalnızca Halil hesabına açıktır."}
          </p>
        </div>
        <ul className="divide-y divide-border">
          {users.map((user) => (
            <li
              key={user.id}
              className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-semibold">
                  {user.name}
                  {user.isSelf ? (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">(siz)</span>
                  ) : null}
                  {user.isDemo ? (
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[11px] text-primary">
                      Deneme
                    </span>
                  ) : null}
                </p>
                <p className="text-sm text-muted-foreground">
                  @{user.username} · {user.title} · {user.roleLabel}
                  {user.email ? ` · ${user.email}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user.taskCount} görev kaydı
                  {!user.canDelete && !user.isSelf
                    ? " · silmek için önce bağlı işler temizlenmeli"
                    : null}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {canResetPasswords ? <ResetPasswordDialog user={user} /> : null}
                <DeleteUserButton user={user} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
