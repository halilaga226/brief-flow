import type { SessionUser } from "@/lib/dto"
import {
  parsePartiesJson,
  partyContentHash,
  partyExternalKey,
  partyNameKey,
  type PartyInput,
} from "@/lib/party-import"
import { prisma } from "@/lib/prisma"
import { canResetPasswords } from "@/lib/users"
import { cleanText, WorkflowError } from "@/lib/workflow"

export type PartyImportResult = {
  parsed: number
  createdClients: number
  updatedClients: number
  skipped: number
  createdFiles: number
  updatedFiles: number
  errors: string[]
}

async function resolveImportOwnerId(actor: SessionUser) {
  // Büro listesi tüm avukatlara açık; sahiplik için aktif bir avukat tercih edilir.
  const lawyer = await prisma.user.findFirst({
    where: { role: "LAWYER" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  })
  return lawyer?.id ?? actor.id
}

async function findClientByParty(ownerId: string, party: PartyInput) {
  const key = partyNameKey(party.name)
  const byKey = await prisma.client.findFirst({
    where: {
      deletedAt: null,
      OR: [{ nameKey: key }, { name: cleanText(party.name), ownerId }],
    },
  })
  if (byKey) return byKey

  // Eski kayıtlarda nameKey boş olabilir — tr duyarsız tarama
  const candidates = await prisma.client.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, nameKey: true, ownerId: true },
    take: 5000,
  })
  return (
    candidates.find((row) => partyNameKey(row.name) === key || row.nameKey === key) ??
    null
  )
}

export async function importPartiesFromJson(
  actor: SessionUser,
  rawJson: string,
): Promise<PartyImportResult> {
  if (!canResetPasswords(actor.username)) {
    throw new WorkflowError("Taraf JSON içe aktarımı yalnızca Halil hesabına açıktır.")
  }

  let parties: PartyInput[]
  try {
    parties = parsePartiesJson(rawJson)
  } catch (error) {
    throw new WorkflowError(error instanceof Error ? error.message : "JSON okunamadı.")
  }
  if (parties.length === 0) {
    throw new WorkflowError("JSON içinde içe aktarılacak taraf bulunamadı.")
  }

  const ownerId = await resolveImportOwnerId(actor)
  const result: PartyImportResult = {
    parsed: parties.length,
    createdClients: 0,
    updatedClients: 0,
    skipped: 0,
    createdFiles: 0,
    updatedFiles: 0,
    errors: [],
  }

  for (const party of parties) {
    try {
      const externalKey = partyExternalKey(party)
      const hash = partyContentHash(party)
      const existingFp = await prisma.importFingerprint.findUnique({
        where: { kind_externalKey: { kind: "party", externalKey } },
      })
      if (existingFp && existingFp.contentHash === hash) {
        result.skipped += 1
        continue
      }

      const name = cleanText(party.name)
      const nameKey = partyNameKey(name)
      let client = await findClientByParty(ownerId, party)
      let clientCreated = false
      if (!client) {
        client = await prisma.client.create({
          data: { name, nameKey, ownerId },
        })
        clientCreated = true
        result.createdClients += 1
      } else {
        const needsNameUpdate = client.name !== name || client.nameKey !== nameKey
        if (needsNameUpdate || existingFp) {
          client = await prisma.client.update({
            where: { id: client.id },
            data: {
              name,
              nameKey,
              deletedAt: null,
            },
          })
          if (!clientCreated) result.updatedClients += 1
        }
      }

      for (const file of party.files) {
        const fileNumber = cleanText(file.fileNumber)
        if (fileNumber.length < 2) continue
        const existingFile = await prisma.caseFile.findUnique({
          where: {
            clientId_fileNumber: { clientId: client.id, fileNumber },
          },
        })
        if (!existingFile) {
          await prisma.caseFile.create({
            data: {
              clientId: client.id,
              fileNumber,
              courtName: cleanText(file.courtName),
              notes: cleanText(file.notes),
            },
          })
          result.createdFiles += 1
        } else {
          const nextCourt = cleanText(file.courtName)
          const nextNotes = cleanText(file.notes)
          if (
            existingFile.deletedAt ||
            (nextCourt && existingFile.courtName !== nextCourt) ||
            (nextNotes && existingFile.notes !== nextNotes)
          ) {
            await prisma.caseFile.update({
              where: { id: existingFile.id },
              data: {
                deletedAt: null,
                courtName: nextCourt || existingFile.courtName,
                notes: nextNotes || existingFile.notes,
              },
            })
            result.updatedFiles += 1
          }
        }
      }

      await prisma.importFingerprint.upsert({
        where: { kind_externalKey: { kind: "party", externalKey } },
        create: {
          kind: "party",
          externalKey,
          contentHash: hash,
          clientId: client.id,
          meta: name,
        },
        update: {
          contentHash: hash,
          clientId: client.id,
          meta: name,
        },
      })
    } catch (error) {
      result.errors.push(
        `${party.name}: ${error instanceof Error ? error.message : "kayıt hatası"}`,
      )
    }
  }

  return result
}
