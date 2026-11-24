import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard, authLink, GoogleButton, inputClass, MicrosoftButton, OrDivider, primaryButton } from "@/components/auth-card";
import { getCurrentUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { passwordLoginAction, sendMagicLinkAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  invalid_credentials: "That email and password do not match.",
  disabled: "This account or tenant has been disabled. Contact your training administrator.",
  too_many_attempts: "Too many failed attempts. Wait 15 minutes and try again.",
  link_invalid: "That sign-in link is not valid. Request a new one.",
  link_expired: "That sign-in link has expired. Request a new one.",
  link_used: "That sign-in link was already used. Request a new one.",
  link_disabled: "This account has been disabled. Contact your training administrator.",
  google_not_invited: "That Google account has not been invited. Ask your administrator to invite your work email first.",
  google_disabled: "This account has been disabled. Contact your training administrator.",
  google_unverified: "Google has not verified that email address, so it cannot be used to sign in.",
  google_failed: "Google sign-in did not complete. Try again.",
  microsoft_not_invited: "That Microsoft account has not been invited. Ask your administrator to invite your work email first.",
  microsoft_disabled: "This account has been disabled. Contact your training administrator.",
  microsoft_unverified: "Microsoft has not verified that email address, so it cannot be used to sign in.",
  microsoft_failed: "Microsoft sign-in did not complete. Try again.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const user = await getCurrentUser();
  if (user) redirect("/launchpad");

  const params = await searchParams;
  const sent = params.sent === "1";
  const error = typeof params.error === "string" ? ERRORS[params.error] : undefined;
  const prefillEmail = typeof params.email === "string" ? params.email : "";
  const magicLinkAvailable = env.resendApiKey !== null;
  const showMagicLinkForm = magicLinkAvailable && params.mode === "link";
  const ssoAvailable = env.googleEnabled || env.microsoftEnabled;

  return (
    <AuthCard
      title="Sign in"
      description="Sign in with your invited AMICO or organization work email to open your HubSpot training sandbox."
    >
      {sent ? (
        <div className="space-y-4">
          <p className="rounded-md border border-[#e4e2ee] bg-[#f6f5fb] p-4 text-[13.5px]">
            If that address has an account, a sign-in link is on its way. It expires in 15 minutes.
          </p>
          <Link href="/login" className={`${authLink} text-[13.5px]`}>
            Back to sign in
          </Link>
        </div>
      ) : showMagicLinkForm ? (
        <form action={sendMagicLinkAction} className="space-y-4">
          <label className="block space-y-1.5 text-[13.5px]">
            <span className="font-medium">Work email</span>
            <input type="email" name="email" required autoComplete="email" className={inputClass} />
          </label>
          <button type="submit" className={`${primaryButton} w-full`}>
            Email me a sign-in link
          </button>
          <Link href="/login" className={`${authLink} block text-[13.5px]`}>
            Sign in with a password instead
          </Link>
        </form>
      ) : (
        <form action={passwordLoginAction} className="space-y-4">
          {ssoAvailable ? (
            <>
              <div className="space-y-2.5">
                {env.microsoftEnabled ? <MicrosoftButton /> : null}
                {env.googleEnabled ? <GoogleButton /> : null}
              </div>
              <OrDivider />
            </>
          ) : null}
          <label className="block space-y-1.5 text-[13.5px]">
            <span className="font-medium">Work email</span>
            <input type="email" name="email" required autoComplete="email" defaultValue={prefillEmail} className={inputClass} />
          </label>
          <label className="block space-y-1.5 text-[13.5px]">
            <span className="font-medium">Password</span>
            <input type="password" name="password" required autoComplete="current-password" className={inputClass} />
          </label>
          {error ? (
            <p role="alert" className="rounded-md border border-[#f3b4b4] bg-[#fdf1f1] px-3 py-2 text-[13px] text-[#a11212]">
              {error}
            </p>
          ) : null}
          <button type="submit" className={`${primaryButton} w-full`}>
            Sign in
          </button>
          <p className="text-[13px] text-[#5f5b73]">
            No account or forgot your password? Ask your training administrator for an invite or a reset link.
          </p>
          {magicLinkAvailable ? (
            <Link href="/login?mode=link" className={`${authLink} block text-[13.5px]`}>
              Email me a sign-in link instead
            </Link>
          ) : null}
        </form>
      )}
    </AuthCard>
  );
}
