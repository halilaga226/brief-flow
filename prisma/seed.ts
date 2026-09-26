import bcrypt from "bcryptjs"
import { PrismaClient, type Prisma } from "@prisma/client"
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "../src/lib/demo-accounts"

const prisma = new PrismaClient()

function ago(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000)
}

function dueInDays(days: number) {
  const key = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
  const [year, month, day] = key.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day + days, 15, 0, 0))
}

function mockFile(input: {
  driveFileId: string
  name: string
  kind: "INSTRUCTION" | "DRAFT"
  size: number
  uploadedById: string
  createdAt: Date
}): Prisma.TaskFileCreateWithoutTaskInput {
  return {
    kind: input.kind,
    driveFileId: input.driveFileId,
    name: input.name,
    mimeType: input.name.endsWith(".docx")
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : "application/pdf",
    size: input.size,
    webViewLink: `/onizleme/dosya/${input.driveFileId}`,
    storageMode: "mock",
    uploadedBy: { connect: { id: input.uploadedById } },
    createdAt: input.createdAt,
  }
}

async function main() {
  await prisma.notification.deleteMany()
  await prisma.taskComment.deleteMany()
  await prisma.taskLog.deleteMany()
  await prisma.taskFile.deleteMany()
  await prisma.task.deleteMany()
  await prisma.workItem.deleteMany()
  await prisma.user.deleteMany()

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10)
  await prisma.user.createMany({
    data: DEMO_ACCOUNTS.map((account) => ({
      id: account.id,
      name: account.name,
      username: account.username,
      email: account.email.toLowerCase(),
      role: account.role,
      title: account.title,
      passwordHash,
    })),
  })

  const ayse = "user_ayse"
  const mehmet = "user_mehmet"
  const elif = "user_elif"
  const can = "user_can"

  await prisma.task.create({
    data: {
      id: "task_ise_iade",
      title: "İşe iade dava dilekçesi",
      clientName: "Deniz Acar",
      fileNumber: "2026/184 Esas",
      description:
        "İş sözleşmesi 12 Mart 2026 tarihinde feshedildi. Feshin geçersizliğine ve işe iadeye ilişkin dava dilekçesini hazırlayın. Kıdem, ihbar ve boşta geçen süre ücretini talep edin. Ekteki ihtarnameyi esas alın.",
      dueDate: dueInDays(-1),
      status: "ATANDI",
      assignerId: ayse,
      assigneeId: elif,
      createdAt: ago(30),
      updatedAt: ago(8),
      files: {
        create: mockFile({
          driveFileId: "mock_ise_iade_ek",
          name: "Fesih_ihtarnamesi.pdf",
          kind: "INSTRUCTION",
          size: 248_320,
          uploadedById: ayse,
          createdAt: ago(30),
        }),
      },
      logs: {
        create: {
          actorId: ayse,
          type: "CREATED",
          toStatus: "ATANDI",
          meta: JSON.stringify({ fileName: "Fesih_ihtarnamesi.pdf" }),
          createdAt: ago(30),
        },
      },
      comments: {
        create: {
          authorId: ayse,
          body: "Duruşma 14 Nisan. Taslak bugün gelsin, sonuç ve talep kısmını net yazın.",
          createdAt: ago(8),
        },
      },
      notifications: {
        create: {
          userId: elif,
          title: "Yeni iş atandı",
          body: "Ayşe Demir size bir iş atadı: İşe iade dava dilekçesi",
          read: true,
          createdAt: ago(30),
        },
      },
    },
  })

  await prisma.task.create({
    data: {
      id: "task_bilirkisi",
      title: "Bilirkişi raporuna itiraz",
      clientName: "Marmara Tekstil A.Ş.",
      fileNumber: "2025/902 Esas",
      description:
        "Bilirkişi raporunun fazla mesai ve hafta tatili hesabına itiraz dilekçesini hazırlayın. Raporun 4. sayfasındaki tabloyla dilekçedeki kalemler birebir eşleşmeli.",
      dueDate: dueInDays(1),
      status: "REVIZE_ISTENDI",
      assignerId: ayse,
      assigneeId: elif,
      createdAt: ago(70),
      updatedAt: ago(5),
      files: {
        create: mockFile({
          driveFileId: "mock_bilirkisi_v1",
          name: "Bilirkisi_itiraz_v1.pdf",
          kind: "DRAFT",
          size: 512_000,
          uploadedById: elif,
          createdAt: ago(26),
        }),
      },
      logs: {
        create: [
          {
            actorId: ayse,
            type: "CREATED",
            toStatus: "ATANDI",
            createdAt: ago(70),
          },
          {
            actorId: elif,
            type: "DRAFT_UPLOADED",
            fromStatus: "ATANDI",
            toStatus: "INCELEME_BEKLIYOR",
            meta: JSON.stringify({ fileName: "Bilirkisi_itiraz_v1.pdf" }),
            createdAt: ago(26),
          },
          {
            actorId: ayse,
            type: "REVISION_REQUESTED",
            fromStatus: "INCELEME_BEKLIYOR",
            toStatus: "REVIZE_ISTENDI",
            note: "Fazla mesai kalemlerini raporun 4. sayfasıyla eşleştirin. Talebin sonuna fazlaya ilişkin hakların saklı olduğunu ekleyin.",
            createdAt: ago(5),
          },
        ],
      },
      comments: {
        create: [
          {
            authorId: elif,
            body: "İtiraz taslağını yükledim. Hesap kalemlerini dipnotta topladım.",
            createdAt: ago(25),
          },
          {
            authorId: ayse,
            body: "Revizyon notuna bakın. Fazla mesai satırları hâlâ dağınık.",
            createdAt: ago(5),
          },
        ],
      },
      notifications: {
        create: {
          userId: elif,
          title: "Revizyon istendi",
          body: "Ayşe Demir düzeltme istedi: Bilirkişi raporuna itiraz",
          read: false,
          createdAt: ago(5),
        },
      },
    },
  })

  await prisma.task.create({
    data: {
      id: "task_haciz",
      title: "İhtiyati haciz talep dilekçesi",
      clientName: "Kerem Usta",
      fileNumber: "2026/44 İhtiyati",
      description:
        "Alacağın tahsili için ihtiyati haciz talep edin. Teminat oranını emsal kararlarla gerekçelendirin. Karşı tarafın malvarlığına ilişkin bilinen adresleri talimatta.",
      dueDate: dueInDays(0),
      status: "INCELEME_BEKLIYOR",
      assignerId: ayse,
      assigneeId: elif,
      createdAt: ago(20),
      updatedAt: ago(2),
      files: {
        create: mockFile({
          driveFileId: "mock_haciz_v1",
          name: "Ihtiyati_haciz_taslak.pdf",
          kind: "DRAFT",
          size: 386_000,
          uploadedById: elif,
          createdAt: ago(2),
        }),
      },
      logs: {
        create: [
          {
            actorId: ayse,
            type: "CREATED",
            toStatus: "ATANDI",
            createdAt: ago(20),
          },
          {
            actorId: elif,
            type: "DRAFT_UPLOADED",
            fromStatus: "ATANDI",
            toStatus: "INCELEME_BEKLIYOR",
            meta: JSON.stringify({ fileName: "Ihtiyati_haciz_taslak.pdf" }),
            createdAt: ago(2),
          },
        ],
      },
      comments: {
        create: {
          authorId: elif,
          body: "Teminat oranını yüzde 15 bıraktım, emsal kararları dipnota aldım.",
          createdAt: ago(2),
        },
      },
      notifications: {
        create: {
          userId: ayse,
          title: "Taslak incelemenizi bekliyor",
          body: "Elif Yılmaz taslak yükledi: İhtiyati haciz talep dilekçesi",
          read: false,
          createdAt: ago(2),
        },
      },
    },
  })

  await prisma.task.create({
    data: {
      id: "task_arabuluculuk",
      title: "Arabuluculuk tutanağı incelemesi",
      clientName: "Lale Ortaklığı",
      fileNumber: "ARB-2026-118",
      description:
        "Karşı tarafın son teklifini tutanak taslağıyla karşılaştırın. Kırmızı çizgimiz 1.250.000 TL. Bu dosyaya stajyer dahil değildir.",
      dueDate: dueInDays(5),
      status: "ATANDI",
      assignerId: ayse,
      assigneeId: mehmet,
      createdAt: ago(12),
      updatedAt: ago(12),
      files: {
        create: mockFile({
          driveFileId: "mock_arabuluculuk_ek",
          name: "Arabuluculuk_tutanak_taslagi.docx",
          kind: "INSTRUCTION",
          size: 96_000,
          uploadedById: ayse,
          createdAt: ago(12),
        }),
      },
      logs: {
        create: {
          actorId: ayse,
          type: "CREATED",
          toStatus: "ATANDI",
          meta: JSON.stringify({ fileName: "Arabuluculuk_tutanak_taslagi.docx" }),
          createdAt: ago(12),
        },
      },
      comments: {
        create: {
          authorId: ayse,
          body: "Kırmızı çizgi 1.250.000 TL. Bunun altını tutanağa bağlamayın.",
          createdAt: ago(12),
        },
      },
      notifications: {
        create: {
          userId: mehmet,
          title: "Yeni iş atandı",
          body: "Ayşe Demir size bir iş atadı: Arabuluculuk tutanağı incelemesi",
          read: false,
          createdAt: ago(12),
        },
      },
    },
  })

  await prisma.task.create({
    data: {
      id: "task_icra",
      title: "İcra takip talebi",
      clientName: "Selin Erdem",
      fileNumber: "2026/310 İcra",
      description:
        "İlamsız icra takibini hazırlayın. Asıl alacak, işlemiş faiz ve ferilerini ayrı kalemlerde gösterin. Onaydan sonra UYAP üzerinden iletip barkodu işleyin.",
      dueDate: dueInDays(0),
      status: "GONDERIM_BEKLIYOR",
      assignerId: mehmet,
      assigneeId: can,
      createdAt: ago(40),
      updatedAt: ago(3),
      files: {
        create: mockFile({
          driveFileId: "mock_icra_v1",
          name: "Icra_takip_talebi.pdf",
          kind: "DRAFT",
          size: 274_000,
          uploadedById: can,
          createdAt: ago(10),
        }),
      },
      logs: {
        create: [
          {
            actorId: mehmet,
            type: "CREATED",
            toStatus: "ATANDI",
            createdAt: ago(40),
          },
          {
            actorId: can,
            type: "DRAFT_UPLOADED",
            fromStatus: "ATANDI",
            toStatus: "INCELEME_BEKLIYOR",
            meta: JSON.stringify({ fileName: "Icra_takip_talebi.pdf" }),
            createdAt: ago(10),
          },
          {
            actorId: mehmet,
            type: "APPROVED",
            fromStatus: "INCELEME_BEKLIYOR",
            toStatus: "GONDERIM_BEKLIYOR",
            note: "Takip talebi uygun. UYAP'tan iletin, barkodu işleyin.",
            createdAt: ago(3),
          },
        ],
      },
      notifications: {
        create: {
          userId: can,
          title: "Taslak onaylandı",
          body: "Mehmet Kaya gönderime hazır işaretledi: İcra takip talebi",
          read: false,
          createdAt: ago(3),
        },
      },
    },
  })

  await prisma.task.create({
    data: {
      id: "task_bosanma",
      title: "Anlaşmalı boşanma protokolü",
      clientName: "Ece ve Tarık Yücel",
      fileNumber: "2026/77 Aile",
      description:
        "Anlaşmalı boşanma protokolünü velayet, iştirak nafakası ve mal paylaşımı başlıklarıyla düzenleyin. Onay sonrası aile mahkemesine iletin.",
      dueDate: dueInDays(-2),
      status: "TAMAMLANDI",
      trackingCode: "2026-UYAP-77190",
      completedAt: ago(26),
      assignerId: mehmet,
      assigneeId: can,
      createdAt: ago(96),
      updatedAt: ago(26),
      files: {
        create: mockFile({
          driveFileId: "mock_bosanma_v1",
          name: "Anlasmali_bosanma_protokolu.pdf",
          kind: "DRAFT",
          size: 198_000,
          uploadedById: can,
          createdAt: ago(70),
        }),
      },
      logs: {
        create: [
          {
            actorId: mehmet,
            type: "CREATED",
            toStatus: "ATANDI",
            createdAt: ago(96),
          },
          {
            actorId: can,
            type: "DRAFT_UPLOADED",
            fromStatus: "ATANDI",
            toStatus: "INCELEME_BEKLIYOR",
            meta: JSON.stringify({ fileName: "Anlasmali_bosanma_protokolu.pdf" }),
            createdAt: ago(70),
          },
          {
            actorId: mehmet,
            type: "APPROVED",
            fromStatus: "INCELEME_BEKLIYOR",
            toStatus: "GONDERIM_BEKLIYOR",
            note: "Protokol uygun. Mahkemeye sunulabilir.",
            createdAt: ago(48),
          },
          {
            actorId: can,
            type: "COMPLETED",
            fromStatus: "GONDERIM_BEKLIYOR",
            toStatus: "TAMAMLANDI",
            note: "Evrak takip kodu işlendi.",
            meta: JSON.stringify({ trackingCode: "2026-UYAP-77190" }),
            createdAt: ago(26),
          },
        ],
      },
      notifications: {
        create: {
          userId: mehmet,
          title: "Gönderim tamamlandı",
          body: "Can Öztürk evrak kodunu işledi: Anlaşmalı boşanma protokolü",
          read: true,
          createdAt: ago(26),
        },
      },
    },
  })

  await prisma.task.create({
    data: {
      id: "task_cevap",
      title: "Karşı dava cevap dilekçesi",
      clientName: "Nilüfer Boz",
      fileNumber: "2025/640 Esas",
      description:
        "Karşı davadaki manevi tazminat talebine cevap verin. Zamanaşımı ve illiyet bağı itirazlarını ayrı başlıklar halinde yazın.",
      dueDate: dueInDays(3),
      status: "INCELEME_BEKLIYOR",
      assignerId: mehmet,
      assigneeId: ayse,
      createdAt: ago(36),
      updatedAt: ago(4),
      files: {
        create: mockFile({
          driveFileId: "mock_cevap_v1",
          name: "Karsi_dava_cevap.pdf",
          kind: "DRAFT",
          size: 421_000,
          uploadedById: ayse,
          createdAt: ago(4),
        }),
      },
      logs: {
        create: [
          {
            actorId: mehmet,
            type: "CREATED",
            toStatus: "ATANDI",
            createdAt: ago(36),
          },
          {
            actorId: ayse,
            type: "DRAFT_UPLOADED",
            fromStatus: "ATANDI",
            toStatus: "INCELEME_BEKLIYOR",
            meta: JSON.stringify({ fileName: "Karsi_dava_cevap.pdf" }),
            createdAt: ago(4),
          },
        ],
      },
      comments: {
        create: {
          authorId: ayse,
          body: "Zamanaşımı bölümünü öne aldım. İlliyet için tanık listesini dipnota bıraktım.",
          createdAt: ago(4),
        },
      },
      notifications: {
        create: {
          userId: mehmet,
          title: "Taslak incelemenizi bekliyor",
          body: "Ayşe Demir taslak yükledi: Karşı dava cevap dilekçesi",
          read: false,
          createdAt: ago(4),
        },
      },
    },
  })

  await prisma.task.create({
    data: {
      id: "task_vekalet",
      title: "Vekaletname yetki kontrolü",
      clientName: "Ada Lojistik Ltd. Şti.",
      fileNumber: "2026/12 Danışmanlık",
      description:
        "Noterde düzenlenen vekaletnamede ihbar, sulh ve feragat yetkilerinin bulunup bulunmadığını kontrol edin. Eksik yetki varsa yenileme için kısa bir not hazırlayın.",
      dueDate: dueInDays(4),
      status: "ATANDI",
      assignerId: ayse,
      assigneeId: can,
      createdAt: ago(6),
      updatedAt: ago(6),
      logs: {
        create: {
          actorId: ayse,
          type: "CREATED",
          toStatus: "ATANDI",
          createdAt: ago(6),
        },
      },
      notifications: {
        create: {
          userId: can,
          title: "Yeni iş atandı",
          body: "Ayşe Demir size bir iş atadı: Vekaletname yetki kontrolü",
          read: true,
          createdAt: ago(6),
        },
      },
    },
  })
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
