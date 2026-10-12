import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border bg-surface">
      <table className={cn("w-full text-sm", className)} {...props} />
    </div>
  );
}
export function THead({ children }: { children: React.ReactNode }) {
  return <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-muted">{children}</thead>;
}
export function TH({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("px-3 py-2.5 whitespace-nowrap", className)} {...props} />;
}
export function TD({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-3 py-2.5 align-top border-t border-border", className)} {...props} />;
}

export function Pagination({ page, pageSize, total, makeHref }: { page: number; pageSize: number; total: number; makeHref: (p: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const cls = "rounded-md border border-border bg-surface px-3 py-1.5 text-sm hover:bg-slate-50";
  return (
    <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Paginasi">
      <span className="text-muted">
        Halaman {page} dari {pages} · {total} rekaman
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link className={cls} href={makeHref(page - 1)}>
            Sebelumnya
          </Link>
        )}
        {page < pages && (
          <Link className={cls} href={makeHref(page + 1)}>
            Berikutnya
          </Link>
        )}
      </div>
    </nav>
  );
}
