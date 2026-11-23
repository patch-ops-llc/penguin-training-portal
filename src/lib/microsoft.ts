import "server-only";
import { env } from "@/lib/env";

// Microsoft Entra ID (Azure AD) OAuth 2.0 authorization-code flow. Plain HTTPS calls matching google.ts.

export const MICROSOFT_STATE_COOKIE = "training_portal_microsoft";

export function microsoftAuthUrl(state: string, nonce: string): string {
  const tenant = encodeURIComponent(env.microsoftTenantId);
  const params = new URLSearchParams({
    client_id: env.microsoftClientId ?? "",
    redirect_uri: env.microsoftRedirectUri,
    response_type: "code",
    response_mode: "query",
    scope: "openid email profile",
    state,
    nonce,
    prompt: "select_account",
  });
  return `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?${params}`;
}

export type MicrosoftProfile = { email: string; emailVerified: boolean; name: string | null };

/**
 * Exchanges the authorization code directly with Microsoft Entra ID over TLS and validates
 * the OIDC ID token claims (issuer, audience, expiry, nonce, work email).
 */
export async function exchangeMicrosoftCode(code: string, nonce: string): Promise<MicrosoftProfile | null> {
  try {
    const tenant = encodeURIComponent(env.microsoftTenantId);
    const response = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.microsoftClientId ?? "",
        client_secret: env.microsoftClientSecret ?? "",
        redirect_uri: env.microsoftRedirectUri,
        grant_type: "authorization_code",
        scope: "openid email profile",
      }),
    });
    if (!response.ok) {
      console.error(`[microsoft] Token exchange failed with status ${response.status}`);
      return null;
    }
    const { id_token: idToken } = (await response.json()) as { id_token?: string };
    const payload = idToken?.split(".")[1];
    if (!payload) return null;
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Record<string, unknown>;

    const iss = typeof claims.iss === "string" ? claims.iss : "";
    const issuerOk =
      /^https:\/\/login\.microsoftonline\.com\/[a-zA-Z0-9-]+\/v2\.0\/?$/.test(iss) ||
      /^https:\/\/sts\.windows\.net\/[a-zA-Z0-9-]+\/?$/.test(iss);
    const audienceOk = claims.aud === env.microsoftClientId;
    const fresh = typeof claims.exp === "number" && claims.exp * 1000 > Date.now();
    const rawEmail =
      typeof claims.email === "string" && claims.email.includes("@")
        ? claims.email
        : typeof claims.preferred_username === "string" && claims.preferred_username.includes("@")
          ? claims.preferred_username
          : null;

    if (!issuerOk || !audienceOk || !fresh || claims.nonce !== nonce || !rawEmail) return null;

    // Entra ID organizational accounts omit xms_edov or set it true; consumer accounts expose email_verified/xms_edov.
    const unverifiedExplicit = claims.email_verified === false || claims.xms_edov === false;
    return {
      email: rawEmail,
      emailVerified: !unverifiedExplicit,
      name: typeof claims.name === "string" ? claims.name : null,
    };
  } catch (error) {
    console.error("[microsoft] Sign-in failed:", error instanceof Error ? error.message : "unknown error");
    return null;
  }
}
