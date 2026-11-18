import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { quoteForDate } from "./legal-quotes"
import { clampVolume } from "./christmas-tunes"
import { internRank, parsePoints, parseXpGain, RANK_LADDER } from "./xp"

describe("intern rank", () => {
  it("starts as stajyer at zero xp", () => {
    const rank = internRank(0)
    assert.equal(rank.level, 1)
    assert.equal(rank.title, "Stajyer")
    assert.equal(rank.into, 0)
  })

  it("levels every 25 xp", () => {
    assert.equal(internRank(24).level, 1)
    assert.equal(internRank(25).level, 2)
    assert.equal(internRank(25).title, "Kalem stajyeri")
    assert.equal(internRank(50).level, 3)
    assert.equal(internRank(50).title, "Evrak stajyeri")
  })

  it("caps title at kıdemli avukat", () => {
    const rank = internRank(500)
    assert.equal(rank.level, 15)
    assert.equal(rank.title, "Kıdemli avukat")
    assert.equal(rank.nextTitle, null)
    assert.equal(rank.remaining, 0)
    assert.equal(rank.progress, 1)
  })

  it("lists fifteen titles with 25 XP bands", () => {
    assert.equal(RANK_LADDER.length, 15)
    assert.equal(RANK_LADDER[0].fromXp, 0)
    assert.equal(RANK_LADDER[0].toXp, 24)
    assert.equal(RANK_LADDER[1].fromXp, 25)
    assert.equal(RANK_LADDER[14].fromXp, 350)
    assert.equal(RANK_LADDER[14].toXp, null)
  })
})

describe("holiday volume", () => {
  it("clamps the music bar to 0–1", () => {
    assert.equal(clampVolume(-2), 0)
    assert.equal(clampVolume(0.4), 0.4)
    assert.equal(clampVolume(3), 1)
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
