/**
 * Seed data.
 *   pnpm seed          -> hanya akun admin awal (idempoten)
 *   pnpm seed:demo     -> admin + data demo berlabel [DEMO] (idempoten; aman dihapus via pnpm seed:demo:clean)
 */
import { eq, like } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "../src/lib/db";
import { assessmentPeriods, departmentSubmissions, departments, digitalNeeds, needReviews, periodDepartments, users } from "../src/lib/db/schema";

const mode = process.argv[2] ?? "admin";
const DEMO = "[DEMO]";

async function upsertUser(u: { email: string; fullName: string; role: "admin" | "respondent" | "assessment_reviewer" | "management_viewer"; departmentId?: string | null; jobTitle?: string; password: string; mustChangePassword?: boolean }) {
  const existing = await db.query.users.findFirst({ where: eq(users.email, u.email) });
  if (existing) return existing;
  const [row] = await db
    .insert(users)
    .values({ email: u.email, fullName: u.fullName, role: u.role, departmentId: u.departmentId ?? null, jobTitle: u.jobTitle, passwordHash: await bcrypt.hash(u.password, 12), mustChangePassword: u.mustChangePassword ?? true })
    .returning();
  console.log(`+ user ${u.email} (${u.role})`);
  return row;
}

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@kinra.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "Admin12345";
  await upsertUser({ email, fullName: "Administrator TI", role: "admin", password, jobTitle: "Administrator TI" });
  console.log(`Admin siap: ${email} / ${password} (wajib ganti saat login pertama)`);
}

