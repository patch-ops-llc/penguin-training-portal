import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { inputClass, primaryButton } from "@/components/auth-card";
import { PenguinLogo } from "@/components/brand";
import { changePassword, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { MIN_PASSWORD_LENGTH } from "@/lib/password.mjs";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your account" };

const ERRORS: Record<string, string> = {
  wrong_password: "The current password is not right.",
  password_too_short: `Use at least ${MIN_PASSWORD_LENGTH} characters.`,
  password_mismatch: "The two new passwords do not match.",
};

const ROLE_LABELS: Record<string, string> = {
  PENGUIN_ADMIN: "Penguin Super-Admin",
  CLIENT_ADMIN: "Client Training Admin",
  TRAINEE: "Trainee",
};

async function changePasswordAction(formData: FormData): Promise<void> {
  "use server";
  const user = await requireUser();
  const result = await changePassword(
    user,
    String(formData.get("current") ?? ""),
    String(formData.get("password") ?? ""),
    String(formData.get("confirm") ?? ""),
  );
  redirect(result.ok ? "/account?changed=1" : `/account?error=${result.reason}`);
}

export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const user = await requireUser();
  const params = await searchParams;
  const record = await db.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  const hasPassword = Boolean(record?.passwordHash);
  const error = typeof params.error === "string" ? ERRORS[params.error] : undefined;

  return (
    <div className="min-h-screen bg-[#f6f5fb] font-penguin text-[#16122b]">
      <header className="border-b border-[#e4e2ee] bg-white">
        <div className="mx-auto flex max-w-[1240px] items-center gap-6 px-6 py-3">
          <PenguinLogo height={30} />
          <span className="rounded bg-penguin-soft px-2 py-0.5 text-[12px] font-semibold text-penguin">Training Portal</span>
          <Link href="/launchpad" className="ml-auto text-[13px] font-medium text-penguin underline underline-offset-2">
            Back to training launchpad
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-[540px] px-6 py-10">
        <h1 className="text-[24px] font-semibold tracking-tight">Your account</h1>
        <dl className="mt-4 space-y-1.5 rounded-xl border border-[#e4e2ee] bg-white p-5 text-[13.5px]">
          <div className="flex justify-between py-1">
            <dt className="text-[#5f5b73]">Name</dt>
            <dd className="font-medium">{user.name ?? "Not set"}</dd>
          </div>
          <div className="flex justify-between py-1">
            <dt className="text-[#5f5b73]">Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div className="flex justify-between py-1">
            <dt className="text-[#5f5b73]">Portal role</dt>
            <dd>{ROLE_LABELS[user.role] ?? user.role}</dd>
          </div>
          <div className="flex justify-between py-1">
            <dt className="text-[#5f5b73]">Organization</dt>
            <dd>{user.tenantName ?? "Penguin Strategies (Global)"}</dd>
          </div>
          {user.division ? (
            <div className="flex justify-between py-1">
              <dt className="text-[#5f5b73]">Division</dt>
              <dd>{user.division}</dd>
            </div>
          ) : null}
          {user.jobRole ? (
            <div className="flex justify-between py-1">
              <dt className="text-[#5f5b73]">Job role</dt>
              <dd>{user.jobRole}</dd>
            </div>
          ) : null}
        </dl>

        <form action={changePasswordAction} className="mt-6 space-y-4 rounded-xl border border-[#e4e2ee] bg-white p-5" data-testid="change-password-form">
          <h2 className="text-[16px] font-semibold">{hasPassword ? "Change password" : "Set a password"}</h2>
          {params.changed === "1" ? (
            <p role="status" className="rounded-md border border-[#b9e0c4] bg-[#eefaf1] px-3 py-2 text-[13px] text-[#0b5b2b]" data-testid="password-changed">
              Password changed. Other devices were signed out.
            </p>
          ) : null}
          {hasPassword ? (
            <label className="block space-y-1.5 text-[13.5px]">
              <span className="font-medium">Current password</span>
              <input type="password" name="current" required autoComplete="current-password" className={inputClass} />
            </label>
          ) : null}
          <label className="block space-y-1.5 text-[13.5px]">
            <span className="font-medium">New password</span>
            <input type="password" name="password" required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" className={inputClass} />
            <span className="block text-[12px] text-[#5f5b73]">At least {MIN_PASSWORD_LENGTH} characters.</span>
          </label>
          <label className="block space-y-1.5 text-[13.5px]">
            <span className="font-medium">Confirm new password</span>
            <input type="password" name="confirm" required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" className={inputClass} />
          </label>
          {error ? (
            <p role="alert" className="rounded-md border border-[#f3b4b4] bg-[#fdf1f1] px-3 py-2 text-[13px] text-[#a11212]">
              {error}
            </p>
          ) : null}
          <button type="submit" className={primaryButton}>
            {hasPassword ? "Change password" : "Set password"}
          </button>
        </form>
      </main>
    </div>
  );
}
