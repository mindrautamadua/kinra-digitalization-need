"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLinks, type NavItem } from "./nav-links";
import { SIDEBAR_COOKIE } from "./sidebar-cookie";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function Sidebar({
  items,
  user,
  defaultCollapsed,
}: {
  items: NavItem[];
  user: { fullName: string; roleLabel: string; departmentName?: string | null };
  defaultCollapsed: boolean;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    // Cookie dibaca server agar lebar sidebar sudah benar saat render pertama (tanpa kedip).
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "collapsed" : "expanded"}; path=/; max-age=31536000; samesite=lax`;
  }

  const ToggleIcon = collapsed ? ChevronsRight : ChevronsLeft;

  return (
    <aside
      className={cn(
        "no-print sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200 md:flex",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? "Bentangkan sidebar" : "Ciutkan sidebar"}
        aria-expanded={!collapsed}
        title={collapsed ? "Bentangkan sidebar" : "Ciutkan sidebar"}
        className="absolute top-5 -right-3 z-20 inline-flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface text-muted shadow-sm hover:bg-slate-100 hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
      >
        <ToggleIcon className="h-3.5 w-3.5" aria-hidden />
      </button>

      <div className={cn("border-b border-border py-4", collapsed ? "px-2 text-center" : "px-5")}>
        <Link href="/" className="block" title={collapsed ? "KINRA Digitalization Needs Assessment" : undefined}>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">KINRA</p>
          {!collapsed && <p className="text-sm font-semibold leading-tight">Digitalization Needs Assessment</p>}
        </Link>
      </div>

      <nav className={cn("flex-1 overflow-x-hidden overflow-y-auto py-4", collapsed ? "px-2" : "px-3")}>
        <NavLinks items={items} collapsed={collapsed} />
      </nav>

      <div className={cn("border-t border-border py-4 text-xs text-muted", collapsed ? "px-2" : "px-5")}>
        {collapsed ? (
          <div
            className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-primary"
            title={`${user.fullName} · ${user.roleLabel}`}
          >
            {initials(user.fullName)}
          </div>
        ) : (
          <>
            <p className="font-medium text-foreground">{user.fullName}</p>
            <p>{user.roleLabel}</p>
            {user.departmentName && <p className="truncate">{user.departmentName}</p>}
          </>
        )}
      </div>
    </aside>
  );
}
