import Link from "next/link";
import { and, count, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import type { SessionUser } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/enums";
import { NavLinks, type NavItem } from "./nav-links";
import { logoutAction } from "@/actions/auth";
import { Bell, LogOut } from "lucide-react";

function navFor(u: SessionUser): NavItem[] {
  switch (u.role) {
    case "admin":
      return [
        { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
        { href: "/needs", label: "Register Kebutuhan", icon: "list" },
        { href: "/interviews", label: "Wawancara", icon: "mic" },
        { href: "/admin/periods", label: "Periode Assessment", icon: "calendar" },
        { href: "/admin/departments", label: "Master Bagian", icon: "building" },
        { href: "/admin/users", label: "Pengguna", icon: "users" },
        { href: "/admin/settings", label: "Pengaturan", icon: "settings" },
        { href: "/admin/audit", label: "Audit Trail", icon: "shield" },
      ];
    case "assessment_reviewer":
      return [
        { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
        { href: "/needs", label: "Register Kebutuhan", icon: "list" },
        { href: "/interviews", label: "Wawancara", icon: "mic" },
      ];
    case "management_viewer":
      return [
        { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
        { href: "/needs", label: "Register Kebutuhan", icon: "list" },
      ];
    default:
      return [{ href: "/respond", label: "Assessment Bagian Saya", icon: "clipboard" }];
  }
}

export async function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const [{ n: unread }] = await db
    .select({ n: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)));
  const nav = navFor(user);

  return (
    <div className="flex min-h-screen">
      <aside className="no-print hidden w-64 shrink-0 flex-col border-r border-border bg-surface md:flex">
        <div className="border-b border-border px-5 py-4">
          <Link href="/" className="block">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">KINRA</p>
            <p className="text-sm font-semibold leading-tight">Digitalization Needs Assessment</p>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <NavLinks items={nav} />
        </nav>
        <div className="border-t border-border px-5 py-4 text-xs text-muted">
          <p className="font-medium text-foreground">{user.fullName}</p>
          <p>{ROLE_LABELS[user.role]}</p>
          {user.departmentName && <p className="truncate">{user.departmentName}</p>}
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-10 flex h-14 items-center justify-between gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur sm:px-6">
          <div className="md:hidden">
            <Link href="/" className="text-sm font-semibold text-primary">
              KINRA DNA
            </Link>
          </div>
          <div className="hidden text-sm text-muted md:block">PT Kawasan Industri Nusantara · Aplikasi internal</div>
          <div className="flex items-center gap-2">
            <Link
              href="/notifications"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-slate-100"
              aria-label={`Notifikasi, ${unread} belum dibaca`}
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </Link>
            <Link href="/account/password" className="hidden rounded-md px-2 py-1.5 text-sm hover:bg-slate-100 sm:inline-flex">
              Akun
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-sm hover:bg-slate-100" aria-label="Keluar">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </form>
          </div>
        </header>
        <nav className="no-print flex gap-1 overflow-x-auto border-b border-border bg-surface px-2 py-1.5 md:hidden">
          <NavLinks items={nav} compact />
        </nav>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
