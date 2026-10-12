import { test } from "node:test";
import assert from "node:assert/strict";
import { computeWeightedScore, DEFAULT_WEIGHTS, priorityCategory, scoreBreakdown, weightsAreValid } from "../src/lib/scoring";

test("bobot default berjumlah 100", () => {
  assert.equal(weightsAreValid(DEFAULT_WEIGHTS), true);
});

test("skor berbobot sesuai rumus Σ(nilai ÷ 5 × bobot)", () => {
  const all5 = computeWeightedScore({ scoreImpact: 5, scoreRisk: 5, scoreUrgency: 5, scoreStrategy: 5, scoreReadiness: 5, scoreReuse: 5 });
  assert.equal(all5, 100);
  const all1 = computeWeightedScore({ scoreImpact: 1, scoreRisk: 1, scoreUrgency: 1, scoreStrategy: 1, scoreReadiness: 1, scoreReuse: 1 });
  assert.equal(all1, 20);
  const mixed = computeWeightedScore({ scoreImpact: 4, scoreRisk: 3, scoreUrgency: 4, scoreStrategy: 4, scoreReadiness: 3, scoreReuse: 3 });
  // 24 + 15 + 12 + 12 + 6 + 3 = 72
  assert.equal(mixed, 72);
});

test("skor null bila ada kriteria belum dinilai atau di luar 1..5", () => {
  assert.equal(computeWeightedScore({ scoreImpact: 5 }), null);
  assert.equal(computeWeightedScore({ scoreImpact: 6, scoreRisk: 1, scoreUrgency: 1, scoreStrategy: 1, scoreReadiness: 1, scoreReuse: 1 }), null);
});

test("kategori prioritas sesuai ambang PRD", () => {
  assert.equal(priorityCategory(80).key, "very_high");
  assert.equal(priorityCategory(79.9).key, "high");
  assert.equal(priorityCategory(65).key, "high");
  assert.equal(priorityCategory(50).key, "medium");
  assert.equal(priorityCategory(49).key, "low");
  assert.equal(priorityCategory(null).key, "unscored");
});

test("rincian kontribusi per kriteria", () => {
  const b = scoreBreakdown({ scoreImpact: 5, scoreRisk: null });
  assert.equal(b.find((x) => x.key === "scoreImpact")?.contribution, 30);
  assert.equal(b.find((x) => x.key === "scoreRisk")?.contribution, null);
});
