import type { ScoreKey } from "./enums";

export type ScoreWeights = Record<ScoreKey, number>;

export const DEFAULT_WEIGHTS: ScoreWeights = {
  scoreImpact: 30,
  scoreRisk: 25,
  scoreUrgency: 15,
  scoreStrategy: 15,
  scoreReadiness: 10,
  scoreReuse: 5,
};

export type ScoreThresholds = { veryHigh: number; high: number; medium: number };
export const DEFAULT_THRESHOLDS: ScoreThresholds = { veryHigh: 80, high: 65, medium: 50 };

export type ScoreInput = Partial<Record<ScoreKey, number | null | undefined>>;

/** Skor berbobot = Σ (nilai ÷ 5 × bobot). Hasil 0–100. Null jika ada kriteria yang belum dinilai. */
export function computeWeightedScore(scores: ScoreInput, weights: ScoreWeights = DEFAULT_WEIGHTS): number | null {
  const keys = Object.keys(weights) as ScoreKey[];
  let total = 0;
  for (const k of keys) {
    const v = scores[k];
    if (v == null || Number.isNaN(v)) return null;
    if (v < 1 || v > 5) return null;
    total += (v / 5) * weights[k];
  }
  return Math.round(total * 100) / 100;
}

export function scoreBreakdown(scores: ScoreInput, weights: ScoreWeights = DEFAULT_WEIGHTS) {
  return (Object.keys(weights) as ScoreKey[]).map((k) => {
    const v = scores[k];
    const contribution = v == null ? null : Math.round(((v / 5) * weights[k]) * 100) / 100;
    return { key: k, value: v ?? null, weight: weights[k], contribution };
  });
}

export function priorityCategory(score: number | null, t: ScoreThresholds = DEFAULT_THRESHOLDS) {
  if (score == null) return { key: "unscored", label: "Belum dinilai", tone: "gray" } as const;
  if (score >= t.veryHigh) return { key: "very_high", label: "Sangat tinggi", tone: "red" } as const;
  if (score >= t.high) return { key: "high", label: "Tinggi", tone: "orange" } as const;
  if (score >= t.medium) return { key: "medium", label: "Menengah", tone: "blue" } as const;
  return { key: "low", label: "Rendah / rumuskan ulang", tone: "gray" } as const;
}

export function weightsAreValid(w: ScoreWeights) {
  const sum = Object.values(w).reduce((a, b) => a + b, 0);
  return Math.abs(sum - 100) < 0.001 && Object.values(w).every((x) => x >= 0);
}
