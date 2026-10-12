import { cn } from "@/lib/utils";
import { NEED_STATUS_LABELS, NEED_STATUS_TONE } from "@/lib/enums";

const tones: Record<string, string> = {
  gray: "bg-slate-100 text-slate-700 border-slate-200",
  blue: "bg-blue-50 text-blue-800 border-blue-200",
  indigo: "bg-indigo-50 text-indigo-800 border-indigo-200",
  amber: "bg-amber-50 text-amber-800 border-amber-200",
  violet: "bg-violet-50 text-violet-800 border-violet-200",
  teal: "bg-teal-50 text-teal-800 border-teal-200",
  green: "bg-green-50 text-green-800 border-green-200",
  orange: "bg-orange-50 text-orange-800 border-orange-200",
  red: "bg-red-50 text-red-800 border-red-200",
};

export function Badge({ children, tone = "gray", className }: { children: React.ReactNode; tone?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap", tones[tone] ?? tones.gray, className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={NEED_STATUS_TONE[status] ?? "gray"}>{NEED_STATUS_LABELS[status] ?? status}</Badge>;
}

const urgencyTone: Record<string, string> = { low: "gray", medium: "blue", high: "orange", critical: "red" };
const urgencyLabel: Record<string, string> = { low: "Rendah", medium: "Sedang", high: "Tinggi", critical: "Kritis" };

export function UrgencyBadge({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-muted">-</span>;
  return <Badge tone={urgencyTone[value] ?? "gray"}>{urgencyLabel[value] ?? value}</Badge>;
}