async function seedDemo() {
  const pw = "Demo12345";
  const deptDefs = [
    ["TI", "Teknologi Informasi dan Manajemen Risiko"],
    ["KEU", "Keuangan dan Akuntansi"],
    ["OPS", "Operasi dan Pemeliharaan Kawasan"],
    ["TEN", "Layanan Tenant"],
    ["UTL", "Utilitas"],
    ["SDM", "Sumber Daya Manusia dan Umum"],
  ];
  const deptMap = new Map<string, string>();
  for (const [code, name] of deptDefs) {
    const existing = await db.query.departments.findFirst({ where: eq(departments.code, code) });
    if (existing) {
      deptMap.set(code, existing.id);
      continue;
    }
    const [row] = await db.insert(departments).values({ code, name: `${DEMO} ${name}` }).returning();
    deptMap.set(code, row.id);
    console.log(`+ dept ${code}`);
  }
  await upsertUser({ email: "reviewer@kinra.local", fullName: `${DEMO} Reviewer TI`, role: "assessment_reviewer", password: pw, jobTitle: "Analis Sistem", mustChangePassword: false });
  await upsertUser({ email: "manajemen@kinra.local", fullName: `${DEMO} Direktur Operasi`, role: "management_viewer", password: pw, mustChangePassword: false });
  for (const [code] of deptDefs) {
    await upsertUser({ email: `kabag.${code.toLowerCase()}@kinra.local`, fullName: `${DEMO} Kepala Bagian ${code}`, role: "respondent", departmentId: deptMap.get(code), password: pw, jobTitle: `Kepala Bagian ${code}`, mustChangePassword: false });
  }
  let period = await db.query.assessmentPeriods.findFirst({ where: like(assessmentPeriods.name, `${DEMO}%`) });
  if (!period) {
    const now = new Date();
    [period] = await db
      .insert(assessmentPeriods)
      .values({ name: `${DEMO} Assessment Digitalisasi ${now.getFullYear()}`, description: "Data contoh untuk uji coba aplikasi.", startAt: now, dueAt: new Date(now.getTime() + 30 * 86400000), status: "active" })
      .returning();
    await db.insert(periodDepartments).values([...deptMap.values()].map((departmentId) => ({ periodId: period!.id, departmentId })));
    console.log("+ period aktif");
  }
  // Satu submission + 2 kebutuhan contoh untuk UTL
  const utl = deptMap.get("UTL")!;
  const existingSub = await db.query.departmentSubmissions.findFirst({ where: (t, { and, eq }) => and(eq(t.periodId, period!.id), eq(t.departmentId, utl)) });
  if (!existingSub) {
    const kabag = await db.query.users.findFirst({ where: eq(users.email, "kabag.utl@kinra.local") });
    const [sub] = await db
      .insert(departmentSubmissions)
      .values({
        periodId: period.id,
        departmentId: utl,
        respondentId: kabag?.id,
        status: "submitted",
        respondentName: kabag?.fullName,
        respondentJobTitle: "Kepala Bagian Utilitas",
        processOwnerName: "Kepala Bagian Utilitas",
        estimatedUsersRange: "6-20",
        mainProcesses: "Pembacaan meter air dan listrik tenant, penerbitan tagihan utilitas, penanganan gangguan.",
        mainServices: "Tagihan utilitas bulanan (penerima: tenant), laporan konsumsi (penerima: Keuangan).",
        currentSystems: "Spreadsheet Excel, email, aplikasi akuntansi untuk posting.",
        dominantWorkMode: "spreadsheet",
        attestation: true,
        submittedAt: new Date(),
      })
      .returning();
    const year = new Date().getFullYear();
    const [n1] = await db
      .insert(digitalNeeds)
      .values({
        submissionId: sub.id,
        needCode: `DNA-${year}-0001`,
        title: `${DEMO} Penagihan utilitas tenant masih manual`,
        businessProcess: "Meter-to-cash utilitas",
        processOwner: "Kepala Bagian Utilitas",
        affectedParties: ["internal", "tenant"],
        frequency: "monthly",
        estimatedVolume: "±300 tagihan/bulan",
        problemDescription: "Pembacaan meter dicatat di kertas lalu diketik ulang ke Excel; sering salah ketik dan tagihan terlambat terbit.",
        currentProcess: "Petugas membaca meter, mencatat manual, diketik ke Excel, diverifikasi, lalu dibuat invoice di aplikasi akuntansi.",
        impacts: ["time", "revenue", "data_quality", "tenant_service"],
        problemFrequency: "monthly",
        consequenceIfUnresolved: "Keterlambatan penagihan dan komplain tenant meningkat; potensi kehilangan pendapatan.",
        evidenceAvailable: "yes",
        desiredOutcome: "Tagihan terbit H+2 setelah pembacaan meter dengan kesalahan < 1%.",
        proposedSolution: ["mobile", "integration"],
        existingSystemRelation: "yes",
        existingSystemDetail: "Aplikasi akuntansi untuk posting invoice.",
        dataRequired: "Data meter, master tenant, tarif.",
        integrationRequired: "yes",
        integrationDetail: "Bagian Keuangan (aplikasi akuntansi).",
        sensitiveDataFlag: "no",
        mobileFieldNeed: "yes",
        domainTags: ["utility", "tenant"],
        expectedBenefits: ["reduce_time", "increase_revenue", "data_quality"],
        baseline: "Tagihan terbit H+10, kesalahan ±5%/bulan",
        target: "H+2, kesalahan < 1%",
        respondentUrgency: "high",
        urgencyReason: "Komplain tenant meningkat 3 bulan terakhir.",
        dataReadiness: "partial",
        processReadiness: "defined",
        ownerReadiness: "ready",
        dependencies: "Bagian Keuangan, vendor aplikasi akuntansi",
        status: "submitted",
        submittedAt: new Date(),
        lastSubmittedAt: new Date(),
      })
      .returning();
    await db.insert(digitalNeeds).values({
      submissionId: sub.id,
      needCode: `DNA-${year}-0002`,
      title: `${DEMO} Laporan gangguan utilitas belum terpusat`,
      businessProcess: "Penanganan gangguan utilitas",
      processOwner: "Supervisor Operasi Utilitas",
      affectedParties: ["internal", "tenant"],
      frequency: "daily",
      problemDescription: "Laporan gangguan masuk via telepon/WA; tidak ada log terpusat sehingga SLA sulit dipantau.",
      currentProcess: "Petugas piket mencatat di buku, meneruskan ke teknisi via WA.",
      impacts: ["tenant_service", "control_audit"],
      problemFrequency: "daily",
      consequenceIfUnresolved: "Tidak ada bukti penanganan; sulit evaluasi kinerja.",
      evidenceAvailable: "unavailable",
      desiredOutcome: "Semua gangguan tercatat dengan waktu respons dan penyelesaian.",
      proposedSolution: ["unknown"],
      respondentUrgency: "medium",
      urgencyReason: "Perlu dasar evaluasi SLA tahun depan.",
      dataReadiness: "not_ready",
      processReadiness: "partial",
      ownerReadiness: "limited",
      status: "submitted",
      submittedAt: new Date(),
      lastSubmittedAt: new Date(),
    });
    const reviewer = await db.query.users.findFirst({ where: eq(users.email, "reviewer@kinra.local") });
    await db.insert(needReviews).values({
      needId: n1.id,
      reviewerId: reviewer?.id,
      completeness: "complete",
      rootCauseStatus: "yes",
      duplicateStatus: "no",
      solutionCategory: "integration",
      strategicAlignment: "clear",
      delayRisk: "high",
      delayRiskReason: "Pendapatan utilitas tertunda setiap bulan.",
      followUpRecommendation: "interview",
      reviewerNotes: "Perlu verifikasi volume dan opsi integrasi dengan aplikasi akuntansi.",
      scoreImpact: 4,
      scoreRisk: 3,
      scoreUrgency: 4,
      scoreStrategy: 4,
      scoreReadiness: 3,
      scoreReuse: 3,
      scoreReason: "Dampak langsung ke pendapatan; kesiapan data sebagian.",
      weightedScore: ((4 / 5) * 30 + (3 / 5) * 25 + (4 / 5) * 15 + (4 / 5) * 15 + (3 / 5) * 10 + (3 / 5) * 5).toFixed(2),
      reviewedAt: new Date(),
    });
    await db.update(digitalNeeds).set({ status: "under_review" }).where(eq(digitalNeeds.id, n1.id));
    console.log("+ submission UTL + 2 kebutuhan + 1 review");
  }
  console.log(`Demo siap. Akun demo (sandi ${pw}): reviewer@kinra.local, manajemen@kinra.local, kabag.<kode>@kinra.local`);
}

