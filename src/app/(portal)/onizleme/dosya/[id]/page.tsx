import { Button } from "@/components/ui/button"
import { requireUser } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { formatBytes, formatDateTime } from "@/lib/format"
import { isParticipant } from "@/lib/workflow"
import { FileText } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

export const metadata: Metadata = { title: "Dosya kaydı" }

export default async function FilePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireUser()
  const file = await prisma.taskFile.findUnique({
    where: { driveFileId: id },
    include: {
      task: true,
      uploadedBy: true,
    },
  })
  if (!file || !isParticipant(file.task, user.id)) notFound()

  const external =
    file.storageMode === "google" && file.webViewLink.startsWith("https://drive.google.com")
      ? file.webViewLink
      : file.storageMode === "google" && file.webViewLink.startsWith("https://docs.google.com")
        ? file.webViewLink
        : null

  return (
    <div className="mx-auto max-w-xl">
      <Link href={`/gorevler/${file.taskId}`} className="text-sm text-muted-foreground hover:text-foreground">
        Göreve dön
      </Link>
      <div className="mt-4 rounded-xl bg-card p-6 ring-1 ring-foreground/10">
        <FileText className="size-8 text-primary" />
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Dosya içeriği burada yok</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {file.storageMode === "google"
            ? "Bu kayıt Google Drive üzerindeki dosyaya işaret eder."
            : "Google Drive kimliği tanımlı değil. Yükleme sırasında dosyanın içeriği sunucuya yazılmadı. Bağlantı kurulunca aynı akış dosyayı doğrudan Drive klasörüne bırakır."}
        </p>
        <dl className="mt-5 grid gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Dosya adı</dt>
            <dd>{file.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Boyut</dt>
            <dd>{formatBytes(file.size)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Yükleyen</dt>
            <dd>
              {file.uploadedBy.name} · {formatDateTime(file.createdAt.toISOString())}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Görev</dt>
            <dd>{file.task.title}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Kayıt kimliği</dt>
            <dd className="font-mono text-xs break-all">{file.driveFileId}</dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-wrap gap-2">
          {external ? (
            <Button asChild>
              <a href={external} target="_blank" rel="noreferrer">
                Google Drive bağlantısı
              </a>
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link href={`/gorevler/${file.taskId}`}>Göreve dön</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
