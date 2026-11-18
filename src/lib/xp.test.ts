import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { quoteForDate } from "./legal-quotes"
import { internRank, parsePoints } from "./xp"

describe("intern rank", () => {
  it("starts as kalem çırağı at zero xp", () => {
    const rank = internRank(0)
    assert.equal(rank.level, 1)
    assert.equal(rank.title, "Kalem çırağı")
    assert.equal(rank.into, 0)
  })

  it("levels every 25 xp", () => {
    assert.equal(internRank(24).level, 1)
    assert.equal(internRank(25).level, 2)
    assert.equal(internRank(25).title, "Dilekçe yazarı")
    assert.equal(internRank(50).level, 3)
  })

  it("caps title at the last rank", () => {
    const rank = internRank(500)
    assert.equal(rank.title, "Yargının yıldızı")
    assert.ok(rank.level > 8)
  })
})

describe("parsePoints", () => {
  it("accepts 1–10", () => {
    assert.equal(parsePoints("7"), 7)
    assert.equal(parsePoints(1), 1)
    assert.equal(parsePoints("10"), 10)
  })

  it("rejects out of range", () => {
    assert.equal(parsePoints("0"), null)
    assert.equal(parsePoints("11"), null)
    assert.equal(parsePoints("abc"), null)
  })
})

describe("daily legal quote", () => {
  it("is stable for the same Istanbul day", () => {
    const a = quoteForDate(new Date("2026-11-18T08:00:00Z"))
    const b = quoteForDate(new Date("2026-11-18T20:00:00Z"))
    assert.equal(a.dayKey, b.dayKey)
    assert.equal(a.text, b.text)
    assert.ok(a.text.length > 10)
  })
})
