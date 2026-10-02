import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  parsePartiesJson,
  partyContentHash,
  partyExternalKey,
  partyNameKey,
} from "./party-import"

describe("party import parser", () => {
  it("folds Turkish names for dedupe keys", () => {
    assert.equal(partyNameKey("İSMAİL GÜL"), partyNameKey("ismail gul"))
    assert.equal(partyNameKey("  Deniz  Acar "), "deniz acar")
  })

  it("parses nested taraflar and merges duplicate people", () => {
    const parties = parsePartiesJson(
      JSON.stringify({
        taraflar: [
          {
            ad: "Deniz Acar",
            dosyalar: [{ dosyaNo: "2026/1", mahkeme: "Ankara" }],
          },
          {
            name: "deniz acar",
            files: [{ fileNumber: "2026/2", courtName: "İstanbul" }],
          },
          {
            müvekkil: "Ayşe Yılmaz",
            dosyaNo: "2025/9",
            mahkeme: "Bursa",
          },
        ],
      }),
    )
    assert.equal(parties.length, 2)
    const deniz = parties.find((p) => partyNameKey(p.name) === "deniz acar")
    assert.ok(deniz)
    assert.equal(deniz!.files.length, 2)
    assert.equal(partyExternalKey(deniz!), "name:deniz acar")
  })

  it("changes hash when files change", () => {
    const a = {
      name: "Deniz Acar",
      externalId: null,
      files: [{ fileNumber: "1", courtName: "", notes: "" }],
      raw: {},
    }
    const b = {
      ...a,
      files: [{ fileNumber: "1", courtName: "Ankara", notes: "" }],
    }
    assert.notEqual(partyContentHash(a), partyContentHash(b))
  })
})
