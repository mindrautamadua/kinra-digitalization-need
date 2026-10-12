import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { needAttachments } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { readStoredFile } from "@/lib/storage";
import { logAudit } from "@/lib/audit";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

/** Unduh lampiran privat. Hak akses diperiksa server-side; tidak ada URL publik. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await ctx.params;
  const att = await db.query.needAttachments.findFirst({ where: eq(needAttachments.id, id), with: { need: { with: { submission: true } } } });
  if (!att || att.archivedAt) return new NextResponse("Not found", { status: 404 });
  let allowed = false;
  if (me.role === "admin" || me.role === "assessment_reviewer") allowed = true;
  else if (me.role === "respondent") allowed = Boolean(me.departmentId) && att.need.submission.departmentId === me.departmentId;
  else if (me.role === "management_viewer") allowed = await getSetting("management_can_view_details");
  if (!allowed) return new NextResponse("Forbidden", { status: 403 });
  let buf: Buffer;
  try {
    buf = await readStoredFile(att.storageKey);
  } catch {
    return new NextResponse("File tidak ditemukan di penyimpanan.", { status: 404 });
  }
  await logAudit({ actorUserId: me.id, action: "attachment_downloaded", entityType: "need_attachment", entityId: att.id, metadata: { needId: att.needId } });
  const safeName = att.originalFilename.replace(/[^\w.\-() ]+/g, "_");
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": att.mimeType,
      "Content-Length": String(buf.length),
      "Content-Disposition": `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(att.originalFilename)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
