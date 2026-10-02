/** Masaüstü yedek ajanı için Bearer / X-Backup-Token doğrulaması. */
export function isBackupAgentAuthorized(request: Request): boolean {
  const secret = process.env.BACKUP_AGENT_TOKEN?.trim()
  if (!secret) return false

  const header = request.headers.get("authorization")
  if (header === `Bearer ${secret}`) return true

  const alt = request.headers.get("x-backup-token")
  return alt === secret
}
