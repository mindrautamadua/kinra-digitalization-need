import { Card, CardBody, CardHeader, DescriptionList } from "@/components/ui/card";
import { UrgencyBadge } from "@/components/ui/badge";
import {
  AFFECTED_PARTIES, BENEFITS, DATA_READINESS, DOMAIN_TAGS, FREQUENCY, IMPACTS, OWNER_READINESS, PROBLEM_FREQUENCY,
  PROCESS_READINESS, PROPOSED_SOLUTION, YES_NO_NA, YES_NO_UNKNOWN, labelOf, labelsOf,
} from "@/lib/enums";
import type { DigitalNeed } from "@/lib/db/schema";

/** Tampilan baca-saja seluruh isian Form B. */
export function NeedDetail({ need }: { need: DigitalNeed }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="1 · Identitas dan konteks" />
        <CardBody>
          <DescriptionList
            items={[
              { label: "Proses bisnis terkait", value: need.businessProcess },
              { label: "Pemilik proses", value: need.processOwner },
              { label: "Pihak terdampak", value: labelsOf(AFFECTED_PARTIES, need.affectedParties) },
              { label: "Frekuensi proses", value: labelOf(FREQUENCY, need.frequency) },
              { label: "Perkiraan volume", value: need.estimatedVolume },
            ]}
          />
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="2 · Masalah saat ini" />
        <CardBody>
          <DescriptionList
            columns={1}
            items={[
              { label: "Masalah yang terjadi", value: need.problemDescription },
              { label: "Proses saat ini", value: need.currentProcess },
            ]}
          />
          <div className="mt-4">
            <DescriptionList
              items={[
                { label: "Dampak masalah", value: labelsOf(IMPACTS, need.impacts) },
                { label: "Frekuensi masalah", value: labelOf(PROBLEM_FREQUENCY, need.problemFrequency) },
                ...(need.consequenceIfUnresolved ? [{ label: "Dampak jika tidak ditangani (isian lama)", value: need.consequenceIfUnresolved }] : []),
                { label: "Bukti pendukung", value: labelOf(YES_NO_NA, need.evidenceAvailable) },
              ]}
            />
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="3 · Kebutuhan dan solusi" />
        <CardBody>
          <DescriptionList
            items={[
              { label: "Hasil yang ingin dicapai", value: need.desiredOutcome },
              { label: "Usulan solusi", value: labelsOf(PROPOSED_SOLUTION, need.proposedSolution) },
              { label: "Terkait sistem yang ada", value: `${labelOf(YES_NO_UNKNOWN, need.existingSystemRelation)}${need.existingSystemDetail ? ` — ${need.existingSystemDetail}` : ""}` },
              { label: "Data yang diperlukan / dihasilkan", value: need.dataRequired },
              { label: "Pertukaran data lintas Bagian / sistem", value: `${labelOf(YES_NO_UNKNOWN, need.integrationRequired)}${need.integrationDetail ? ` — ${need.integrationDetail}` : ""}` },
              { label: "Data sensitif / kritis", value: `${labelOf(YES_NO_UNKNOWN, need.sensitiveDataFlag)}${need.sensitiveDataDetail ? ` — ${need.sensitiveDataDetail}` : ""}` },
              { label: "Akses lapangan / mobile", value: labelOf(YES_NO_UNKNOWN, need.mobileFieldNeed) },
              { label: "Domain KINRA (diisi reviewer)", value: labelsOf(DOMAIN_TAGS, need.domainTags) },
            ]}
          />
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="4 · Manfaat, urgensi, dan kesiapan" />
        <CardBody>
          <DescriptionList
            items={[
              // Manfaat tidak lagi ditanyakan; tetap ditampilkan untuk data lama.
              ...(need.expectedBenefits.length > 0 ? [{ label: "Manfaat yang diharapkan", value: labelsOf(BENEFITS, need.expectedBenefits) }] : []),
              { label: "Urgensi menurut Bagian", value: <UrgencyBadge value={need.respondentUrgency} /> },
              { label: "Ukuran keberhasilan", value: formatMetric(need) },
              { label: "Keterangan kondisi saat ini", value: need.baseline },
              ...(need.target ? [{ label: "Target (isian lama)", value: need.target }] : []),
              { label: "Alasan urgensi & akibat bila tidak ditangani", value: need.urgencyReason },
              { label: "Tenggat eksternal", value: need.externalDeadline },
              { label: "Kesiapan data", value: labelOf(DATA_READINESS, need.dataReadiness) },
              { label: "Kesiapan proses / SOP", value: labelOf(PROCESS_READINESS, need.processReadiness) },
              { label: "Ketersediaan pemilik proses", value: labelOf(OWNER_READINESS, need.ownerReadiness) },
              { label: "Ketergantungan", value: need.dependencies },
              { label: "Perkiraan biaya", value: need.estimatedCost },
              { label: "Catatan tambahan", value: need.additionalNotes },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  );
}

function formatMetric(n: { metricName: string | null; metricUnit: string | null; baselineValue: number | null; targetValue: number | null }) {
  if (!n.metricName && n.baselineValue == null && n.targetValue == null) return null;
  const num = (v: number | null) => (v == null ? "?" : v.toLocaleString("id-ID"));
  const unit = n.metricUnit ? ` ${n.metricUnit}` : "";
  return `${n.metricName ?? "Ukuran belum disebutkan"}: ${num(n.baselineValue)}${unit} saat ini → target ${num(n.targetValue)}${unit}`;
}
