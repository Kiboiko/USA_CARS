import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken, verifyAdminToken } from "./lib/services/tokens";

/**
 * Edge middleware guarding /api/admin/* (ТЗ §5: "middleware на /admin/api/*").
 * The login endpoint is public; everything else under /api/admin requires a
 * valid bearer token. Route handlers additionally re-verify via requireAdmin().
 */

export const config = {
  matcher: ["/api/admin/:path*"],
};

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  // Public: the login endpoint issues the token.
  if (pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Server auth not configured" }, { status: 500 });
  }

  const token = extractBearerToken(req.headers.get("authorization"));
  const claims = token ? await verifyAdminToken(token, secret) : null;
  if (!claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}
