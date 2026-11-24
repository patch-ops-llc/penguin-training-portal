"use client";

import { useEffect, useRef, useState } from "react";
import { useShell } from "@/store/store";
import { initials } from "./format";
import { Icon, type IconName } from "./icons";

export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

/** A link inside the shell. Moves with the browser history, so no page is requested. */
export function A({
  to,
  className,
  children,
  onClick,
  ...rest
}: {
  to: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick">) {
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

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "breeze" | "dark";
  size?: "xs" | "sm" | "md";
  icon?: IconName;
};

export function Button({ variant = "secondary", size = "md", icon, className, children, ...rest }: ButtonProps) {
  const styles = {
    primary:
      "border border-[#ff5c35] bg-[#ff5c35] text-white hover:border-[#e84b27] hover:bg-[#e84b27] disabled:border-[#dfe3eb] disabled:bg-[#eaf0f6] disabled:text-[#7c98b6]",
    secondary:
      "border border-[#cbd6e2] bg-white text-[#33475b] hover:bg-[#eaf0f6] hover:border-[#99acc2] disabled:border-[#dfe3eb] disabled:bg-[#f5f8fa] disabled:text-[#7c98b6]",
    ghost:
      "border border-transparent bg-transparent text-[#0091ae] hover:bg-[#e5f5f8] hover:text-[#007a8c] disabled:text-[#7c98b6]",
    breeze:
      "border border-[#cbd6e2] bg-white text-[#b01b68] hover:bg-[#fdebf3] disabled:opacity-50",
    dark:
      "border border-[#33475b] bg-[#33475b] text-white hover:bg-[#253342] disabled:border-[#dfe3eb] disabled:bg-[#eaf0f6] disabled:text-[#7c98b6]",
  }[variant];

  const sz =
    size === "xs"
      ? "h-7 px-2.5 text-[12px]"
      : size === "sm"
        ? "h-8 px-3 text-[12.5px]"
        : "h-[34px] px-3.5 text-[13px]";

  return (
    <button
      type="button"
      className={cx(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[3px] font-medium transition-colors",
        sz,
        styles,
        className,
      )}
      {...rest}
    >
      {icon ? <Icon name={icon} size={size === "xs" ? 13 : 14} /> : null}
      {children}
    </button>
  );
}

export function Card({
  title,
  right,
  children,
  className,
  pad = true,
  testId,
  collapsible = false,
  defaultOpen = true,
}: {
  title?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  pad?: boolean;
  testId?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={cx("rounded-[4px] border border-[#dfe3eb] bg-white", className)} data-testid={testId}>
      {title ? (
        <header className="flex min-h-10 items-center justify-between gap-2 border-b border-[#eaf0f6] px-4 py-2.5">
          {collapsible ? (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="flex min-w-0 items-center gap-1.5 text-left text-[13.5px] font-semibold text-[#33475b] hover:text-[#0091ae]"
            >
              <Icon name={open ? "chevronDown" : "chevronRight"} size={14} className="shrink-0 text-[#516f90]" />
              <span className="truncate">{title}</span>
            </button>
          ) : (
            <h3 className="text-[13.5px] font-semibold text-[#33475b]">{title}</h3>
          )}
          {right ? <div className="flex shrink-0 items-center gap-1.5">{right}</div> : null}
        </header>
      ) : null}
      {!collapsible || open ? <div className={pad ? "p-4" : ""}>{children}</div> : null}
    </section>
  );
}

const TONES = {
  neutral: "bg-[#eaf0f6] text-[#33475b] border border-[#cbd6e2]/70",
  green: "bg-[#e5f8f6] text-[#006c5f] border border-[#99e2d8]",
  amber: "bg-[#fef6e7] text-[#8a5300] border border-[#f5c26b]",
  red: "bg-[#fdecee] text-[#b0232a] border border-[#f7b2b6]",
  blue: "bg-[#e5f5f8] text-[#00677d] border border-[#99d6e2]",
  teal: "bg-[#e5f8f6] text-[#006c5f] border border-[#99e2d8]",
  orange: "bg-[#fff1ed] text-[#b83718] border border-[#ffbfa8]",
  purple: "bg-[#f1eeff] text-[#4c32b7] border border-[#cfc4ff]",
  pink: "bg-[#fdebf3] text-[#a3155b] border border-[#f5b5d2]",
} as const;
export type Tone = keyof typeof TONES;

export function Tag({ tone = "neutral", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cx("inline-flex h-[21px] items-center whitespace-nowrap rounded-[3px] px-2 text-[11px] font-semibold", TONES[tone], className)}>
      {children}
    </span>
  );
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
    case "Awarded":
    case "Connected":
    case "Qualified":
    case "on-track":
      return "green";
    case "Pending approval":
    case "Open":
    case "Partially shipped":
    case "In production":
    case "Attempting":
    case "at-risk":
      return "amber";
    case "Overdue":
    case "Past due":
    case "Credit hold":
    case "Closed lost":
    case "Closed - Lost":
    case "Disqualified":
    case "blocked":
      return "red";
    case "Sent":
    case "New":
      return "blue";
    default:
      return "neutral";
  }
}

