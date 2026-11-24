import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard, GoogleButton, MicrosoftButton, OrDivider } from "@/components/auth-card";
import { LinkInvalid, SetPasswordForm } from "@/components/set-password-form";
import { lookupInvite, setPasswordWithToken, setSessionCookie } from "@/lib/auth";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Set up your account" };

export default async function InvitePage({ params, searchParams }: PageProps<"/invite/[token]">) {
  const { token } = await params;
  const query = await searchParams;
  const lookup = await lookupInvite(token);
  const ssoAvailable = env.googleEnabled || env.microsoftEnabled;

  async function submit(formData: FormData): Promise<void> {
    "use server";
    const name = String(formData.get("name") ?? "").trim().slice(0, 120) || null;
    const result = await setPasswordWithToken("invite", token, String(formData.get("password") ?? ""), String(formData.get("confirm") ?? ""), name);
    if (!result.ok) {
      redirect(`/invite/${encodeURIComponent(token)}?error=${result.reason}`);
    }
    await setSessionCookie(result);
    redirect("/launchpad");
  }

  const inviteTenantSlug = lookup.ok && lookup.tenant ? lookup.tenant.slug : "amico";
  const inviteTenantName = lookup.ok && lookup.tenant ? lookup.tenant.name : "AMICO";

  return (
    <AuthCard
      title="Set up your account"
      tenantSlug={inviteTenantSlug}
      tenantName={inviteTenantName}
      description={
        lookup.ok
          ? `You have been invited to the ${inviteTenantName} HubSpot Training Portal. Choose a password to finish.`
          : undefined
      }
    >
      {lookup.ok ? (
        <div className="space-y-4">
          {ssoAvailable ? (
            <>
              <div className="space-y-2.5">
                {env.microsoftEnabled ? <MicrosoftButton label={`Continue with Microsoft as ${lookup.user.email}`} /> : null}
                {env.googleEnabled ? <GoogleButton label={`Continue with Google as ${lookup.user.email}`} /> : null}
              </div>
              <OrDivider />
            </>
          ) : null}
          <SetPasswordForm
            action={submit}
            email={lookup.user.email}
            name={lookup.user.name}
            askName={true}
            error={typeof query.error === "string" ? query.error : undefined}
            submitLabel="Create account"
          />
        </div>
      ) : (
        <LinkInvalid what="invite" />
      )}
    </AuthCard>
  );
}