async function cleanDemo() {
  // Hapus hanya entitas berlabel [DEMO] — urutan menghormati FK.
  const demoPeriods = await db.query.assessmentPeriods.findMany({ where: like(assessmentPeriods.name, `${DEMO}%`) });
  for (const p of demoPeriods) {
    const subs = await db.query.departmentSubmissions.findMany({ where: eq(departmentSubmissions.periodId, p.id) });
    for (const s of subs) {
      const needs = await db.query.digitalNeeds.findMany({ where: eq(digitalNeeds.submissionId, s.id) });
      for (const n of needs) {
        await db.execute(`delete from need_reviews where need_id = '${n.id}'`);
        await db.execute(`delete from clarification_threads where need_id = '${n.id}'`);
        await db.execute(`delete from interviews where need_id = '${n.id}'`);
        await db.execute(`delete from need_attachments where need_id = '${n.id}'`);
        await db.delete(digitalNeeds).where(eq(digitalNeeds.id, n.id));
      }
      await db.delete(departmentSubmissions).where(eq(departmentSubmissions.id, s.id));
    }
    await db.delete(assessmentPeriods).where(eq(assessmentPeriods.id, p.id));
  }
  await db.delete(users).where(like(users.fullName, `${DEMO}%`));
  await db.delete(departments).where(like(departments.name, `${DEMO}%`));
  console.log("Data demo dihapus.");
}

(async () => {
  if (mode === "admin") await seedAdmin();
  else if (mode === "demo") {
    await seedAdmin();
    await seedDemo();
  } else if (mode === "demo:clean") await cleanDemo();
  else throw new Error(`Mode tidak dikenal: ${mode}`);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
