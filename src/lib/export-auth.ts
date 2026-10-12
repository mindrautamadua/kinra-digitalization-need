import "server-only";
import { getCurrentUser, type SessionUser } from "@/lib/auth/session";
import { getSetting } from "@/lib/settings";
import { parseFilters } from "@/components/needs/register-filters";
import type { RegisterFilters } from "@/lib/queries/needs";

/** Menentukan apakah pengguna boleh ekspor dan filter yang dipaksakan sesuai hak akses. */
export async function exportContext(req: Request): Promise<{ user: SessionUser; filters: RegisterFilters } | Response> {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const url = new URL(req.url);
  const sp: Record<string, string> = {};
  url.searchParams.forEach((v, k) => (sp[k] = v));
  const filters = parseFilters(sp);
  if (user.role === "respondent") {
    const allowed = await getSetting("allow_respondent_export");
    if (!allowed || !user.departmentId) return new Response("Forbidden", { status: 403 });
    filters.departmentIdRestrict = user.departmentId;
    filters.department = undefined;
  } else if (user.role === "management_viewer") {
    const allowed = await getSetting("management_can_view_details");
    if (!allowed) return new Response("Forbidden", { status: 403 });
  }
  return { user, filters };
}
