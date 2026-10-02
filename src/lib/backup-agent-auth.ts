import { normalizeSecret } from "@/lib/cron-auth"

/** Masaüstü yedek ajanı için Bearer / X-Backup-Token doğrulaması. */
export function isBackupAgentAuthorized(request: Request): boolean {
  const secret = normalizeSecret(process.env.BACKUP_AGENT_TOKEN)
  if (!secret) return false

  const header = request.headers.get("authorization")
  if (header) {
    const m = /^Bearer\s+(.+)$/i.exec(header.trim())
    if (m && normalizeSecret(m[1]) === secret) return true
  }

  const alt = normalizeSecret(request.headers.get("x-backup-token"))
  return Boolean(alt) && alt === secret
}
