import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"

function secretKey() {
  const secret = process.env.AUTH_SECRET?.trim()
  if (!secret) throw new Error("AUTH_SECRET tanımlı değil.")
  return createHash("sha256").update(secret).digest()
}

/** AES-256-GCM; çıktı: iv:tag:ciphertext (base64 parçalar) */
export function encryptSecret(plain: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", secretKey(), iv)
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${enc.toString("base64url")}`
}

export function decryptSecret(payload: string) {
  const [ivB64, tagB64, dataB64] = payload.split(".")
  if (!ivB64 || !tagB64 || !dataB64) throw new Error("Şifreli veri bozuk.")
  const decipher = createDecipheriv("aes-256-gcm", secretKey(), Buffer.from(ivB64, "base64url"))
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"))
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64url")),
    decipher.final(),
  ]).toString("utf8")
}
