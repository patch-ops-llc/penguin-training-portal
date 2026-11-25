import "server-only";
import type { KnowledgeDocument, Tenant } from "@prisma/client";
import { forbidden } from "next/navigation";
import { type SessionUser, resolveActiveTenant } from "@/lib/auth";

export async function requireKnowledgeTenant(user: SessionUser): Promise<Tenant> {
  const tenant = await resolveActiveTenant(user);
  if (!tenant || tenant.status !== "ACTIVE") forbidden();
  if (user.role !== "PENGUIN_ADMIN" && user.tenantId && user.tenantId !== tenant.id) forbidden();
  return tenant;
}

export function isKnowledgeAdmin(user: SessionUser): boolean {
  return user.role === "PENGUIN_ADMIN" || user.role === "CLIENT_ADMIN";
}

export function assertDocumentTenant(user: SessionUser, doc: Pick<KnowledgeDocument, "tenantId">, tenantId: string): void {
  if (doc.tenantId !== tenantId) forbidden();
  if (user.role !== "PENGUIN_ADMIN" && user.tenantId !== tenantId) forbidden();
}

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}