import { Card, CardBody, CardHeader } from "./card";

export function BarList({ title, description, rows, labelOf, max }: { title: string; description?: string; rows: { key: string; n: number }[]; labelOf?: (k: string) => string; max?: number }) {
  const top = max ? rows.slice(0, max) : rows;
  const biggest = Math.max(1, ...top.map((r) => Number(r.n)));
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardBody>
        {top.length === 0 ? (
          <p className="text-sm text-muted">Belum ada data.</p>
        ) : (
          <ul className="space-y-2">
            {top.map((r) => {
              const n = Number(r.n);
              return (
                <li key={r.key} className="text-sm">
                  <div className="mb-0.5 flex items-center justify-between gap-2">
                    <span className="truncate">{labelOf ? labelOf(r.key) : r.key}</span>
                    <span className="tabular-nums text-muted">{n}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded bg-slate-100">
                    <div className="h-full rounded bg-primary" style={{ width: `${Math.max(2, (n / biggest) * 100)}%` }} aria-hidden />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
