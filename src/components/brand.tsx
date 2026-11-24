/* eslint-disable @next/next/no-img-element */
import { HUBSPOT_SPROCKET_PATH, HUBSPOT_SPROCKET_VIEWBOX, PENGUIN_MARK_PATHS, PENGUIN_MARK_VIEWBOX } from "./brand-paths";

export function HubSpotSprocket({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox={HUBSPOT_SPROCKET_VIEWBOX} width={size} height={size} className={className} role="img" aria-label="HubSpot">
      <path fill="#ff4800" d={HUBSPOT_SPROCKET_PATH} />
    </svg>
  );
}

export function HubSpotLogo({ height = 28, cream = false }: { height?: number; cream?: boolean }) {
  return <img src={cream ? "/brand/hubspot-logo-cream.svg" : "/brand/hubspot-logo.svg"} alt="HubSpot" style={{ height, width: "auto" }} />;
}

export function PenguinLogo({ height = 28, invert = false }: { height?: number; invert?: boolean }) {
  return (
    <img
      src="/penguin-logo.svg"
      alt="Penguin Strategies"
      style={{ height, width: "auto", filter: invert ? "invert(1)" : undefined }}
    />
  );
}

export function PenguinMark({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox={PENGUIN_MARK_VIEWBOX} height={size} width={(size * 30) / 41} className={className} fill="currentColor" aria-hidden="true">
      {PENGUIN_MARK_PATHS.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

/** Co-branded Tenant × HubSpot × Penguin Strategies lockup for signed-in Training Launchpad. */
export function TenantLockup({
  tenantName,
  accentColor = "#0b6e6e",
  height = 28,
}: {
  tenantName: string;
  accentColor?: string;
  height?: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3.5" data-testid="tenant-lockup">
      <span
        className="inline-flex items-center gap-2 rounded-[7px] px-3 py-1 font-penguin text-[14px] font-semibold tracking-wide text-white"
        style={{ background: accentColor }}
      >
        {tenantName}
      </span>
      <span className="text-[13px] font-semibold text-ink-muted" aria-hidden="true">
        ×
      </span>
      <HubSpotLogo height={height * 0.92} />
      <span className="h-6 w-px bg-line" aria-hidden="true" />
      <span className="flex items-center gap-1.5 text-[12.5px] text-ink-muted">
        Trained by <PenguinLogo height={height * 0.85} />
      </span>
    </div>
  );
}
