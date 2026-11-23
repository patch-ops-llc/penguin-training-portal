import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { MICROSOFT_STATE_COOKIE, microsoftAuthUrl } from "@/lib/microsoft";
import { generateToken } from "@/lib/tokens";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!env.microsoftEnabled) return NextResponse.redirect(new URL("/login", env.appUrl));
  const state = generateToken();
  const nonce = generateToken();
  const response = NextResponse.redirect(microsoftAuthUrl(state, nonce));
  response.cookies.set(MICROSOFT_STATE_COOKIE, `${state}.${nonce}`, {
    httpOnly: true,
    secure: env.secureCookies,
    sameSite: "lax",
    path: "/auth/microsoft",
    maxAge: 600,
  });
  return response;
}
