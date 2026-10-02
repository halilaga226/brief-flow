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

  it("parses UYAP rows export grouped by muvekkil", () => {
    const parties = parsePartiesJson(
      JSON.stringify({
        version: 1,
        type: "uyap-taraf",
        rows: [
          {
            dosyaNo: "2024/1",
            birimAdi: "Ankara 1. İcra Dairesi",
            dosyaTuru: "İcra Dosyası",
            dosyaDurumu: "Açık",
            muvekkil: "İLKNUR AKALIN",
            tarafOzet: "Alacaklı: İLKNUR AKALIN",
          },
          {
            dosyaNo: "2024/2",
            birimAdi: "Ankara 2. İcra Dairesi",
            muvekkil: "İLKNUR AKALIN",
          },
          {
            dosyaNo: "2025/9",
            birimAdi: "Bursa",
            muvekkil: "Ayşe Yılmaz",
          },
        ],
      }),
    )
    assert.equal(parties.length, 2)
    const ilk = parties.find((p) => partyNameKey(p.name) === "ilknur akalin")
    assert.ok(ilk)
    assert.equal(ilk!.files.length, 2)
    assert.match(ilk!.files[0].courtName, /İcra/)
  })
})
