import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { PageHeader, EmptyState } from "@/components/ui/card";
import { markAllReadAction, markReadAction } from "@/actions/notifications";
import { SubmitButton } from "@/components/ui/form";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const metadata = { title: "Notifikasi" };

export default async function NotificationsPage() {
  const me = await requireUser();
  const rows = await db.query.notifications.findMany({ where: eq(notifications.userId, me.id), orderBy: [desc(notifications.createdAt)], limit: 100 });
  return (
    <>
      <PageHeader
        title="Notifikasi"
        description="Status kebutuhan, permintaan klarifikasi, dan tenggat."
        actions={
          <form action={markAllReadAction}>
            <SubmitButton variant="outline" size="sm">
              Tandai semua dibaca
            </SubmitButton>
          </form>
        }
      />
      {rows.length === 0 ? (
        <EmptyState title="Belum ada notifikasi" />
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {rows.map((n) => (
            <li key={n.id} className={cn("flex items-start gap-3 px-4 py-3", !n.readAt && "bg-accent/40")}>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm", !n.readAt && "font-semibold")}>{n.title}</p>
                {n.body && <p className="text-sm text-muted">{n.body}</p>}
                <p className="mt-0.5 text-xs text-muted">{formatDate(n.createdAt, true)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {n.link && (
                  <Link href={n.link} className="text-sm text-primary hover:underline">
                    Buka
                  </Link>
                )}
                {!n.readAt && (
                  <form action={markReadAction.bind(null, n.id)}>
                    <button type="submit" className="text-xs text-muted hover:underline">
                      Tandai dibaca
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
