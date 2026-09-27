import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { dueTone } from "./format"
import {
  canAcceptTask,
  canComplete,
  canCreateTask,
  canDeleteTask,
  canManageOps,
  canQueueSend,
  canReview,
  canUploadDraft,
  fileHref,
  isParticipant,
  matchesFilter,
  matchesQuery,
  needsMyAction,
  safeFileName,
  showsOnHome,
  validateDraftFile,
  validateTrackingCode,
} from "./workflow"

const lawyer = "lawyer-a"
const otherLawyer = "lawyer-b"
const intern = "intern-a"

describe("privacy and roles", () => {
  it("keeps a task visible only to its parties", () => {
    const task = { assignerId: lawyer, assigneeId: intern }
    assert.equal(isParticipant(task, lawyer), true)
    assert.equal(isParticipant(task, intern), true)
    assert.equal(isParticipant(task, otherLawyer), false)
  })

  it("lets lawyers and admins assign work", () => {
    assert.equal(canCreateTask("LAWYER"), true)
    assert.equal(canCreateTask("ADMIN"), true)
    assert.equal(canCreateTask("INTERN"), false)
  })
})

describe("state machine", () => {
  it("asks the assignee for a draft only while assigned or in revision", () => {
    assert.equal(
      canUploadDraft({ status: "ATANDI", assigneeId: intern, acceptedAt: new Date() }, intern),
      true,
    )
    assert.equal(
      canUploadDraft({ status: "ATANDI", assigneeId: intern, acceptedAt: null }, intern),
      false,
    )
    assert.equal(
      canUploadDraft(
        { status: "REVIZE_ISTENDI", assigneeId: intern, acceptedAt: new Date() },
        intern,
      ),
      true,
    )
    assert.equal(
      canUploadDraft(
        { status: "INCELEME_BEKLIYOR", assigneeId: intern, acceptedAt: new Date() },
        intern,
      ),
      false,
    )
    assert.equal(
      canUploadDraft({ status: "ATANDI", assigneeId: intern, acceptedAt: new Date() }, lawyer),
      false,
    )
    assert.equal(
      canUploadDraft(
        { status: "ATANDI", assigneeId: intern, acceptedAt: null },
        lawyer,
        "ADMIN",
      ),
      true,
    )
  })

  it("lets an assignee accept once, and lawyers delete their tasks", () => {
    assert.equal(
      canAcceptTask({ status: "ATANDI", assigneeId: intern, acceptedAt: null }, intern),
      true,
    )
    assert.equal(
      canAcceptTask(
        { status: "ATANDI", assigneeId: intern, acceptedAt: new Date() },
        intern,
      ),
      false,
    )
    assert.equal(
      canDeleteTask(
        { status: "TAMAMLANDI", assignerId: lawyer, assigneeId: intern },
        lawyer,
        "LAWYER",
      ),
      true,
    )
    assert.equal(
      canDeleteTask(
        { status: "TAMAMLANDI", assignerId: lawyer, assigneeId: intern },
        intern,
        "INTERN",
      ),
      false,
    )
  })

  it("keeps home focused on accept + due-soon items", () => {
    assert.equal(
      showsOnHome(
        {
          assigneeId: intern,
          assignerId: lawyer,
          acceptedAt: null,
          status: "ATANDI",
          dueTone: "later",
          needsAction: true,
        },
        intern,
        "INTERN",
      ),
      true,
    )
    assert.equal(
      showsOnHome(
        {
          assigneeId: intern,
          assignerId: lawyer,
          acceptedAt: new Date().toISOString(),
          status: "ATANDI",
          dueTone: "later",
          needsAction: true,
        },
        intern,
        "INTERN",
      ),
      false,
    )
    assert.equal(
      showsOnHome(
        {
          assigneeId: intern,
          assignerId: lawyer,
          acceptedAt: new Date().toISOString(),
          status: "ATANDI",
          dueTone: "soon",
          needsAction: true,
        },
        intern,
        "INTERN",
      ),
      true,
    )
    assert.equal(
      showsOnHome(
        {
          assigneeId: intern,
          assignerId: lawyer,
          acceptedAt: new Date().toISOString(),
          status: "TAMAMLANDI",
          dueTone: "done",
          needsAction: false,
        },
        intern,
        "INTERN",
      ),
      false,
    )
  })

  it("lets only the assigning lawyer review a draft", () => {
    const task = { status: "INCELEME_BEKLIYOR" as const, assignerId: lawyer }
    assert.equal(canReview(task, lawyer, "LAWYER"), true)
    assert.equal(canReview(task, otherLawyer, "LAWYER"), false)
    assert.equal(canReview(task, intern, "INTERN"), false)
    assert.equal(canReview(task, otherLawyer, "ADMIN"), true)
    assert.equal(
      canReview({ status: "ATANDI", assignerId: lawyer }, lawyer, "LAWYER"),
      false,
    )
  })

  it("lets the assigning lawyer decide expense, call and send after approval", () => {
    const task = { status: "ONAYLANDI" as const, assignerId: lawyer }
    assert.equal(canManageOps(task, lawyer, "LAWYER"), true)
    assert.equal(canQueueSend(task, lawyer, "LAWYER"), true)
    assert.equal(canManageOps(task, otherLawyer, "LAWYER"), false)
    assert.equal(canManageOps(task, intern, "INTERN"), false)
    assert.equal(canQueueSend({ status: "GONDERIM_BEKLIYOR", assignerId: lawyer }, lawyer, "LAWYER"), false)
  })

  it("lets assignee or assigning lawyer complete after send queue", () => {
    assert.equal(
      canComplete({ status: "GONDERIM_BEKLIYOR", assigneeId: intern, assignerId: lawyer }, intern),
      true,
    )
    assert.equal(
      canComplete(
        { status: "GONDERIM_BEKLIYOR", assigneeId: intern, assignerId: lawyer },
        lawyer,
        "LAWYER",
      ),
      true,
    )
    assert.equal(
      canComplete({ status: "INCELEME_BEKLIYOR", assigneeId: intern, assignerId: lawyer }, intern),
      false,
    )
  })

  it("puts the next action on the right person", () => {
    assert.equal(
      needsMyAction(
        { status: "INCELEME_BEKLIYOR", assignerId: lawyer, assigneeId: intern },
        lawyer,
      ),
      true,
    )
    assert.equal(
      needsMyAction(
        { status: "INCELEME_BEKLIYOR", assignerId: lawyer, assigneeId: intern },
        intern,
      ),
      false,
    )
    assert.equal(
      needsMyAction(
        { status: "GONDERIM_BEKLIYOR", assignerId: lawyer, assigneeId: intern },
        intern,
      ),
      true,
    )
    assert.equal(
      needsMyAction(
        { status: "TAMAMLANDI", assignerId: lawyer, assigneeId: intern },
        intern,
      ),
      false,
    )
  })
})

