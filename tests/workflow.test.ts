import { test } from "node:test";
import assert from "node:assert/strict";
import { REASON_REQUIRED, STAFF_TRANSITIONS } from "../src/lib/workflow";
import { validateUpload } from "../src/lib/upload-rules";

test("draft tidak bisa diubah statusnya oleh staf; submitted bisa ke under_review", () => {
  assert.deepEqual(STAFF_TRANSITIONS.draft, []);
  assert.ok(STAFF_TRANSITIONS.submitted.includes("under_review"));
  assert.ok(!STAFF_TRANSITIONS.submitted.includes("prioritized"));
});

test("status yang memerlukan alasan", () => {
  for (const s of ["returned_for_revision", "clarification_required", "deferred", "rejected"]) assert.ok(REASON_REQUIRED.includes(s as never));
});

test("validasi unggahan menolak tipe/ekstensi/magic bytes yang salah", () => {
  const pdfHead = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
  assert.equal(validateUpload({ name: "a.pdf", type: "application/pdf", size: 100 }, pdfHead), null);
  assert.ok(validateUpload({ name: "a.exe", type: "application/x-msdownload", size: 100 }, pdfHead));
  assert.ok(validateUpload({ name: "a.pdf", type: "image/png", size: 100 }, pdfHead)); // ekstensi vs mime
  assert.ok(validateUpload({ name: "a.pdf", type: "application/pdf", size: 100 }, new Uint8Array([0x4d, 0x5a, 0, 0]))); // MZ header
  assert.ok(validateUpload({ name: "a.pdf", type: "application/pdf", size: 0 }, pdfHead));
  assert.ok(validateUpload({ name: "a.pdf", type: "application/pdf", size: 999_999_999 }, pdfHead));
});
