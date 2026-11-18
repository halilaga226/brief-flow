import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { quoteForDate } from "./legal-quotes"
import { internRank, parsePoints, parseXpGain, RANK_LADDER } from "./xp"

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
    assert.equal(rank.nextTitle, null)
  })

  it("lists eight titles with 25 XP bands", () => {
    assert.equal(RANK_LADDER.length, 8)
    assert.equal(RANK_LADDER[0].fromXp, 0)
    assert.equal(RANK_LADDER[0].toXp, 24)
    assert.equal(RANK_LADDER[1].fromXp, 25)
    assert.equal(RANK_LADDER[7].fromXp, 175)
    assert.equal(RANK_LADDER[7].toXp, null)
  })
})

describe("parseXpGain", () => {
  it("reads +N XP from notification copy", () => {
    assert.equal(parseXpGain("+7 XP kazandınız", "işe 7 puan verdi"), 7)
    assert.equal(parseXpGain("Ek puan: +3 XP", "size 3 ek XP verdi"), 3)
    assert.equal(parseXpGain("Yeni iş atandı", "görev"), null)
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
