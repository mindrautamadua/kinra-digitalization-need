import { test } from "node:test";
import assert from "node:assert/strict";
import { needDraftSchema, needFormDataToObject, validateNeedForSubmit } from "../src/lib/validation/need";

function fd(entries: Record<string, string | string[]>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) {
    if (Array.isArray(v)) v.forEach((x) => f.append(k, x));
    else f.set(k, v);
  }
  return f;
}

test("draft kosong valid; submit menolak kolom wajib", () => {
  const parsed = needDraftSchema.parse(needFormDataToObject(fd({})));
  const errors = validateNeedForSubmit(parsed);
  assert.ok(errors.title);
  assert.ok(errors.problemDescription);
  assert.ok(errors.respondentUrgency);
  assert.ok(errors.impacts);
});

test("submit lengkap lolos validasi", () => {
  const parsed = needDraftSchema.parse(
    needFormDataToObject(
      fd({
        title: "Penagihan manual",
        businessProcess: "Meter-to-cash",
        processOwner: "Kabag Utilitas",
        problemDescription: "Salah ketik",
        currentProcess: "Excel",
        impacts: ["time", "revenue"],
        consequenceIfUnresolved: "Komplain",
        desiredOutcome: "Otomatis",
        respondentUrgency: "high",
        urgencyReason: "Komplain naik",
      }),
    ),
  );
  assert.deepEqual(validateNeedForSubmit(parsed), {});
});

test("pertanyaan lanjutan wajib bila jawaban 'ya'", () => {
  const parsed = needDraftSchema.parse(needFormDataToObject(fd({ existingSystemRelation: "yes", integrationRequired: "yes", sensitiveDataFlag: "yes" })));
  const errors = validateNeedForSubmit(parsed);
  assert.ok(errors.existingSystemDetail);
  assert.ok(errors.integrationDetail);
  assert.ok(errors.sensitiveDataDetail);
});

test("nilai enum tidak dikenal ditolak", () => {
  const r = needDraftSchema.safeParse(needFormDataToObject(fd({ respondentUrgency: "sangat-kritis" })));
  assert.equal(r.success, false);
});

test("ukuran keberhasilan: angka diubah ke number dan memerlukan nama ukuran", () => {
  const parsed = needDraftSchema.parse(needFormDataToObject(fd({ baselineValue: "5", targetValue: "1,5" })));
  assert.equal(parsed.baselineValue, 5);
  assert.equal(parsed.targetValue, 1.5);
  assert.ok(validateNeedForSubmit(parsed).metricName);
  assert.equal(needDraftSchema.safeParse(needFormDataToObject(fd({ baselineValue: "lama" }))).success, false);
});

test("kosong menjadi null, dan kolom yang dipindah tidak ikut tersimpan", () => {
  const parsed = needDraftSchema.parse(needFormDataToObject(fd({ domainTags: ["tenant"], expectedBenefits: ["reduce_time"] })));
  assert.equal(parsed.baselineValue, null);
  assert.equal(parsed.metricName, null);
  assert.ok(!("domainTags" in parsed));
  assert.ok(!("expectedBenefits" in parsed));
});
