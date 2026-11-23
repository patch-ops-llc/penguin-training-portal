import { NextResponse, type NextRequest } from "next/server";
import { ACTIVE_TENANT_COOKIE, destroySession, SESSION_COOKIE } from "@/lib/auth";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  await destroySession(request.cookies.get(SESSION_COOKIE)?.value);
  const response = NextResponse.redirect(new URL("/login", env.appUrl), { status: 303 });
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(ACTIVE_TENANT_COOKIE);
  return response;
}
