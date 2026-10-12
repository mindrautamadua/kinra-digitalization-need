import * as React from "react";
import { cn } from "@/lib/utils";

// Blok placeholder dasar. Dekoratif; pengumuman "memuat" ditangani oleh <SkeletonPage>.
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cn("rounded-md bg-slate-200/80 motion-safe:animate-pulse", className)} {...props} />;
}

// Pembungkus halaman: satu region status untuk pembaca layar, isi visual disembunyikan.
export function SkeletonPage({ label = "Memuat halaman…", children }: { label?: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export function SkeletonPageHeader({ actions = 0, description = true }: { actions?: number; description?: boolean }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        {description && <Skeleton className="h-4 w-80 max-w-full" />}
      </div>
      {actions > 0 && (
        <div className="flex gap-2">
          {Array.from({ length: actions }, (_, i) => (
            <Skeleton key={i} className="h-9 w-28" />
          ))}
        </div>
      )}
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="rounded-lg border border-border bg-surface px-5 py-4 shadow-sm">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-2 h-7 w-14" />
      <Skeleton className="mt-1.5 h-3 w-24" />
    </div>
  );
}

export function SkeletonCard({ className, lines = 4, header = true }: { className?: string; lines?: number; header?: boolean }) {
  return (
    <div className={cn("rounded-lg border border-border bg-surface shadow-sm", className)}>
      {header && (
        <div className="border-b border-border px-5 py-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-1.5 h-3.5 w-64 max-w-full" />
        </div>
      )}
      <div className="space-y-3 px-5 py-4">
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton key={i} className={cn("h-4", i % 3 === 2 ? "w-2/3" : i % 3 === 1 ? "w-5/6" : "w-full")} />
        ))}
      </div>
    </div>
  );
}

// Lebar kolom bervariasi supaya tidak terlihat seperti grid seragam.
const CELL_WIDTHS = ["w-16", "w-40", "w-24", "w-28", "w-20", "w-32", "w-14", "w-24", "w-16"];

export function SkeletonTable({ columns = 6, rows = 8 }: { columns?: number; rows?: number }) {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex gap-6 bg-slate-50 px-3 py-3">
        {Array.from({ length: columns }, (_, c) => (
          <Skeleton key={c} className={cn("h-3 shrink-0", CELL_WIDTHS[c % CELL_WIDTHS.length])} />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex gap-6 border-t border-border px-3 py-3.5">
          {Array.from({ length: columns }, (_, c) => (
            <Skeleton key={c} className={cn("h-4 shrink-0", CELL_WIDTHS[(c + r) % CELL_WIDTHS.length])} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonFilters({ fields = 4 }: { fields?: number }) {
  return (
    <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-4">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-10 w-44" />
        </div>
      ))}
      <Skeleton className="h-10 w-24" />
    </div>
  );
}

export function SkeletonForm({ fields = 6, columns = 2, className }: { fields?: number; columns?: 1 | 2; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-border bg-surface shadow-sm", className)}>
      <div className={cn("grid gap-5 px-5 py-5", columns === 2 && "sm:grid-cols-2")}>
        {Array.from({ length: fields }, (_, i) => (
          <div key={i} className={cn("space-y-1.5", columns === 2 && i % 4 === 3 && "sm:col-span-2")}>
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className={i % 4 === 3 ? "h-24 w-full" : "h-10 w-full"} />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
  );
}

// Pola halaman master: daftar kartu (kolom besar) + form tambah di samping.
export function SkeletonCardListWithSideForm({ items = 4 }: { items?: number }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        {Array.from({ length: items }, (_, i) => (
          <SkeletonCard key={i} lines={2} />
        ))}
      </div>
      <SkeletonForm fields={4} columns={1} className="h-fit" />
    </div>
  );
}
