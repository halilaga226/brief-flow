import { createHash } from "node:crypto"
import { cleanText } from "@/lib/workflow"

export type PartyFileInput = {
  fileNumber: string
  courtName: string
  notes: string
}

export type PartyInput = {
  name: string
  /** JSON’daki kalıcı kimlik (varsa) */
  externalId: string | null
  files: PartyFileInput[]
  raw: unknown
}

function foldTr(value: string) {
  return value
    .normalize("NFKC")
    .replace(/\u0130/g, "i")
    .replace(/\u0049/g, "i")
    .toLocaleLowerCase("tr-TR")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/[^a-z0-9\s.-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function partyNameKey(name: string) {
  return foldTr(cleanText(name))
}

function pickString(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key]
    if (typeof value === "string" && value.trim()) return cleanText(value)
    if (typeof value === "number" && Number.isFinite(value)) return String(value)
  }
  return ""
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function extractFiles(row: Record<string, unknown>): PartyFileInput[] {
  const candidates = [
    row.dosyalar,
    row.files,
    row.caseFiles,
    row.davalar,
    row.dosyaListesi,
  ]
  const list: PartyFileInput[] = []
  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue
    for (const item of candidate) {
      const file = asRecord(item)
      if (!file) continue
      const fileNumber = pickString(file, [
        "fileNumber",
        "dosyaNo",
        "dosya_no",
        "esasNo",
        "esas_no",
        "no",
        "number",
        "dosya",
      ])
      if (fileNumber.length < 2) continue
      list.push({
        fileNumber,
        courtName: pickString(file, [
          "courtName",
          "mahkeme",
          "mahkemeAdi",
          "court",
          "mahkeme_adi",
        ]),
        notes: pickString(file, ["notes", "not", "aciklama", "description", "konu"]),
      })
    }
  }

  // Tek dosya alanları kökte ise
  const singleNo = pickString(row, [
    "fileNumber",
    "dosyaNo",
    "dosya_no",
    "esasNo",
    "esas_no",
  ])
  if (singleNo.length >= 2 && list.every((f) => f.fileNumber !== singleNo)) {
    list.push({
      fileNumber: singleNo,
      courtName: pickString(row, ["courtName", "mahkeme", "mahkemeAdi", "court"]),
      notes: pickString(row, ["notes", "not", "aciklama", "konu"]),
    })
  }
  return list
}

function partyFromRow(row: Record<string, unknown>): PartyInput | null {
  const name = pickString(row, [
    "name",
    "ad",
    "adi",
    "adSoyad",
    "ad_soyad",
    "muvekkil",
    "müvekkil",
    "clientName",
    "client",
    "taraf",
    "unvan",
    "title",
  ])
  if (name.length < 2) return null
  const externalId =
    pickString(row, ["id", "externalId", "external_id", "tarafId", "uuid", "tc", "vergiNo"]) ||
    null
  return {
    name,
    externalId,
    files: extractFiles(row),
    raw: row,
  }
}

/** Esnek JSON: dizi, {taraflar|parties|muvekkiller|data|items:[]} veya tek nesne */
export function parsePartiesJson(raw: string): PartyInput[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error("JSON okunamadı.")
  }

  let rows: unknown[] = []
  if (Array.isArray(parsed)) {
    rows = parsed
  } else {
    const obj = asRecord(parsed)
    if (!obj) throw new Error("JSON dizi veya nesne olmalı.")
    const nested =
      obj.taraflar ??
      obj.parties ??
      obj.muvekkiller ??
      obj.müvekkiller ??
      obj.clients ??
      obj.data ??
      obj.items ??
      obj.records ??
      obj.sonuclar
    if (Array.isArray(nested)) rows = nested
    else rows = [obj]
  }

  const out: PartyInput[] = []
  const seen = new Set<string>()
  for (const item of rows) {
    const row = asRecord(item)
    if (!row) continue
    const party = partyFromRow(row)
    if (!party) continue
    const key = party.externalId
      ? `id:${foldTr(party.externalId)}`
      : `name:${partyNameKey(party.name)}`
    if (seen.has(key)) {
      // Aynı kişide birden fazla satır → dosyaları birleştir
      const existing = out.find((p) => {
        const k = p.externalId
          ? `id:${foldTr(p.externalId)}`
          : `name:${partyNameKey(p.name)}`
        return k === key
      })
      if (existing) {
        for (const file of party.files) {
          if (!existing.files.some((f) => f.fileNumber === file.fileNumber)) {
            existing.files.push(file)
          }
        }
      }
      continue
    }
    seen.add(key)
    out.push(party)
  }
  return out
}

export function partyContentHash(party: PartyInput) {
  const payload = {
    name: partyNameKey(party.name),
    files: party.files
      .map((f) => ({
        n: f.fileNumber.trim().toLocaleLowerCase("tr-TR"),
        c: foldTr(f.courtName),
        t: foldTr(f.notes),
      }))
      .sort((a, b) => a.n.localeCompare(b.n, "tr")),
  }
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex")
}

export function partyExternalKey(party: PartyInput) {
  if (party.externalId) return `id:${foldTr(party.externalId)}`
  return `name:${partyNameKey(party.name)}`
}
