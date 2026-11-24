"use client";

import { useEffect, useRef, useState } from "react";
import { useShell } from "@/store/store";
import { initials } from "./format";
import { Icon, type IconName } from "./icons";

export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

/** A link inside the shell. Moves with the browser history, so no page is requested. */
export function A({ to, className, children, onClick, ...rest }: { to: string; className?: string; children: React.ReactNode; onClick?: () => void } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick">) {
  const { href, navigate } = useShell();
  return (
    <a
      href={href(to)}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        onClick?.();
        navigate(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "breeze" | "dark"; size?: "sm" | "md"; icon?: IconName };

export function Button({ variant = "secondary", size = "md", icon, className, children, ...rest }: ButtonProps) {
  const styles = {
    primary: "bg-hs-orange text-white hover:bg-hs-orange-strong disabled:bg-[#e6e6e6] disabled:text-[#8a8a8a]",
    secondary: "border border-ink bg-white text-ink hover:bg-[#f5f5f5] disabled:border-[#cfcfcf] disabled:text-[#9a9a9a]",
    ghost: "text-link hover:bg-[#eef5f5] disabled:text-[#9a9a9a]",
    breeze: "border border-breeze bg-white text-breeze hover:bg-breeze-soft disabled:opacity-50",
    dark: "bg-ink text-white hover:bg-[#333] disabled:bg-[#e6e6e6] disabled:text-[#8a8a8a]",
  }[variant];
  return (
    <button
      type="button"
      className={cx("inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[6px] font-semibold transition-colors", size === "sm" ? "h-8 px-3 text-[12.5px]" : "h-9 px-4 text-[13.5px]", styles, className)}
      {...rest}
    >
      {icon ? <Icon name={icon} size={size === "sm" ? 14 : 15} /> : null}
      {children}
    </button>
  );
}

export function Card({ title, right, children, className, pad = true, testId }: { title?: React.ReactNode; right?: React.ReactNode; children: React.ReactNode; className?: string; pad?: boolean; testId?: string }) {
  return (
    <section className={cx("rounded-[10px] border border-line bg-white", className)} data-testid={testId}>
      {title ? (
        <header className="flex min-h-11 items-center justify-between gap-3 px-4 pt-3">
          <h3 className="text-[14px] font-semibold">{title}</h3>
          {right}
        </header>
      ) : null}
      <div className={pad ? "px-4 pb-4 pt-3" : ""}>{children}</div>
    </section>
  );
}

const TONES = {
  neutral: "bg-[#ececec] text-[#3d3d3d]",
  green: "bg-[#dff4e4] text-[#0b5b2b]",
  amber: "bg-[#fdefc8] text-[#754c00]",
  red: "bg-[#fde0dd] text-[#99201a]",
  blue: "bg-[#dcecf9] text-[#0b4a78]",
  teal: "bg-[#d9f0ee] text-[#00514f]",
  orange: "bg-[#ffe4d6] text-[#a03400]",
  purple: "bg-penguin-soft text-penguin-strong",
  pink: "bg-breeze-soft text-breeze",
} as const;
export type Tone = keyof typeof TONES;

export function Tag({ tone = "neutral", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return <span className={cx("inline-flex h-[22px] items-center whitespace-nowrap rounded-[4px] px-2 text-[11.5px] font-semibold", TONES[tone], className)}>{children}</span>;
}

export function statusTone(status: string): Tone {
  switch (status) {
    case "Accepted":
    case "Approved":
    case "Paid":
    case "Shipped":
    case "Good standing":
    case "On":
    case "Active":
    case "Current":
    case "Closed won":
    case "Awarded - Won":
      return "green";
    case "Pending approval":
    case "Open":
    case "Partially shipped":
    case "In production":
      return "amber";
    case "Overdue":
    case "Past due":
    case "Credit hold":
    case "Closed lost":
    case "Closed - Lost":
      return "red";
    case "Sent":
      return "blue";
    default:
      return "neutral";
  }
}

export function Avatar({ name, color = "#5c6f82", size = 28 }: { name: string; color?: string; size?: number }) {
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white" style={{ width: size, height: size, background: color, fontSize: size * 0.38 }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

const PALETTE = ["#516f90", "#7c5ba6", "#2f7f80", "#a0572f", "#3d6fb4", "#8a4f7d", "#4f7a3f", "#946c00"];
export function colorFor(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

/** Boxed tabs, as on a HubSpot record. */
export function Tabs<T extends string>({ tabs, value, onChange, className }: { tabs: { id: T; label: React.ReactNode; testId?: string }[]; value: T; onChange: (id: T) => void; className?: string }) {
  return (
    <div role="tablist" className={cx("flex items-end gap-1 border-b border-line", className)}>
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={active}
            data-testid={tab.testId}
            onClick={() => onChange(tab.id)}
            className={cx(
              "-mb-px inline-flex h-9 items-center gap-1.5 rounded-t-[8px] border px-3.5 text-[13.5px]",
              active ? "border-line border-b-white bg-white font-semibold text-ink" : "border-transparent text-ink-muted hover:bg-[#e6e6e6] hover:text-ink",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/** Underlined tabs, as inside cards and index pages. */
export function LineTabs<T extends string>({ tabs, value, onChange, className }: { tabs: { id: T; label: React.ReactNode; testId?: string }[]; value: T; onChange: (id: T) => void; className?: string }) {
  return (
    <div role="tablist" className={cx("flex gap-5 border-b border-line-soft", className)}>
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={active}
            data-testid={tab.testId}
            onClick={() => onChange(tab.id)}
            className={cx("-mb-px h-9 border-b-2 text-[13.5px]", active ? "border-ink font-semibold text-ink" : "border-transparent text-ink-muted hover:text-ink")}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, onClose, active]);
}

/** A button with a popover. The popover closes on outside click, Escape, or when an item calls close(). */
export function Menu({
  button,
  children,
  align = "left",
  up = false,
  width = 240,
  className,
  menuClassName,
  menuTestId,
}: {
  button: (props: { open: boolean; toggle: () => void }) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: "left" | "right";
  up?: boolean;
  width?: number;
  className?: string;
  menuClassName?: string;
  menuTestId?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);
  useClickOutside(ref, close, open);
  return (
    <div ref={ref} className={cx("relative", className)}>
      {button({ open, toggle: () => setOpen((o) => !o) })}
      {open ? (
        <div
          data-testid={menuTestId}
          className={cx("hs-pop absolute z-[70] rounded-[8px] border border-line bg-white py-1.5 text-ink shadow-[0_8px_28px_rgba(20,20,20,0.18)]", align === "right" ? "right-0" : "left-0", up ? "bottom-full mb-2" : "top-full mt-1.5", menuClassName)}
          style={{ width }}
        >
          {children(close)}
        </div>
      ) : null}
    </div>
  );
}

export function MenuItem({ children, onClick, active, disabled, right, testId }: { children: React.ReactNode; onClick?: () => void; active?: boolean; disabled?: boolean; right?: React.ReactNode; testId?: string }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      data-testid={testId}
      className={cx("flex w-full items-center justify-between gap-3 px-3.5 py-2 text-left text-[13.5px]", disabled ? "text-[#9a9a9a]" : "hover:bg-[#f0f0f0]", active && "font-semibold")}
    >
      <span className="min-w-0">{children}</span>
      {right ?? (active ? <Icon name="check" size={15} /> : null)}
    </button>
  );
}

export function Modal({ title, children, footer, onClose, width = 560, testId }: { title: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode; onClose: () => void; width?: number; testId?: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(20,20,20,0.5)] p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" className="hs-pop flex max-h-full flex-col overflow-hidden rounded-[12px] bg-white shadow-[0_20px_60px_rgba(20,20,20,0.35)]" style={{ width }} data-testid={testId}>
        <header className="flex items-center justify-between border-b border-line-soft px-5 py-3.5">
          <h2 className="text-[16px] font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-ink-muted hover:bg-[#f0f0f0]">
            <Icon name="close" size={18} />
          </button>
        </header>
        <div className="hs-scroll min-h-0 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <footer className="flex items-center justify-end gap-2 border-t border-line-soft bg-[#fafafa] px-5 py-3">{footer}</footer> : null}
      </div>
    </div>
  );
}

/** One property on a record's left column or a preview panel. */
export function Prop({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-1.5">
      <dt className="text-[12px] text-ink-muted">{label}</dt>
      <dd className="mt-0.5 min-h-5 break-words text-[13.5px]">{children || <span className="text-[#9a9a9a]">--</span>}</dd>
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-6 py-12 text-center">
      <p className="text-[15px] font-semibold">{title}</p>
      {children ? <p className="max-w-md text-[13.5px] text-ink-muted">{children}</p> : null}
    </div>
  );
}

/** The Breeze "AI" pill, as HubSpot marks generated content. */
export function AiPill() {
  return (
    <span className="inline-flex h-[20px] items-center gap-1 rounded-full px-2 text-[10.5px] font-bold tracking-wide text-white" style={{ background: "linear-gradient(90deg,#ee255c,#db0f7a)" }}>
      <svg viewBox="0 0 24 24" width={10} height={10} fill="currentColor" aria-hidden="true">
        <path d="M12 2c.8 5.800 3.400 8.400 10 10-6.600 1.600-9.200 4.200-10 10-.800-5.800-3.400-8.400-10-10 6.600-1.600 9.200-4.200 10-10Z" />
      </svg>
      AI
    </span>
  );
}

export function Toast({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" className="hs-pop pointer-events-none fixed left-1/2 top-16 z-[85] -translate-x-1/2 rounded-[8px] bg-[#0b5b2b] px-4 py-2.5 text-[13.5px] font-semibold text-white shadow-lg">
      {children}
    </div>
  );
}
