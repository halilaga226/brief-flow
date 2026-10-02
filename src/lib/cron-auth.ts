/**
 * Vercel Cron / env secret doğrulama.
 * Vercel UI’da tırnak veya satır sonu yapıştırılırsa Authorization header kırılır;
 * trim + tırnak temizliği hem deploy sonrası 401’leri hem yanlış env değerlerini yumuşatır.
 */
export function normalizeSecret(value: string | null | undefined): string {
  let s = (value ?? "").trim()
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim()
  }
  // Env’e yapıştırılan gizli satır sonlarını temizle
  return s.replace(/\r?\n/g, "").trim()
}

/** Authorization: Bearer <secret> veya ?secret=... */
export function isCronAuthorized(request: Request, envSecret?: string | null): boolean {
  const secret = normalizeSecret(envSecret ?? process.env.CRON_SECRET)
  if (!secret) return false

  const auth = request.headers.get("authorization")
  if (auth) {
    const m = /^Bearer\s+(.+)$/i.exec(auth.trim())
    if (m && normalizeSecret(m[1]) === secret) return true
  }

  const url = new URL(request.url)
  const token = normalizeSecret(url.searchParams.get("secret"))
  return Boolean(token) && token === secret
}
