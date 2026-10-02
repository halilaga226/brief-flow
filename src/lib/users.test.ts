import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  canResetPasswords,
  validateNewPassword,
  validatePersonEmail,
  validatePersonName,
  validateUsername,
} from "./users"

describe("user validation", () => {
  it("rejects demo emails and weak passwords", () => {
    assert.equal(validatePersonEmail("ayse.demir@vekalet.local").ok, false)
    assert.equal(validatePersonEmail("halil@buroadi.com").ok, true)
    assert.equal(validatePersonEmail("").ok, true)
    assert.equal(validateNewPassword("short").ok, false)
    assert.equal(validateNewPassword("sadeceharfler").ok, false)
    assert.equal(validateNewPassword("GecerliParola12").ok, true)
  })

  it("limits password reset to halil", () => {
    assert.equal(canResetPasswords("halil"), true)
    assert.equal(canResetPasswords("Halil"), true)
    assert.equal(canResetPasswords("kaan.atli"), false)
  })

  it("requires a real name and username", () => {
    assert.equal(validatePersonName("A").ok, false)
    assert.equal(validatePersonName("Halil Karakaya").ok, true)
    assert.equal(validateUsername("ab").ok, false)
    assert.equal(validateUsername("halil!").ok, false)
    assert.equal(validateUsername("halil.karakaya").ok, true)
    assert.equal(validateUsername("Halil.Karakaya").ok, true)
  })
})
