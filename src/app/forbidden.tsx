import Link from "next/link";
import { AuthCard, primaryButton } from "@/components/auth-card";

export default function ForbiddenPage() {
  return (
    <AuthCard title="Access restricted" description="You do not have permission to view this organization or administrative area.">
      <div className="space-y-4" data-testid="forbidden-screen">
        <p className="rounded-md border border-[#e4e2ee] bg-[#f6f5fb] p-4 text-[13.5px] text-[#5f5b73]">
          HTTP 403 — Your account is scoped to your assigned organization and training role.
        </p>
        <Link href="/launchpad" className={`${primaryButton} w-full`}>
          Return to Training Launchpad
        </Link>
      </div>
    </AuthCard>
  );
}
