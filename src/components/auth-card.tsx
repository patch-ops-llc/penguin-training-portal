import { PenguinLogo } from "@/components/brand";

export const inputClass =
  "w-full rounded-[8px] border border-[#bdb8d4] bg-white px-3 py-2.5 text-[14px] text-[#16122b] outline-none focus:border-penguin focus:ring-2 focus:ring-penguin/20";
export const primaryButton =
  "inline-flex items-center justify-center rounded-[8px] bg-penguin px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-penguin-strong disabled:opacity-50";
export const authLink = "font-medium text-penguin underline underline-offset-2 hover:text-penguin-strong";

/** Signed-out screens carry Penguin's brand only — zero client or CRM spoilers before authentication. */
export function AuthCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f6f5fb] px-6 py-12 font-penguin text-[#16122b]">
      <div className="mb-7 flex flex-col items-center gap-3">
        <PenguinLogo height={44} />
        <p className="rounded-full bg-penguin-soft px-3 py-1 text-[12px] font-semibold tracking-wide text-penguin">Training Portal</p>
      </div>
      <div className="w-full max-w-[420px] rounded-2xl border border-[#e4e2ee] bg-white p-8 shadow-[0_6px_24px_rgba(28,19,64,0.08)]">
        <h1 className="text-[22px] font-semibold tracking-tight">{title}</h1>
        {description ? <p className="mt-1.5 text-[13.5px] text-[#5f5b73]">{description}</p> : null}
        <div className="mt-6">{children}</div>
      </div>
      <p className="mt-6 max-w-[420px] text-center text-[12px] text-[#5f5b73]">
        Built and run by Penguin Strategies. Access is by invitation. Sign-ins and training completion are logged.
      </p>
    </main>
  );
}

export function GoogleButton({ label = "Continue with Google" }: { label?: string }) {
  return (
    <a
      href="/auth/google"
      data-testid="google-sign-in"
      className="flex w-full items-center justify-center gap-2.5 rounded-[8px] border border-[#bdb8d4] bg-white px-4 py-2.5 text-[14px] font-semibold text-[#16122b] hover:bg-[#f6f5fb]"
    >
      <svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true">
        <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
        <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18Z" />
        <path fill="#FBBC05" d="M3.96 10.71a5.41 5.41 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l3-2.33Z" />
        <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58Z" />
      </svg>
      {label}
    </a>
  );
}

export function MicrosoftButton({ label = "Continue with Microsoft" }: { label?: string }) {
  return (
    <a
      href="/auth/microsoft"
      data-testid="microsoft-sign-in"
      className="flex w-full items-center justify-center gap-2.5 rounded-[8px] border border-[#bdb8d4] bg-white px-4 py-2.5 text-[14px] font-semibold text-[#16122b] hover:bg-[#f6f5fb]"
    >
      <svg viewBox="0 0 21 21" width="18" height="18" aria-hidden="true">
        <rect x="1" y="1" width="9" height="9" fill="#f25022" />
        <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
        <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
        <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
      </svg>
      {label}
    </a>
  );
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-[12px] text-[#8a86a0]" aria-hidden="true">
      <span className="h-px flex-1 bg-[#e4e2ee]" />
      or
      <span className="h-px flex-1 bg-[#e4e2ee]" />
    </div>
  );
}
