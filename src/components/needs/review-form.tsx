"use client";
import { useActionState, useMemo, useState } from "react";
import { saveReviewAction } from "@/actions/review";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input, RadioGroup, Select, Textarea } from "@/components/ui/input";
import { FormMessage, SubmitButton } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { COMPLETENESS, DELAY_RISK, DUPLICATE_STATUS, FOLLOW_UP, ROOT_CAUSE, SCORE_CRITERIA, SOLUTION_CATEGORY, STRATEGIC_ALIGNMENT, type ScoreKey } from "@/lib/enums";
import { computeWeightedScore, priorityCategory, type ScoreThresholds, type ScoreWeights } from "@/lib/scoring";
import type { NeedReview } from "@/lib/db/schema";

export function ReviewForm({
  needId,
  review,
  relatedCodes,
  weights,
  thresholds,
  readOnly,
}: {
  needId: string;
  review: NeedReview | null;
  relatedCodes: string[];
  weights: ScoreWeights;
  thresholds: ScoreThresholds;
  readOnly?: boolean;
}) {
  const [state, action] = useActionState(saveReviewAction.bind(null, needId), undefined);
  const [scores, setScores] = useState<Record<ScoreKey, number | null>>({
    scoreImpact: review?.scoreImpact ?? null,
    scoreRisk: review?.scoreRisk ?? null,
    scoreUrgency: review?.scoreUrgency ?? null,
    scoreStrategy: review?.scoreStrategy ?? null,
    scoreReadiness: review?.scoreReadiness ?? null,
    scoreReuse: review?.scoreReuse ?? null,
  });
  const [critical, setCritical] = useState(review?.criticalFlag ?? false);
  const [delayRisk, setDelayRisk] = useState(review?.delayRisk ?? "");
  const [completeness, setCompleteness] = useState(review?.completeness ?? "");
  const [rootCause, setRootCause] = useState(review?.rootCauseStatus ?? "");
  const [dup, setDup] = useState(review?.duplicateStatus ?? "");
  const [align, setAlign] = useState(review?.strategicAlignment ?? "");
  const [followUp, setFollowUp] = useState(review?.followUpRecommendation ?? "");

  const live = useMemo(() => computeWeightedScore(scores, weights), [scores, weights]);
  const cat = priorityCategory(live, thresholds);
  const dis = readOnly;

  return (
    <form action={action}>
      <Card>
        <CardHeader
          title="Form C — Review Tim Assessment TI"
          description="Skor adalah indikasi awal untuk membandingkan kebutuhan, bukan keputusan investasi."
          actions={
            <div className="text-right">
              <p className="text-xs text-muted">Skor berbobot (live)</p>
              <p className="text-2xl font-semibold leading-none">{live == null ? "–" : live.toFixed(1)}</p>
              <Badge tone={cat.tone}>{cat.label}</Badge>
            </div>
          }
        />
        <CardBody className="space-y-5">
          <fieldset disabled={dis} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Kelengkapan informasi">
                <RadioGroup name="completeness" options={COMPLETENESS} value={completeness} onChange={setCompleteness} inline />
              </Field>
              <Field label="Akar masalah teridentifikasi">
                <RadioGroup name="rootCauseStatus" options={ROOT_CAUSE} value={rootCause} onChange={setRootCause} inline />
              </Field>
              <Field label="Duplikasi dengan kebutuhan lain">
                <RadioGroup name="duplicateStatus" options={DUPLICATE_STATUS} value={dup} onChange={setDup} inline />
              </Field>
              <Field label="Referensi kebutuhan terkait" htmlFor="relatedNeedCodes" hint="Kode kebutuhan dipisah koma, mis. DNA-2026-0003, DNA-2026-0010.">
                <Input id="relatedNeedCodes" name="relatedNeedCodes" defaultValue={relatedCodes.join(", ")} maxLength={500} />
              </Field>
              <Field label="Kategori solusi awal" htmlFor="solutionCategory">
                <Select id="solutionCategory" name="solutionCategory" defaultValue={review?.solutionCategory ?? ""}>
                  <option value="">— belum ditetapkan —</option>
                  {SOLUTION_CATEGORY.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Kesesuaian dengan strategi / RSTI">
                <RadioGroup name="strategicAlignment" options={STRATEGIC_ALIGNMENT} value={align} onChange={setAlign} inline />
              </Field>
              <Field label="Risiko jika ditunda">
                <RadioGroup name="delayRisk" options={DELAY_RISK} value={delayRisk} onChange={setDelayRisk} inline />
              </Field>
              <Field label="Alasan risiko jika ditunda" htmlFor="delayRiskReason" required={Boolean(delayRisk)}>
                <Textarea id="delayRiskReason" name="delayRiskReason" defaultValue={review?.delayRiskReason ?? ""} maxLength={4000} className="min-h-[72px]" />
              </Field>
            </div>
            <Field label="Rekomendasi tindak lanjut">
              <RadioGroup name="followUpRecommendation" options={FOLLOW_UP} value={followUp} onChange={setFollowUp} inline />
            </Field>
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Catatan reviewer" htmlFor="reviewerNotes">
                <Textarea id="reviewerNotes" name="reviewerNotes" defaultValue={review?.reviewerNotes ?? ""} maxLength={4000} />
              </Field>
              <Field label="Daftar pertanyaan klarifikasi" htmlFor="clarificationQuestions" hint="Gunakan panel Klarifikasi untuk mengirimkannya ke responden.">
                <Textarea id="clarificationQuestions" name="clarificationQuestions" defaultValue={review?.clarificationQuestions ?? ""} maxLength={4000} />
              </Field>
            </div>

            <div className="rounded-md border border-border">
              <div className="border-b border-border bg-slate-50 px-4 py-2 text-sm font-semibold">Skor prioritas awal (skala 1–5)</div>
              <div className="divide-y divide-border">
                {SCORE_CRITERIA.map((c) => {
                  const v = scores[c.key];
                  const contrib = v == null ? null : ((v / 5) * weights[c.key]).toFixed(1);
                  return (
                    <div key={c.key} className="grid gap-2 px-4 py-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                      <div>
                        <p className="text-sm font-medium">
                          {c.label} <span className="text-xs text-muted">· bobot {weights[c.key]}%</span>
                        </p>
                        <p className="text-xs text-muted">{c.hint}</p>
                      </div>
                      <div className="flex gap-1" role="radiogroup" aria-label={c.label}>
                        <input type="hidden" name={c.key} value={v ?? ""} />
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            disabled={dis}
                            onClick={() => setScores((s) => ({ ...s, [c.key]: s[c.key] === n ? null : n }))}
                            className={`h-9 w-9 rounded-md border text-sm font-medium ${v === n ? "border-primary bg-primary text-white" : "border-border bg-surface hover:bg-slate-50"}`}
                            aria-pressed={v === n}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                      <div className="w-14 text-right text-sm tabular-nums text-muted">{contrib ?? "–"}</div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between border-t border-border bg-slate-50 px-4 py-2 text-sm">
                <span className="text-muted">Σ (nilai ÷ 5 × bobot)</span>
                <span className="font-semibold">{live == null ? "belum lengkap" : `${live.toFixed(2)} / 100`}</span>
              </div>
            </div>
            <Field label="Alasan penilaian skor" htmlFor="scoreReason" required hint="Wajib bila ada kriteria yang dinilai. Jelaskan dasar nilai tiap kriteria.">
              <Textarea id="scoreReason" name="scoreReason" defaultValue={review?.scoreReason ?? ""} maxLength={4000} />
            </Field>

            <div className="rounded-md border border-red-200 bg-red-50 p-4">
              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" name="criticalFlag" checked={critical} onChange={(e) => setCritical(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--danger)]" />
                <span>
                  <span className="font-semibold text-red-900">Override risiko kritis — tandai untuk penilaian segera</span>
                  <br />
                  <span className="text-red-800">Keselamatan, keamanan siber, kewajiban hukum, gangguan layanan esensial, atau kehilangan pendapatan material. Berlaku terlepas dari skor total.</span>
                </span>
              </label>
              {critical && (
                <div className="mt-3">
                  <Field label="Alasan penandaan" htmlFor="criticalReason" required>
                    <Textarea id="criticalReason" name="criticalReason" defaultValue={review?.criticalReason ?? ""} maxLength={4000} className="min-h-[72px]" />
                  </Field>
                </div>
              )}
            </div>
          </fieldset>
          <FormMessage message={state?.error} />
          <FormMessage message={state?.success} tone="success" />
          {!dis && <SubmitButton pendingText="Menyimpan…">Simpan review & skor</SubmitButton>}
        </CardBody>
      </Card>
    </form>
  );
}
