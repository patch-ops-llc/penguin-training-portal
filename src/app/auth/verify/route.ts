import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions, verifyMagicLink } from "@/lib/auth";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const result = await verifyMagicLink(token);

  if (!result.ok) {
    return NextResponse.redirect(new URL(`/login?error=link_${result.reason}`, env.appUrl));
  }

  const response = NextResponse.redirect(new URL("/launchpad", env.appUrl));
  response.cookies.set(SESSION_COOKIE, result.sessionToken, sessionCookieOptions(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)));
  return response;
}
