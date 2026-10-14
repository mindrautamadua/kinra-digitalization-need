import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import type { DepartmentUrgencyRow } from "@/lib/queries/dashboard";

/**
 * Urgensi bersifat ordinal, jadi memakai satu hue (biru) terang→gelap; tervalidasi dengan dataviz validate_palette --ordinal.
 * Urutan segmen dari kiri: paling mendesak dulu, agar "Kritis" selalu menempel ke garis dasar dan mudah dibandingkan antar Bagian.
 */
const SEGMENTS = [
  { key: "critical", label: "Kritis", color: "#0d366b" },
  { key: "high", label: "Tinggi", color: "#1c5cab" },
  { key: "medium", label: "Sedang", color: "#3987e5" },
  { key: "low", label: "Rendah", color: "#86b6ef" },
  { key: "unset", label: "Belum diisi", color: "#cbd5e1" },
] as const;

export function DepartmentUrgencyChart({
  rows,
  hrefFor,
  className,
}: {
  rows: DepartmentUrgencyRow[];
  hrefFor: (departmentId: string, urgency?: string) => string;
  className?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.total));
  const legend = SEGMENTS.filter((s) => s.key !== "unset" || rows.some((r) => r.byUrgency.unset));
  const empty = rows.filter((r) => r.total === 0).length;

  return (
    <Card className={className}>
      <CardHeader
        title="Kebutuhan per Bagian"
        description={
          empty > 0
            ? `Dirinci menurut urgensi dari Bagian. ${empty} Bagian belum memiliki kebutuhan terkirim.`
            : "Dirinci menurut urgensi dari Bagian."
        }
      />
      <CardBody>
        {rows.length === 0 ? (
          <p className="text-sm text-muted">Belum ada Bagian yang ditetapkan.</p>
        ) : (
          <>
            <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-label="Legenda urgensi">
              {legend.map((s) => (
                <li key={s.key} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} aria-hidden />
                  {s.label}
                </li>
              ))}
            </ul>

            <ul className="space-y-1">
              {rows.map((r) => (
                <li key={r.id} className="grid grid-cols-[1fr_2.5rem] items-center gap-x-3 text-sm sm:grid-cols-[minmax(0,16rem)_1fr_2.5rem]">
                  <Link href={hrefFor(r.id)} className={`col-span-2 truncate hover:underline sm:col-span-1 ${r.total === 0 ? "text-muted" : ""}`} title={r.name}>
                    {r.name}
                  </Link>
                  {r.total === 0 ? (
                    <span className="truncate text-xs text-muted">Belum ada kebutuhan terkirim</span>
                  ) : (
                    <div className="flex h-6 items-center">
                      <div className="flex h-3.5 gap-[2px]" style={{ width: `${(r.total / max) * 100}%` }}>
                        {SEGMENTS.filter((s) => r.byUrgency[s.key]).map((s, i, arr) => {
                          const n = r.byUrgency[s.key];
                          const text = `${r.name} · ${s.label}: ${n} dari ${r.total} kebutuhan`;
                          return (
                            <Link
                              key={s.key}
                              href={hrefFor(r.id, s.key === "unset" ? undefined : s.key)}
                              aria-label={text}
                              className={`group relative h-full min-w-[3px] outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${i === arr.length - 1 ? "rounded-r" : ""}`}
                              style={{ flex: `${n} 1 0`, background: s.color }}
                            >
                              {/* Area sentuh lebih tinggi dari batang. */}
                              <span className="absolute inset-x-0 -inset-y-1.5" aria-hidden />
                              <span
                                role="tooltip"
                                className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-surface px-2 py-1 text-xs text-foreground shadow-md group-hover:block group-focus-visible:block"
                              >
                                <span className="font-medium">{s.label}</span>: {n}
                                <span className="text-muted"> / {r.total}</span>
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <span className={`text-right tabular-nums ${r.total === 0 ? "text-muted" : "font-medium"}`}>{r.total}</span>
                </li>
              ))}
            </ul>

            <details className="mt-4 text-sm">
              <summary className="cursor-pointer text-xs font-medium text-primary">Tampilkan sebagai tabel</summary>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-left text-muted">
                      <th className="py-1 pr-2 font-medium">Bagian</th>
                      {legend.map((s) => (
                        <th key={s.key} className="px-2 py-1 text-right font-medium">
                          {s.label}
                        </th>
                      ))}
                      <th className="py-1 pl-2 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-b border-border last:border-0">
                        <td className="py-1 pr-2">{r.name}</td>
                        {legend.map((s) => (
                          <td key={s.key} className="px-2 py-1 text-right tabular-nums">
                            {r.byUrgency[s.key] ?? 0}
                          </td>
                        ))}
                        <td className="py-1 pl-2 text-right font-medium tabular-nums">{r.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </>
        )}
      </CardBody>
    </Card>
  );
}
