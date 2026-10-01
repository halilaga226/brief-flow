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
  isOnAssigneeWorkList,
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
  it("lets assignee send to lawyer while assigned or in revision without accept", () => {
    assert.equal(
      canUploadDraft({ status: "ATANDI", assigneeId: intern, acceptedAt: null }, intern),
      true,
    )
    assert.equal(
      canUploadDraft(
        { status: "REVIZE_ISTENDI", assigneeId: intern, acceptedAt: null },
        intern,
      ),
      true,
    )
    assert.equal(
      canUploadDraft(
        { status: "INCELEME_BEKLIYOR", assigneeId: intern, acceptedAt: null },
        intern,
      ),
      false,
    )
    assert.equal(
      canUploadDraft({ status: "ATANDI", assigneeId: intern, acceptedAt: null }, lawyer),
      false,
    )
  })

  it("disables accept step; lawyers delete only their assignments", () => {
    assert.equal(
      canAcceptTask({ status: "ATANDI", assigneeId: intern, acceptedAt: null }, intern),
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
        { status: "TAMAMLANDI", assignerId: otherLawyer, assigneeId: lawyer },
        lawyer,
        "LAWYER",
      ),
      false,
    )
  })

  it("drops assignee work list after send-to-lawyer", () => {
    assert.equal(isOnAssigneeWorkList("ATANDI"), true)
    assert.equal(isOnAssigneeWorkList("INCELEME_BEKLIYOR"), false)
    assert.equal(isOnAssigneeWorkList("REVIZE_ISTENDI"), true)
  })

  it("keeps home focused on active + due-soon items", () => {
    assert.equal(
      showsOnHome(
        {
          assigneeId: intern,
          assignerId: lawyer,
          acceptedAt: new Date(),
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
          acceptedAt: new Date(),
          status: "INCELEME_BEKLIYOR",
          dueTone: "later",
          needsAction: false,
        },
        intern,
        "INTERN",
      ),
      false,
    )
  })

  it("gates review and ops to the assigning lawyer", () => {
    assert.equal(
      canReview({ status: "INCELEME_BEKLIYOR", assignerId: lawyer }, lawyer, "LAWYER"),
      true,
    )
    assert.equal(
      canReview({ status: "KONTROL_EDILECEK", assignerId: lawyer }, lawyer, "LAWYER"),
      true,
    )
    assert.equal(
      canReview({ status: "INCELEME_BEKLIYOR", assignerId: lawyer }, otherLawyer, "LAWYER"),
      false,
    )
    assert.equal(
      canManageOps({ status: "ONAYLANDI", assignerId: lawyer }, lawyer, "LAWYER"),
      true,
    )
    assert.equal(
      canQueueSend({ status: "ONAYLANDI", assignerId: lawyer }, lawyer, "LAWYER"),
      true,
    )
    assert.equal(
      canComplete({ status: "GONDERIM_BEKLIYOR", assigneeId: intern, assignerId: lawyer }, intern),
      true,
    )
  })
})

describe("files and filters", () => {
  it("strips paths and limits extensions", () => {
    assert.equal(safeFileName("../../x.pdf"), "x.pdf")
    assert.equal(validateDraftFile({ name: "a.exe", size: 10 }).ok, false)
  })

  it("only links mock previews and Google Drive hosts", () => {
    assert.equal(fileHref("/onizleme/dosya/1", "mock")?.external, false)
    assert.equal(
      fileHref("https://drive.google.com/file/d/abc/view", "google")?.external,
      true,
    )
  })

  it("filters by whose turn it is", () => {
    assert.equal(
      needsMyAction({ status: "ATANDI", assignerId: lawyer, assigneeId: intern }, intern),
      true,
    )
    assert.equal(
      needsMyAction(
        { status: "INCELEME_BEKLIYOR", assignerId: lawyer, assigneeId: intern },
        lawyer,
      ),
      true,
    )
  })

  it("searches Turkish case-insensitively", () => {
    assert.equal(
      matchesQuery(
        {
          title: "İŞE İADE",
          clientName: "Deniz",
          fileNumber: "2024",
          trackingCode: null,
          assigneeName: "Elif",
          assignerName: "Ayşe",
        },
        "işe",
      ),
      true,
    )
  })

  it("marks past Istanbul days as overdue", () => {
    assert.equal(dueTone("2020-01-01T00:00:00.000Z", "ATANDI"), "overdue")
  })

  it("matches filter folders", () => {
    assert.equal(
      matchesFilter(
        {
          status: "ATANDI",
          assignerId: lawyer,
          assigneeId: intern,
          dueTone: "later",
          needsAction: true,
        },
        "atanan",
        intern,
      ),
      true,
    )
  })
})

describe("tracking", () => {
  it("requires a tracking code", () => {
    assert.equal(validateTrackingCode("").ok, false)
    assert.equal(validateTrackingCode("2026-UYAP-1").ok, true)
  })
})
