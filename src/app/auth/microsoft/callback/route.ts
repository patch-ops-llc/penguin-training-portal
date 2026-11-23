import { NextResponse, type NextRequest } from "next/server";
import { loginWithMicrosoft, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { env } from "@/lib/env";
import { exchangeMicrosoftCode, MICROSOFT_STATE_COOKIE } from "@/lib/microsoft";

export const dynamic = "force-dynamic";

function back(error: string): NextResponse {
  const response = NextResponse.redirect(new URL(`/login?error=${error}`, env.appUrl));
  response.cookies.delete({ name: MICROSOFT_STATE_COOKIE, path: "/auth/microsoft" });
  return response;
}

export async function GET(request: NextRequest) {
  if (!env.microsoftEnabled) return NextResponse.redirect(new URL("/login", env.appUrl));

  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const [state, nonce] = (request.cookies.get(MICROSOFT_STATE_COOKIE)?.value ?? "").split(".");
  if (!code || !state || !nonce || params.get("state") !== state) return back("microsoft_failed");

  const profile = await exchangeMicrosoftCode(code, nonce);
  if (!profile) return back("microsoft_failed");

  const result = await loginWithMicrosoft(profile);
  if (!result.ok) return back(result.reason);

  const response = NextResponse.redirect(new URL("/launchpad", env.appUrl));
  response.cookies.set(SESSION_COOKIE, result.sessionToken, sessionCookieOptions(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)));
  response.cookies.delete({ name: MICROSOFT_STATE_COOKIE, path: "/auth/microsoft" });
  return response;
}
