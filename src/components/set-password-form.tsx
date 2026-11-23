import { inputClass, primaryButton } from "@/components/auth-card";
import { MIN_PASSWORD_LENGTH } from "@/lib/password.mjs";

const ERRORS: Record<string, string> = {
  password_too_short: `Use at least ${MIN_PASSWORD_LENGTH} characters.`,
  password_mismatch: "The two passwords do not match.",
};

export function SetPasswordForm({
  action,
  email,
  name,
  askName,
  error,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  email: string;
  name: string | null;
  askName: boolean;
  error?: string;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-4">
      <label className="block space-y-1.5 text-[13.5px]">
        <span className="font-medium">Email</span>
        <input type="email" value={email} readOnly disabled className={`${inputClass} bg-[#f6f5fb] text-[#5f5b73]`} />
      </label>
      {askName ? (
        <label className="block space-y-1.5 text-[13.5px]">
          <span className="font-medium">Your name</span>
          <input type="text" name="name" required maxLength={120} defaultValue={name ?? ""} autoComplete="name" className={inputClass} />
        </label>
      ) : null}
      <label className="block space-y-1.5 text-[13.5px]">
        <span className="font-medium">Password</span>
        <input type="password" name="password" required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" className={inputClass} />
        <span className="block text-[12px] text-[#5f5b73]">At least {MIN_PASSWORD_LENGTH} characters.</span>
      </label>
      <label className="block space-y-1.5 text-[13.5px]">
        <span className="font-medium">Confirm password</span>
        <input type="password" name="confirm" required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" className={inputClass} />
      </label>
      {error && ERRORS[error] ? (
        <p role="alert" className="rounded-md border border-[#f3b4b4] bg-[#fdf1f1] px-3 py-2 text-[13px] text-[#a11212]">
          {ERRORS[error]}
        </p>
      ) : null}
      <button type="submit" className={`${primaryButton} w-full`}>
        {submitLabel}
      </button>
    </form>
  );
}

export function LinkInvalid({ what }: { what: string }) {
  return (
    <p className="rounded-md border border-[#e4e2ee] bg-[#f6f5fb] p-4 text-[13.5px]">
      This {what} link is no longer valid. It may have expired, been replaced by a newer one, or already been used. Ask your training
      administrator to send a new one.
    </p>
  );
}
