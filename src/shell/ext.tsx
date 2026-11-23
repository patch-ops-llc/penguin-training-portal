"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PenguinMark } from "@/components/brand";
import { useShell } from "@/store/store";
import type { Extension } from "@/tenants/types";
import { cx } from "./ui";

export function useExtension(id: string): Extension | undefined {
  const { pack, moduleId } = useShell();
  const own = pack.extensions[moduleId]?.find((e) => e.id === id);
  if (own) return own;
  for (const list of Object.values(pack.extensions)) {
    const found = list?.find((e) => e.id === id);
    if (found) return found;
  }
  return undefined;
}

type Position = { left: number; top: number; side: "top" | "bottom"; arrow: number };
const CALLOUT_WIDTH = 310;

/**
 * Coaching & process callout pin inside the simulated HubSpot UI.
 * Supports `by: "penguin"` (custom CRM extension built by Penguin) and `by: "amico-rule"`
 * (AMICO business rule / SOP guardrail). Press `H` to spotlight every callout on screen.
 */
export function Ext({ id, children, className, pinClass }: { id: string; children: React.ReactNode; className?: string; pinClass?: string }) {
  const extension = useExtension(id);
  const { highlight } = useShell();
  const [hover, setHover] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const pinRef = useRef<HTMLButtonElement>(null);
  const active = extension?.by === "penguin" || extension?.by === "amico-rule";
  const open = Boolean(active && (hover || highlight));

  const place = useCallback(() => {
    const pin = pinRef.current;
    if (!pin) return;
    const rect = pin.getBoundingClientRect();
    const left = Math.max(8, Math.min(window.innerWidth - CALLOUT_WIDTH - 8, rect.right - CALLOUT_WIDTH + 12));
    const side: Position["side"] = rect.top > 150 ? "top" : "bottom";
    setPosition({
      left,
      top: side === "top" ? rect.top - 10 : rect.bottom + 10,
      side,
      arrow: Math.max(12, left + CALLOUT_WIDTH - rect.right + rect.width / 2 - 5),
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, place]);

  if (!active || !extension) return <div className={className}>{children}</div>;

  const badgeLabel = extension.by === "amico-rule" ? "AMICO Process Rule" : "Penguin CRM Extension";

  return (
    <div className={cx("px", className)} data-open={open} data-ext={id} data-testid={`ext-${id}`}>
      {children}
      <span className="px-ring" aria-hidden="true" />
      <button
        ref={pinRef}
        type="button"
        className={cx("px-pin", pinClass)}
        aria-label={`${badgeLabel}: ${extension.name}`}
        data-testid={`ext-pin-${id}`}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
      >
        <PenguinMark size={17} />
      </button>
      {open && position
        ? createPortal(
            <div
              role="tooltip"
              className="px-callout"
              data-side={position.side}
              data-testid={`ext-callout-${id}`}
              style={{
                left: position.left,
                top: position.top,
                transform: position.side === "top" ? "translateY(-100%)" : undefined,
                ["--px-arrow" as string]: `${position.arrow}px`,
              }}
            >
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#c9bdf5]">
                <PenguinMark size={14} className="text-white" /> {badgeLabel}
              </p>
              <p className="mt-1 text-[13.5px] font-semibold leading-snug">{extension.name}</p>
              {extension.note ? <p className="mt-1 text-[12.5px] leading-snug text-[#ddd6f7]">{extension.note}</p> : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
