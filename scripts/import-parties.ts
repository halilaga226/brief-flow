import { readFileSync } from "node:fs"
import { prisma } from "../src/lib/prisma"
import { parsePartiesJson } from "../src/lib/party-import"
import { importPartiesFromJson } from "../src/server/party-import"

async function main() {
  const path = process.argv[2] || "data/imports/UYAP_TARAF_BILGILERI.json"
  const raw = readFileSync(path, "utf8")
  const parsed = parsePartiesJson(raw)
  console.log(
    "parsed parties",
    parsed.length,
    "files",
    parsed.reduce((sum, party) => sum + party.files.length, 0),
  )
  const halil = await prisma.user.findUnique({ where: { username: "halil" } })
  if (!halil) throw new Error("halil kullanıcısı yok")
  const result = await importPartiesFromJson(
    {
      id: halil.id,
      name: halil.name,
      username: halil.username,
      email: halil.email ?? "",
      role: halil.role,
      title: halil.title,
    },
    raw,
  )
  console.log(JSON.stringify(result, null, 2))
  console.log({
    clients: await prisma.client.count({ where: { deletedAt: null } }),
    files: await prisma.caseFile.count({ where: { deletedAt: null } }),
  })
  await prisma.$disconnect()
}

main().catch(async (error) => {
  console.error(error)
  await prisma.$disconnect()
  process.exit(1)
})
