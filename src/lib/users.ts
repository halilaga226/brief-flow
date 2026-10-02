import type { Role } from "@/lib/workflow"
import { cleanText, WorkflowError } from "@/lib/workflow"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{2,31}$/

export function validatePersonName(raw: string) {
  const name = cleanText(raw)
  if (name.length < 3) return { ok: false as const, error: "Ad soyad en az 3 karakter olmalı." }
  if (name.length > 80) return { ok: false as const, error: "Ad soyad 80 karakteri aşamaz." }
  return { ok: true as const, name }
}

export function validatePersonTitle(raw: string) {
  const title = cleanText(raw)
  if (title.length < 2) return { ok: false as const, error: "Unvan en az 2 karakter olmalı." }
  if (title.length > 80) return { ok: false as const, error: "Unvan 80 karakteri aşamaz." }
  return { ok: true as const, title }
}

export function validateUsername(raw: string) {
  const username = cleanText(raw).toLowerCase()
  if (!USERNAME_RE.test(username)) {
    return {
      ok: false as const,
      error: "Kullanıcı adı 3–32 karakter; küçük harf, rakam, nokta, tire veya alt çizgi.",
    }
  }
  return { ok: true as const, username }
}

export function validatePersonEmail(raw: string) {
  const email = cleanText(raw).toLowerCase()
  if (!email) return { ok: true as const, email: null as string | null }
  if (!EMAIL_RE.test(email)) return { ok: false as const, error: "Geçerli bir e-posta yazın." }
  if (email.length > 120) return { ok: false as const, error: "E-posta çok uzun." }
  if (email.endsWith("@vekalet.local")) {
    return { ok: false as const, error: "Deneme e-postası kullanılamaz." }
  }
  return { ok: true as const, email }
}

export function validatePersonRole(raw: string): { ok: true; role: Role } | { ok: false; error: string } {
  if (raw === "LAWYER" || raw === "INTERN" || raw === "ADMIN") return { ok: true, role: raw }
  return { ok: false, error: "Rol avukat, stajyer veya yönetici olmalı." }
}

export function validateNewPassword(raw: string) {
  const password = raw.normalize("NFKC")
  if (password.length < 10) {
    return { ok: false as const, error: "Parola en az 10 karakter olmalı." }
  }
  if (password.length > 72) {
    return { ok: false as const, error: "Parola 72 karakteri aşamaz." }
  }
  if (/\s/.test(password)) {
    return { ok: false as const, error: "Parolada boşluk olmamalı." }
  }
  if (!/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(password) || !/[0-9]/.test(password)) {
    return { ok: false as const, error: "Parolada en az bir harf ve bir rakam olmalı." }
  }
  return { ok: true as const, password }
}

export function assertLawyer(role: Role) {
  if (role !== "LAWYER" && role !== "ADMIN") {
    throw new WorkflowError("Yalnızca avukat veya yönetici kullanıcı yönetebilir.")
  }
}

/** Parola sıfırlama yalnızca Halil hesabına aittir. */
export const PASSWORD_ADMIN_USERNAME = "halil"

export function canResetPasswords(username: string) {
  return username.trim().toLowerCase() === PASSWORD_ADMIN_USERNAME
}

export function assertPasswordAdmin(username: string) {
  if (!canResetPasswords(username)) {
    throw new WorkflowError("Parola sıfırlama yalnızca Halil hesabına açıktır.")
  }
}

export function isDemoEmail(email: string | null | undefined) {
  if (!email) return false
  return email.toLowerCase().endsWith("@vekalet.local")
}

export function isDemoUsername(username: string) {
  return ["ayse.demir", "mehmet.kaya", "elif.yilmaz", "can.ozturk"].includes(username.toLowerCase())
}
