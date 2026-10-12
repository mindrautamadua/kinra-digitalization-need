"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, List, Mic, Calendar, Building2, Users, Settings, ShieldCheck, ClipboardList } from "lucide-react";

const icons = {
  dashboard: LayoutDashboard,
  list: List,
  mic: Mic,
  calendar: Calendar,
  building: Building2,
  users: Users,
  settings: Settings,
  shield: ShieldCheck,
  clipboard: ClipboardList,
};

export type NavItem = { href: string; label: string; icon: keyof typeof icons };

export function NavLinks({ items, compact }: { items: NavItem[]; compact?: boolean }) {
  const pathname = usePathname();
  return (
    <ul className={cn(compact ? "flex gap-1" : "space-y-1")}>
      {items.map((it) => {
        const Icon = icons[it.icon];
        const active = pathname === it.href || pathname.startsWith(it.href + "/");
        return (
          <li key={it.href}>
            <Link
              href={it.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap",
                active ? "bg-accent text-primary" : "text-slate-700 hover:bg-slate-100",
                compact && "px-2.5 py-1.5 text-xs",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className={cn("shrink-0", compact ? "h-3.5 w-3.5" : "h-4 w-4")} aria-hidden />
              {it.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
