import "server-only";
import { env } from "@/lib/env";

// Google sign-in with the plain OAuth 2.0 authorization-code flow. No SDK: two HTTPS calls.

export const GOOGLE_STATE_COOKIE = "training_portal_google";

export function googleAuthUrl(state: string, nonce: string): string {
  const params = new URLSearchParams({
    client_id: env.googleClientId ?? "",
    redirect_uri: env.googleRedirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    nonce,
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export type GoogleProfile = { email: string; emailVerified: boolean; name: string | null };

export async function exchangeGoogleCode(code: string, nonce: string): Promise<GoogleProfile | null> {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.googleClientId ?? "",
        client_secret: env.googleClientSecret ?? "",
        redirect_uri: env.googleRedirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!response.ok) {
      console.error(`[google] Token exchange failed with status ${response.status}`);
      return null;
    }
    const { id_token: idToken } = (await response.json()) as { id_token?: string };
    const payload = idToken?.split(".")[1];
    if (!payload) return null;
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Record<string, unknown>;

    const issuerOk = claims.iss === "https://accounts.google.com" || claims.iss === "accounts.google.com";
    const audienceOk = claims.aud === env.googleClientId;
    const fresh = typeof claims.exp === "number" && claims.exp * 1000 > Date.now();
    if (!issuerOk || !audienceOk || !fresh || claims.nonce !== nonce || typeof claims.email !== "string") return null;

    return {
      email: claims.email,
      emailVerified: claims.email_verified === true || claims.email_verified === "true",
      name: typeof claims.name === "string" ? claims.name : null,
    };
  } catch (error) {
    console.error("[google] Sign-in failed:", error instanceof Error ? error.message : "unknown error");
    return null;
  }
}