export function Avatar({ name, color = "#516f90", size = 26 }: { name: string; color?: string; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: color, fontSize: Math.max(10, Math.round(size * 0.39)) }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

const PALETTE = ["#0091ae", "#516f90", "#6a4c93", "#00a4bd", "#d95f02", "#3b6fb6", "#7a5195", "#2d7d6f"];
export function colorFor(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

/** HubSpot Saved View Tabs bar on CRM Object Index pages (active underline + optional close ×). */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  onCloseTab,
  right,
  className,
}: {
  tabs: { id: T; label: React.ReactNode; testId?: string; closable?: boolean }[];
  value: T;
  onChange: (id: T) => void;
  onCloseTab?: (id: T) => void;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div role="tablist" className={cx("flex flex-wrap items-end justify-between gap-2 border-b border-[#dfe3eb] bg-white", className)}>
      <div className="flex flex-wrap items-end">
        {tabs.map((tab) => {
          const active = tab.id === value;
          return (
            <div
              key={tab.id}
              className={cx(
                "group relative -mb-px flex h-9 items-center border-r border-t border-[#dfe3eb] first:border-l",
                active
                  ? "border-b-white bg-white font-semibold text-[#33475b] before:absolute before:inset-x-0 before:top-0 before:h-[2.5px] before:bg-[#33475b]"
                  : "border-b-[#dfe3eb] bg-[#f5f8fa] text-[#516f90] hover:bg-[#eaf0f6] hover:text-[#33475b]",
              )}
            >
              <button
                role="tab"
                type="button"
                aria-selected={active}
                data-testid={tab.testId}
                onClick={() => onChange(tab.id)}
                className="inline-flex h-full items-center gap-1.5 px-3.5 text-[12.5px]"
              >
                {tab.label}
              </button>
              {tab.closable && onCloseTab ? (
                <button
                  type="button"
                  onClick={() => onCloseTab(tab.id)}
                  aria-label="Close view tab"
                  className="-ml-1.5 mr-2 rounded p-0.5 text-[#7c98b6] hover:bg-[#dfe3eb] hover:text-[#33475b]"
                >
                  <Icon name="close" size={11} />
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
      {right ? <div className="flex items-center gap-2 pb-1">{right}</div> : null}
    </div>
  );
}

/** HubSpot underline tabs, as in record middle pane (`Overview | Activities`) and Sales Workspace. */
export function LineTabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
  right,
}: {
  tabs: { id: T; label: React.ReactNode; testId?: string }[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
  right?: React.ReactNode;
}) {
  return (
    <div role="tablist" className={cx("flex items-center justify-between gap-4 border-b border-[#dfe3eb]", className)}>
      <div className="flex gap-6">
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
                "-mb-px h-10 border-b-[3px] px-0.5 text-[13.5px] transition-colors",
                active
                  ? "border-[#33475b] font-semibold text-[#33475b]"
                  : "border-transparent font-medium text-[#516f90] hover:border-[#cbd6e2] hover:text-[#33475b]",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
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
          className={cx(
            "hs-pop absolute z-[70] rounded-[4px] border border-[#cbd6e2] bg-white py-1.5 text-[#33475b] shadow-[0_8px_24px_rgba(31,42,55,0.18)]",
            align === "right" ? "right-0" : "left-0",
            up ? "bottom-full mb-2" : "top-full mt-1",
            menuClassName,
          )}
          style={{ width }}
        >
          {children(close)}
        </div>
      ) : null}
    </div>
  );
}

export function MenuItem({
  children,
  onClick,
  active,
  disabled,
  right,
  testId,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  right?: React.ReactNode;
  testId?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      data-testid={testId}
      className={cx(
        "flex w-full items-center justify-between gap-3 px-3.5 py-2 text-left text-[13px]",
        disabled ? "text-[#7c98b6]" : "text-[#33475b] hover:bg-[#e5f5f8]",
        active && "bg-[#eaf0f6] font-semibold",
      )}
    >
      <span className="min-w-0">{children}</span>
      {right ?? (active ? <Icon name="check" size={14} className="text-[#0091ae]" /> : null)}
    </button>
  );
}

export function Modal({
  title,
  subtitle,
  children,
  footer,
  onClose,
  width = 560,
  testId,
  headerTone = "hubspot",
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  width?: number;
  testId?: string;
  headerTone?: "hubspot" | "light";
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(31,42,55,0.52)] p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="hs-pop flex max-h-full flex-col overflow-hidden rounded-[4px] border border-[#cbd6e2] bg-white shadow-[0_20px_54px_rgba(31,42,55,0.32)]"
        style={{ width }}
        data-testid={testId}
      >
        <header
          className={cx(
            "flex items-center justify-between px-5 py-3.5",
            headerTone === "hubspot"
              ? "hs-drawer-header text-white"
              : "border-b border-[#dfe3eb] bg-white text-[#33475b]",
          )}
        >
          <div className="min-w-0">
            <h2 className={cx("text-[16px] font-semibold", headerTone === "hubspot" ? "!text-white" : "text-[#33475b]")}>
              {title}
            </h2>
            {subtitle ? (
              <p className={cx("mt-0.5 text-[12px]", headerTone === "hubspot" ? "text-white/85" : "text-[#516f90]")}>{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={cx(
              "rounded p-1",
              headerTone === "hubspot" ? "text-white/85 hover:bg-white/15 hover:text-white" : "text-[#516f90] hover:bg-[#eaf0f6]",
            )}
          >
            <Icon name="close" size={18} />
          </button>
        </header>
        <div className="hs-scroll min-h-0 overflow-y-auto px-6 py-5 text-[#33475b]">{children}</div>
        {footer ? (
          <footer className="flex items-center justify-end gap-2 border-t border-[#dfe3eb] bg-[#f5f8fa] px-6 py-3">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}

/** Authentic HubSpot Right Slide-Over Drawer (used for Create Record, Record Preview, and Lead Workspace). */
export function Drawer({
  title,
  subtitle,
  headerRight,
  children,
  footer,
  onClose,
  width = 480,
  testId,
  backdrop = true,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  width?: number;
  testId?: string;
  backdrop?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className={cx(
        "fixed inset-0 z-[78] flex justify-end",
        backdrop ? "bg-[rgba(31,42,55,0.34)]" : "pointer-events-none",
      )}
      onMouseDown={(e) => backdrop && e.target === e.currentTarget && onClose()}
    >
      <aside
        role="dialog"
        aria-modal={backdrop}
        data-testid={testId}
        style={{ width }}
        className="hs-drawer-panel pointer-events-auto flex h-full max-w-full flex-col border-l border-[#cbd6e2] bg-white shadow-[-10px_0_32px_rgba(31,42,55,0.2)]"
      >
        <header className="hs-drawer-header flex shrink-0 items-center justify-between gap-3 px-5 py-3.5">
          <div className="min-w-0">
            <h2 className="truncate text-[16px] font-semibold !text-white">{title}</h2>
            {subtitle ? <p className="mt-0.5 truncate text-[12px] text-white/85">{subtitle}</p> : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {headerRight}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close drawer"
              className="rounded p-1 text-white/90 hover:bg-white/15 hover:text-white"
            >
              <Icon name="close" size={18} />
            </button>
          </div>
        </header>
        <div className="hs-scroll min-h-0 flex-1 overflow-y-auto px-6 py-5 text-[#33475b]">{children}</div>
        {footer ? (
          <footer className="flex shrink-0 items-center justify-start gap-2 border-t border-[#dfe3eb] bg-[#f5f8fa] px-6 py-3.5">
            {footer}
          </footer>
        ) : null}
      </aside>
    </div>
  );
}

/** One property on a HubSpot record's left column or preview drawer (with optional hover-reveal inline edit). */
export function Prop({
  label,
  children,
  editable,
  onEditClick,
}: {
  label: string;
  children: React.ReactNode;
  editable?: boolean;
  onEditClick?: () => void;
}) {
  return (
    <div className="group/prop relative border-b border-[#eaf0f6] py-2 last:border-b-0">
      <dt className="flex items-center justify-between text-[11.5px] font-medium text-[#516f90]">
        <span>{label}</span>
        {editable && onEditClick ? (
          <button
            type="button"
            onClick={onEditClick}
            title={`Edit ${label}`}
            className="opacity-0 transition-opacity group-hover/prop:opacity-100 text-[#0091ae] hover:text-[#007a8c]"
          >
            <Icon name="edit" size={12} />
          </button>
        ) : null}
      </dt>
      <dd className="mt-0.5 min-h-[19px] break-words text-[13px] text-[#33475b]">
        {children || <span className="text-[#7c98b6]">--</span>}
      </dd>
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 px-6 py-12 text-center">
      <p className="text-[14.5px] font-semibold text-[#33475b]">{title}</p>
      {children ? <p className="max-w-md text-[13px] text-[#516f90]">{children}</p> : null}
    </div>
  );
}

/** HubSpot Breeze AI badge */
export function AiPill() {
  return (
    <span
      className="inline-flex h-[19px] items-center gap-1 rounded-[3px] px-1.5 text-[10px] font-bold tracking-wide text-white"
      style={{ background: "linear-gradient(90deg,#d91b60,#7b2cbf)" }}
    >
      <Icon name="sparkle" size={10} />
      Breeze AI
    </span>
  );
}

export function Toast({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="status"
      className="hs-pop pointer-events-none fixed left-1/2 top-14 z-[85] -translate-x-1/2 rounded-[4px] border border-[#00a4bd] bg-[#1f2a37] px-4 py-2.5 text-[13px] font-medium text-white shadow-lg"
    >
      {children}
    </div>
  );
}
