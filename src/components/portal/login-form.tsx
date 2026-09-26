"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo-accounts"
import { roleLabel } from "@/lib/workflow"
import { signIn } from "next-auth/react"
import { useState } from "react"

export function LoginForm({ showDemo = false }: { showDemo?: boolean }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function enter(nextEmail: string, nextPassword: string) {
    setPending(true)
    setError(null)
    const result = await signIn("credentials", {
      email: nextEmail,
      password: nextPassword,
      redirect: false,
    })
    if (!result || result.error) {
      setPending(false)
      setError("E-posta veya parola hatalı.")
      return
    }
    window.location.assign("/panel")
  }

  return (
    <div className="grid gap-6">
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          void enter(email, password)
        }}
      >
        <div className="grid gap-1.5">
          <Label htmlFor="email">E-posta</Label>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-10"
            placeholder="adsoyad@buroadi.com"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="password">Parola</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-10"
          />
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending} className="h-10 bg-zinc-900">
          {pending ? "Giriş yapılıyor…" : "Giriş yap"}
        </Button>
      </form>

      {showDemo ? (
        <div>
          <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Deneme hesapları</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Ortak parola: <span className="font-mono text-foreground">{DEMO_PASSWORD}</span>
          </p>
          <div className="mt-3 grid gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.id}
                type="button"
                disabled={pending}
                onClick={() => {
                  setEmail(account.email)
                  setPassword(DEMO_PASSWORD)
                  void enter(account.email, DEMO_PASSWORD)
                }}
                className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-left hover:bg-muted disabled:opacity-60"
              >
                <span>
                  <span className="block text-sm font-medium">{account.name}</span>
                  <span className="block text-xs text-muted-foreground">{account.title}</span>
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] ring-1 ring-border">
                  {roleLabel(account.role)}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs leading-relaxed text-muted-foreground">
          Hesabınız yoksa bürodaki bir avukattan kullanıcı açmasını isteyin.
        </p>
      )}
    </div>
  )
}