describe("tracking code", () => {
  it("blocks completion without a code", () => {
    const result = validateTrackingCode("   ")
    assert.equal(result.ok, false)
    if (!result.ok) {
      assert.match(result.error, /olmadan/)
    }
  })

  it("accepts a UYAP or barcode style code", () => {
    assert.deepEqual(validateTrackingCode("2026-UYAP-77190"), {
      ok: true,
      code: "2026-UYAP-77190",
    })
    assert.equal(validateTrackingCode("PTT123456789TR").ok, true)
  })

  it("rejects short and symbolic codes", () => {
    assert.equal(validateTrackingCode("abc").ok, false)
    assert.equal(validateTrackingCode("kod#12345").ok, false)
  })
})

describe("files and filters", () => {
  it("strips paths and limits extensions", () => {
    assert.equal(safeFileName("..\\..\\Fesih ihtarı.pdf"), "Fesih ihtarı.pdf")
    assert.equal(validateDraftFile({ name: "dilekce.udf", size: 1200 }).ok, true)
    assert.equal(validateDraftFile({ name: "not.txt", size: 1200 }).ok, false)
    assert.equal(validateDraftFile({ name: "buyuk.pdf", size: 11 * 1024 * 1024 }).ok, false)
  })

  it("only links mock previews and Google Drive hosts", () => {
    assert.deepEqual(fileHref("/onizleme/dosya/mock_1", "mock"), {
      href: "/onizleme/dosya/mock_1",
      external: false,
    })
    assert.equal(fileHref("javascript:alert(1)", "mock"), null)
    assert.equal(
      fileHref("https://drive.google.com/file/d/abc/view", "google")?.external,
      true,
    )
    assert.equal(fileHref("https://evil.example/file", "google"), null)
  })

  it("filters by whose turn it is", () => {
    const waiting = {
      status: "REVIZE_ISTENDI" as const,
      dueTone: "soon" as const,
      needsAction: true,
    }
    assert.equal(matchesFilter(waiting, "bekleyen"), true)
    assert.equal(matchesFilter(waiting, "tamam"), false)
  })

  it("searches Turkish case-insensitively", () => {
    const task = {
      title: "İşe iade dava dilekçesi",
      clientName: "Deniz Acar",
      fileNumber: "2026/184 Esas",
      trackingCode: null,
      assigneeName: "Elif Yılmaz",
      assignerName: "Ayşe Demir",
    }
    assert.equal(matchesQuery(task, "işe iade"), true)
    assert.equal(matchesQuery(task, "yılmaz"), true)
    assert.equal(matchesQuery(task, "icra"), false)
  })

  it("marks past Istanbul days as overdue", () => {
    const now = new Date("2026-09-25T12:00:00.000Z")
    assert.equal(dueTone("2026-09-23T15:00:00.000Z", "ATANDI", now), "overdue")
    assert.equal(dueTone("2026-09-25T15:00:00.000Z", "ATANDI", now), "today")
    assert.equal(dueTone("2026-09-25T15:00:00.000Z", "TAMAMLANDI", now), "done")
  })
})
