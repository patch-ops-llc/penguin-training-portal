"use server";

import { redirect } from "next/navigation";
import { loginWithPassword, requestMagicLink, setSessionCookie } from "@/lib/auth";

export async function passwordLoginAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const result = await loginWithPassword(email, password);
  if (!result.ok) {
    redirect(`/login?error=${result.reason}&email=${encodeURIComponent(email.trim())}`);
  }
  await setSessionCookie(result);
  redirect("/launchpad");
}

export async function sendMagicLinkAction(formData: FormData): Promise<void> {
  await requestMagicLink(String(formData.get("email") ?? ""));
  redirect("/login?sent=1");
}
