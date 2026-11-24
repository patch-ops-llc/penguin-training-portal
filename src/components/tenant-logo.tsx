/* eslint-disable @next/next/no-img-element */

/** Intrinsic width:height of the five-diamond metallic AMICO® lockup SVGs. */
export const AMICO_LOGO_ASPECT = 238 / 74;

export const AMICO_BRAND = {
  slug: "amico",
  name: "AMICO",
  legalName: "Alabama Metal Industries Corporation",
  accentColor: "#5C6672",
  logoLightSrc: "/brands/amico/amico-logo.svg",
  logoDarkSrc: "/brands/amico/amico-logo-white.svg",
  markSrc: "/brands/amico/amico-mark.svg",
} as const;

export function getTenantInitials(name: string): string {
  const words = name
    .trim()
    .split(/[\s\-_/]+/)
    .filter(Boolean);
  if (words.length === 0) return "TN";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function AmicoLogo({
  height = 32,
  variant = "light",
  className,
  testId,
}: {
  height?: number;
  variant?: "light" | "dark";
  className?: string;
  testId?: string;
}) {
  const src = variant === "dark" ? AMICO_BRAND.logoDarkSrc : AMICO_BRAND.logoLightSrc;
  return (
    <img
      src={src}
      alt="AMICO® — Alabama Metal Industries Corporation"
      data-testid={testId}
      className={className}
      style={{ height, width: Math.round(height * AMICO_LOGO_ASPECT), maxWidth: "min(100%, 420px)" }}
    />
  );
}

export function AmicoMark({
  size = 28,
  className,
  testId,
}: {
  size?: number;
  className?: string;
  testId?: string;
}) {
  return (
    <img
      src={AMICO_BRAND.markSrc}
      alt="AMICO"
      width={size}
      height={size}
      data-testid={testId}
      className={className}
      style={{ width: size, height: size }}
    />
  );
}

/**
 * Renders the authentic AMICO corporate logo/mark when `tenantSlug === "amico"`,
 * and falls back cleanly to a crisp geometric monogram badge for other tenants.
 */
export function TenantLogo({
  tenantSlug,
  tenantName,
  accentColor = "#1b4f72",
  variant = "light",
  mode = "full",
  height = 28,
  className = "",
  testId,
}: {
  tenantSlug?: string | null;
  tenantName?: string | null;
  accentColor?: string;
  variant?: "light" | "dark";
  mode?: "full" | "mark" | "badge";
  height?: number;
  className?: string;
  testId?: string;
}) {
  const normalizedSlug = (tenantSlug ?? "").trim().toLowerCase();
  const displayName = (tenantName ?? "").trim() || (normalizedSlug === AMICO_BRAND.slug ? AMICO_BRAND.name : "Organization");
  const isAmico = normalizedSlug === AMICO_BRAND.slug;

  if (isAmico) {
    if (mode === "mark") {
      return <AmicoMark size={height} className={className} testId={testId} />;
    }
    if (mode === "badge") {
      const markPx = Math.max(16, Math.round(height));
      return (
        <span
          data-testid={testId}
          className={`inline-flex items-center gap-2 font-penguin font-semibold ${
            variant === "dark" ? "text-white" : "text-[#16122b]"
          } ${className}`}
        >
          <AmicoMark size={markPx} />
          <span>{displayName}</span>
        </span>
      );
    }
    return <AmicoLogo height={height} variant={variant} className={className} testId={testId} />;
  }

  const initials = getTenantInitials(displayName);
  const boxPx = Math.max(20, Math.round(height));
  const fontSize = Math.max(10, Math.round(boxPx * 0.42));

  const monogram = (
    <span
      aria-hidden={mode !== "mark"}
      aria-label={mode === "mark" ? displayName : undefined}
      data-testid={mode === "mark" ? testId : undefined}
      className="inline-grid shrink-0 place-items-center rounded-[6px] font-penguin font-bold tracking-tight text-white shadow-2xs"
      style={{
        width: boxPx,
        height: boxPx,
        fontSize,
        background: accentColor || "#1b4f72",
      }}
    >
      {initials}
    </span>
  );

  if (mode === "mark") {
    return monogram;
  }

  return (
    <span
      data-testid={testId}
      className={`inline-flex items-center gap-2 font-penguin font-semibold ${
        variant === "dark" ? "text-white" : "text-[#16122b]"
      } ${className}`}
    >
      {monogram}
      <span className="truncate">{displayName}</span>
    </span>
  );
}
