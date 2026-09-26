"use client"

import { changePasswordAction } from "@/actions/users"
import { useActionResult } from "@/components/portal/use-action-result"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useActionState, useRef } from "react"

export function PasswordForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, action, pending] = useActionState(changePasswordAction, null)
  useActionResult(state, () => formRef.current?.reset())

  return (
    <form
      ref={formRef}
      action={action}
      className="grid max-w-md gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
    >
      <div>
        <h2 className="font-serif text-xl">Parola değiştir</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          En az 10 karakter; harf ve rakam içermeli.
        </p>
      </div>
      {state?.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="grid gap-1.5">
        <Label htmlFor="currentPassword">Mevcut parola</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          className="h-10"
          autoComplete="current-password"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="nextPassword">Yeni parola</Label>
        <Input
          id="nextPassword"
          name="nextPassword"
          type="password"
          required
          minLength={10}
          className="h-10"
          autoComplete="new-password"
        />
      </div>
        <Button type="submit" disabled={pending} className="bg-zinc-900">
        {pending ? "Kaydediliyor…" : "Parolayı güncelle"}
      </Button>
    </form>
  )
}
