import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/forbidden"];
const SESSION_COOKIE = "kinra_dna_session";

/**
 * Pemeriksaan kasar di edge: tanpa cookie sesi, arahkan ke /login.
 * Otorisasi sesungguhnya (role, kepemilikan) dilakukan server-side di setiap page/action/route.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const hasCookie = Boolean(req.cookies.get(SESSION_COOKIE)?.value);
  if (!isPublic && !hasCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (pathname === "/login" && hasCookie) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|ico|webp)$).*)"],
};
