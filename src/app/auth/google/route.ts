import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { GOOGLE_STATE_COOKIE, googleAuthUrl } from "@/lib/google";
import { generateToken } from "@/lib/tokens";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!env.googleEnabled) return NextResponse.redirect(new URL("/login", env.appUrl));
  const state = generateToken();
  const nonce = generateToken();
  const response = NextResponse.redirect(googleAuthUrl(state, nonce));
  response.cookies.set(GOOGLE_STATE_COOKIE, `${state}.${nonce}`, {
    httpOnly: true,
    secure: env.secureCookies,
    sameSite: "lax",
    path: "/auth/google",
    maxAge: 600,
  });
  return response;
}
