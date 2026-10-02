import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { isCronAuthorized, normalizeSecret } from "@/lib/cron-auth"

describe("normalizeSecret", () => {
  it("trims whitespace and wrapping quotes", () => {
    assert.equal(normalizeSecret('  "abc123"  '), "abc123")
    assert.equal(normalizeSecret("'xyz'\n"), "xyz")
    assert.equal(normalizeSecret("plain"), "plain")
  })
})

describe("isCronAuthorized", () => {
  it("accepts Bearer header and query secret", () => {
    const secret = "test-cron-secret"
    const withBearer = new Request("https://example.com/api/cron/backup", {
      headers: { authorization: `Bearer ${secret}` },
    })
    assert.equal(isCronAuthorized(withBearer, secret), true)

    const withQuery = new Request(
      `https://example.com/api/cron/backup?secret=${secret}`,
    )
    assert.equal(isCronAuthorized(withQuery, secret), true)

    const bad = new Request("https://example.com/api/cron/backup", {
      headers: { authorization: "Bearer wrong" },
    })
    assert.equal(isCronAuthorized(bad, secret), false)
  })

  it("accepts quoted env secret against Bearer", () => {
    const req = new Request("https://example.com/api/cron/backup", {
      headers: { authorization: "Bearer real-secret" },
    })
    assert.equal(isCronAuthorized(req, '"real-secret"'), true)
  })
})
