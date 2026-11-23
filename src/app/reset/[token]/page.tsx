import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { LinkInvalid, SetPasswordForm } from "@/components/set-password-form";
import { lookupReset, setPasswordWithToken, setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPage({ params, searchParams }: PageProps<"/reset/[token]">) {
  const { token } = await params;
  const query = await searchParams;
  const lookup = await lookupReset(token);

  async function submit(formData: FormData): Promise<void> {
    "use server";
    const name = String(formData.get("name") ?? "").trim().slice(0, 120) || null;
    const result = await setPasswordWithToken("reset", token, String(formData.get("password") ?? ""), String(formData.get("confirm") ?? ""), name);
    if (!result.ok) {
      redirect(`/reset/${encodeURIComponent(token)}?error=${result.reason}`);
    }
    await setSessionCookie(result);
    redirect("/launchpad");
  }

  return (
    <AuthCard title="Choose a new password" description={lookup.ok ? "Setting a new password signs you out everywhere else." : undefined}>
      {lookup.ok ? (
        <SetPasswordForm
          action={submit}
          email={lookup.user.email}
          name={lookup.user.name}
          askName={false}
          error={typeof query.error === "string" ? query.error : undefined}
          submitLabel="Save password"
        />
      ) : (
        <LinkInvalid what="reset" />
      )}
    </AuthCard>
  );
}
