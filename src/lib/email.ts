import "server-only";
import { env } from "@/lib/env";

export type EmailMessage = { to: string; subject: string; text: string };

/**
 * Sends transactional email through Resend's HTTP API. Without RESEND_API_KEY nothing is sent
 * and the admin copies the one-time link from the admin screen instead.
 * Returns true only when the message was handed to Resend.
 */
export async function sendEmail(message: EmailMessage): Promise<boolean> {
  const apiKey = env.resendApiKey;
  if (!apiKey) {
    // The body holds a one-time link, so it stays out of the log. The admin screen shows the link to copy.
    console.log(`[email] RESEND_API_KEY is not set. Not sent to ${message.to}: ${message.subject}`);
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ from: env.emailFrom, to: [message.to], subject: message.subject, text: message.text }),
    });
    if (!response.ok) {
      console.error(`[email] Resend returned ${response.status}: ${await response.text()}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] Failed to send:", error);
    return false;
  }
}
