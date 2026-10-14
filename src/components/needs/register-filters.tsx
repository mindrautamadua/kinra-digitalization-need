import { Input, Select } from "@/components/ui/input";
import { Button, LinkButton } from "@/components/ui/button";
import { IMPACTS, NEED_STATUS_LABELS, SOLUTION_CATEGORY, URGENCY } from "@/lib/enums";
import type { RegisterFilters } from "@/lib/queries/needs";

type Opt = { id: string; name: string };

export function RegisterFilterForm({
  f,
  periods,
  departments,
  basePath,
  showExport,
  exportQuery,
}: {
  f: RegisterFilters;
  periods: Opt[];
  departments: Opt[];
  basePath: string;
  showExport: boolean;
  exportQuery: string;
}) {
  const sel = "h-9 text-xs";
  return (
    <form method="get" action={basePath} className="rounded-lg border border-border bg-surface p-3">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
        <Input name="q" defaultValue={f.q ?? ""} placeholder="Cari kode / judul / masalah…" className={`${sel} col-span-2`} aria-label="Pencarian" />
        <Select name="period" defaultValue={f.period ?? ""} className={sel} aria-label="Periode">
          <option value="">Semua periode</option>
          {periods.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        {departments.length > 0 && (
          <Select name="department" defaultValue={f.department ?? ""} className={sel} aria-label="Bagian">
            <option value="">Semua Bagian</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        )}
        <Select name="status" defaultValue={f.status ?? ""} className={sel} aria-label="Status">
          <option value="">Semua status</option>
          {Object.entries(NEED_STATUS_LABELS)
            .filter(([k]) => k !== "archived")
            .map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
        </Select>
        <Select name="urgency" defaultValue={f.urgency ?? ""} className={sel} aria-label="Urgensi">
          <option value="">Semua urgensi</option>
          {URGENCY.map((o) => (
            <option key={o.value} value={o.value}>
              Urgensi: {o.label}
            </option>
          ))}
        </Select>
        <Select name="impact" defaultValue={f.impact ?? ""} className={sel} aria-label="Kategori dampak">
          <option value="">Semua dampak</option>
          {IMPACTS.map((o) => (
            <option key={o.value} value={o.value}>
              Dampak: {o.label}
            </option>
          ))}
        </Select>
        <Select name="solution" defaultValue={f.solution ?? ""} className={sel} aria-label="Kategori solusi">
          <option value="">Semua kategori solusi</option>
          {SOLUTION_CATEGORY.map((o) => (
            <option key={o.value} value={o.value}>
              Solusi: {o.label}
            </option>
          ))}
        </Select>
        <Select name="interview" defaultValue={f.interview ?? ""} className={sel} aria-label="Kebutuhan wawancara">
          <option value="">Wawancara: semua</option>
          <option value="yes">Perlu / ada wawancara</option>
          <option value="no">Tanpa wawancara</option>
        </Select>
        <Select name="priority" defaultValue={f.priority ?? ""} className={sel} aria-label="Prioritas reviewer">
          <option value="">Prioritas: semua</option>
          <option value="very_high">Sangat tinggi (≥80)</option>
          <option value="high">Tinggi (65–79)</option>
          <option value="medium">Menengah (50–64)</option>
          <option value="low">Rendah (&lt;50)</option>
          <option value="unscored">Belum dinilai</option>
        </Select>
        <Select name="sort" defaultValue={f.sort ?? ""} className={sel} aria-label="Urutan">
          <option value="">Urut: terbaru diperbarui</option>
          <option value="score">Urut: skor tertinggi</option>
          <option value="submitted">Urut: tanggal submit</option>
          <option value="code">Urut: kode</option>
        </Select>
        <label className="flex h-9 items-center gap-2 rounded-md border border-border px-2 text-xs">
          <input type="checkbox" name="critical" value="1" defaultChecked={f.critical === "1"} className="h-3.5 w-3.5 accent-[var(--primary)]" /> Risiko kritis
        </label>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button type="submit" size="sm">
          Terapkan filter
        </Button>
        <LinkButton href={basePath} size="sm" variant="ghost">
          Reset
        </LinkButton>
        {showExport && (
          <span className="ml-auto flex gap-2">
            <a className="text-xs font-medium text-primary hover:underline" href={`/api/export/needs.pdf?${exportQuery}`} target="_blank" rel="noopener">
              Cetak laporan per Bagian (PDF)
            </a>
            <a className="text-xs font-medium text-primary hover:underline" href={`/api/export/needs.xlsx?${exportQuery}`}>
              Ekspor Excel (.xlsx)
            </a>
            <a className="text-xs font-medium text-primary hover:underline" href={`/api/export/needs.csv?${exportQuery}`}>
              Ekspor CSV
            </a>
          </span>
        )}
      </div>
    </form>
  );
}

export function parseFilters(sp: Record<string, string | string[] | undefined>): RegisterFilters {
  const g = (k: string) => {
    const v = sp[k];
    const s = Array.isArray(v) ? v[0] : v;
    return s ? String(s).slice(0, 200) : undefined;
  };
  const page = Number(g("page") ?? 1);
  return {
    q: g("q"),
    period: g("period"),
    department: g("department"),
    status: g("status"),
    urgency: g("urgency"),
    impact: g("impact"),
    solution: g("solution"),
    interview: g("interview"),
    priority: g("priority"),
    critical: g("critical"),
    sort: g("sort"),
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

export function filtersToQuery(f: RegisterFilters, overrides: Partial<RegisterFilters> = {}) {
  const merged = { ...f, ...overrides };
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v == null || v === "" || k === "departmentIdRestrict" || k === "includeDrafts" || k === "pageSize") continue;
    if (k === "page" && Number(v) <= 1) continue;
    p.set(k, String(v));
  }
  return p.toString();
}
