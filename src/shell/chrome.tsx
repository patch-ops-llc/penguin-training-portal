"use client";

import { useMemo, useRef, useState } from "react";
import { HubSpotSprocket } from "@/components/brand";
import { useShell } from "@/store/store";
import type { Notification } from "@/tenants/types";
import { relative } from "./format";
import { Icon, type IconName } from "./icons";
import { A, Avatar, cx, Menu, MenuItem, Tag, useClickOutside } from "./ui";

type NavItem = { to: string; label: string; icon: IconName };
type NavGroup = { group: string; items: NavItem[] };

const AMICO_NAV: NavGroup[] = [
  {
    group: "CRM",
    items: [
      { to: "/contacts", label: "Contacts", icon: "contacts" },
      { to: "/companies", label: "Companies", icon: "company" },
      { to: "/deals", label: "Deals", icon: "deal" },
      { to: "/projects", label: "Projects", icon: "project" },
      { to: "/epicor-quotes", label: "Epicor Quotes", icon: "file" },
      { to: "/segments", label: "Segments (Lists)", icon: "segments" },
      { to: "/tasks", label: "Tasks", icon: "task" },
      { to: "/leads", label: "Leads", icon: "target" },
    ],
  },
  {
    group: "Revenue",
    items: [
      { to: "/quotes", label: "Quotes", icon: "quote" },
      { to: "/products", label: "Products", icon: "product" },
    ],
  },
  {
    group: "Automation",
    items: [{ to: "/workflows", label: "Workflows", icon: "workflow" }],
  },
];

function Sidebar() {
  const { route } = useShell();
  const [pinned, setPinned] = useState(true);
  const section = `/${route.segments[0] ?? "deals"}`;
  const label = pinned ? "" : "opacity-0 group-hover/nav:opacity-100";

  return (
    <nav aria-label="Main CRM navigation" className={cx("group/nav relative z-30 shrink-0", pinned ? "w-[216px]" : "w-[52px]")}>
      <div
        className={cx(
          "absolute inset-y-0 left-0 flex flex-col overflow-hidden bg-nav text-white transition-[width] duration-100",
          pinned ? "w-[216px]" : "w-[52px] hover:w-[216px] hover:shadow-[6px_0_18px_rgba(0,0,0,0.25)]",
        )}
      >
        <div className="hs-scroll flex-1 overflow-y-auto overflow-x-hidden pb-2 pt-1">
          {AMICO_NAV.map((group) => (
            <div key={group.group} className="mt-2">
              <p
                className={cx(
                  "h-5 whitespace-nowrap px-4 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white/45",
                  pinned ? "opacity-100" : "opacity-0 group-hover/nav:opacity-100",
                )}
              >
                {group.group}
              </p>
              {group.items.map((item) => {
                const itemSection = `/${item.to.split("/")[1] ?? ""}`;
                const active = section === itemSection;
                return (
                  <A
                    key={item.to}
                    to={item.to}
                    data-testid={`nav-${itemSection.slice(1)}`}
                    className={cx(
                      "mx-1.5 flex h-9 items-center gap-3 whitespace-nowrap rounded-[6px] px-[11px] text-[13.5px]",
                      active ? "bg-white/15 font-semibold" : "text-white/85 hover:bg-nav-hover",
                    )}
                  >
                    <Icon name={item.icon} size={18} className="shrink-0" />
                    <span className={label}>{item.label}</span>
                  </A>
                );
              })}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setPinned((p) => !p)}
          className="mx-1.5 mb-2 flex h-9 items-center gap-3 whitespace-nowrap rounded-[6px] px-[11px] text-[12.5px] text-white/70 hover:bg-nav-hover"
        >
          <Icon name={pinned ? "chevronLeft" : "chevronRight"} size={18} className="shrink-0" />
          <span className={label}>{pinned ? "Collapse navigation" : "Keep navigation open"}</span>
        </button>
      </div>
    </nav>
  );
}

type Hit = { key: string; group: string; title: string; sub: string; to: string };

function Search() {
  const { world, dispatch, navigate } = useShell();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  const hits = useMemo<Hit[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const match = (...values: (string | undefined)[]) => values.some((v) => v?.toLowerCase().includes(q));
    const out: Hit[] = [];
    for (const c of world.contacts) {
      if (match(`${c.firstName} ${c.lastName}`, c.email, c.phone)) {
        out.push({ key: c.id, group: "Contacts", title: `${c.firstName} ${c.lastName}`, sub: c.email, to: `/contacts/${c.id}` });
      }
    }
    for (const c of world.companies) {
      if (match(c.name, c.domain, c.erp?.accountNumber)) {
        out.push({
          key: c.id,
          group: "Companies",
          title: c.name,
          sub: `${c.crossDivision?.primaryDivision ?? c.industry} · ${c.domain || "No domain"}`,
          to: `/companies/${c.id}`,
        });
      }
    }
    for (const d of world.deals) {
      if (match(d.name, d.customerPo, d.amicoOrderNumber)) {
        const companyName = world.companies.find((c) => c.id === d.companyId)?.name ?? "";
        out.push({ key: d.id, group: "Deals", title: d.name, sub: `${d.division} · ${companyName}`, to: `/deals/${d.id}` });
      }
    }
    for (const p of world.projects) {
      if (match(p.name, p.code)) {
        out.push({ key: p.id, group: "Projects", title: p.name, sub: `${p.code} · ${p.status}`, to: `/projects/${p.id}` });
      }
    }
    for (const eq of world.epicorQuotes) {
      if (match(eq.quoteNumber, eq.title, eq.epicorCustomerId, eq.customerPo)) {
        out.push({ key: eq.id, group: "Epicor Quotes", title: `${eq.quoteNumber}: ${eq.title}`, sub: eq.status, to: `/epicor-quotes/${eq.id}` });
      }
    }
    for (const qt of world.quotes) {
      if (match(qt.number, qt.title)) {
        out.push({ key: qt.id, group: "Quotes", title: `${qt.number}: ${qt.title}`, sub: qt.status, to: `/quotes/${qt.id}` });
      }
    }
    return out.slice(0, 14);
  }, [query, world]);

  return (
    <div ref={ref} className="relative w-[420px]">
      <Icon name="search" size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
      <input
        value={query}
        onChange={(e) => {
          const val = e.target.value;
          setQuery(val);
          setOpen(true);
          if (val.trim().length >= 2) {
            dispatch({ t: "search.query", q: val.trim() });
          }
        }}
        onFocus={() => setOpen(true)}
        placeholder="Find in HubSpot (Contacts, Companies, Deals, Projects, Quotes)"
        aria-label="Find in HubSpot"
        data-testid="global-search"
        className="h-8 w-full rounded-full border border-white/25 bg-white/10 pl-9 pr-3 text-[13px] text-white placeholder:text-white/60 focus:bg-white focus:text-ink focus:outline-none focus:placeholder:text-ink-muted"
      />
      {open && query.trim().length >= 2 ? (
        <div
          className="hs-pop absolute left-0 top-full z-[70] mt-1.5 max-h-[420px] w-[480px] overflow-y-auto rounded-[8px] border border-line bg-white py-1.5 text-ink shadow-[0_8px_28px_rgba(20,20,20,0.18)]"
          data-testid="search-results"
        >
          {hits.length === 0 ? (
            <p className="px-4 py-3 text-[13.5px] text-ink-muted">No records match &ldquo;{query.trim()}&rdquo; — safe to create a new record.</p>
          ) : null}
          {hits.map((hit, i) => (
            <div key={hit.key}>
              {i === 0 || hits[i - 1].group !== hit.group ? (
                <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{hit.group}</p>
              ) : null}
              <button
                type="button"
                data-testid={`search-hit-${hit.key}`}
                className="flex w-full items-baseline gap-2 px-4 py-1.5 text-left hover:bg-[#f0f0f0]"
                onClick={() => {
                  dispatch({ t: "search.query", q: query.trim() });
                  setOpen(false);
                  setQuery("");
                  navigate(hit.to);
                }}
              >
                <span className="text-[13.5px] font-semibold">{hit.title}</span>
                <span className="truncate text-[12.5px] text-ink-muted">{hit.sub}</span>
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Bell() {
  const { world, persona, dispatch, navigate } = useShell();
  const ref = useRef<HTMLDivElement>(null);
  const open = world.ui.bell === "open";
  const items = world.notifications.filter((n) => n.personaId === persona.id || n.personaId === "all");
  const unread = items.filter((n) => !n.read).length;
  const close = () => dispatch({ t: "ui", k: "bell", v: "closed" });
  useClickOutside(ref, close, open);

  const toggle = () => {
    if (open) return close();
    dispatch([
      { t: "ui", k: "bell", v: "open" },
      { t: "flag", k: "notif.opened" },
    ]);
  };

  const openItem = (n: Notification) => {
    dispatch([
      { t: "notif.read", id: n.id },
      { t: "flag", k: "notif.opened" },
      { t: "ui", k: "bell", v: "closed" },
    ]);
    navigate(n.path);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={`Notifications, ${unread} unread`}
        data-testid="bell"
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-full text-white/90 hover:bg-nav-hover"
      >
        <Icon name="bell" size={18} />
        {unread > 0 ? (
          <span
            className="absolute -right-0.5 -top-0.5 inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-hs-orange px-1 text-[10.5px] font-bold text-white ring-2 ring-nav"
            data-testid="bell-count"
          >
            {unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div
          className="hs-pop absolute right-0 top-full z-[70] mt-1.5 w-[400px] rounded-[10px] border border-line bg-white text-ink shadow-[0_8px_28px_rgba(20,20,20,0.18)]"
          data-testid="bell-panel"
        >
          <p className="border-b border-line-soft px-4 py-3 text-[14px] font-semibold">Notifications</p>
          <div className="hs-scroll max-h-[420px] overflow-y-auto">
            {items.length === 0 ? <p className="px-4 py-6 text-center text-[13.5px] text-ink-muted">No alerts for {persona.name}.</p> : null}
            {items.map((n) => (
              <div key={n.id} className={cx("border-b border-line-soft px-4 py-3 last:border-b-0", !n.read && "bg-[#fff7f2]")}>
                <button type="button" onClick={() => openItem(n)} className="block w-full text-left" data-testid={`notif-${n.id}`}>
                  <span className="flex items-center gap-2">
                    {!n.read ? <span className="h-2 w-2 shrink-0 rounded-full bg-hs-orange" /> : null}
                    <span className="text-[13.5px] font-semibold">{n.title}</span>
                    <span className="ml-auto shrink-0 text-[11.5px] text-ink-muted">{relative(n.at)}</span>
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-ink-muted">{n.body}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SettingsGear() {
  const { route } = useShell();
  const active = route.segments[0] === "profile";
  return (
    <A
      to="/profile"
      aria-label="Profile & Preferences"
      title="Profile & Preferences"
      data-testid="settings-gear"
      className={cx(
        "inline-flex h-8 w-8 items-center justify-center rounded-full text-white/90 hover:bg-nav-hover",
        active && "bg-white/15",
      )}
    >
      <Icon name="settings" size={18} />
    </A>
  );
}

function AccountMenu() {
  const { pack, persona, navigate } = useShell();
  return (
    <Menu
      align="right"
      width={300}
      button={({ toggle }) => (
        <button
          type="button"
          onClick={toggle}
          data-testid="account-menu"
          className="flex h-9 items-center gap-2 rounded-full pl-1 pr-2.5 text-[13px] text-white hover:bg-nav-hover"
        >
          <Avatar name={persona.name} color={persona.color} size={28} />
          <span className="max-w-[155px] truncate">{pack.portal.company}</span>
          <Icon name="chevronDown" size={14} />
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="flex items-center gap-3 px-3.5 pb-3 pt-2">
            <Avatar name={persona.name} color={persona.color} size={38} />
            <div className="min-w-0">
              <p className="text-[14px] font-semibold" data-testid="persona-name">
                {persona.name}
              </p>
              <p className="truncate text-[12px] text-ink-muted">{persona.title}</p>
              <p className="truncate text-[11.5px] text-ink-muted">{persona.division}</p>
            </div>
          </div>
          <div className="border-t border-line-soft px-3.5 py-2.5">
            <p className="text-[13.5px] font-semibold">{pack.portal.company}</p>
            <p className="text-[12px] text-ink-muted">Hub ID: {pack.portal.hubId}</p>
            <p className="mt-1.5">
              <Tag tone="amber">Training sandbox · synthetic data</Tag>
            </p>
          </div>
          <div className="border-t border-line-soft py-1.5">
            <MenuItem
              testId="menu-profile-prefs"
              onClick={() => {
                close();
                navigate("/profile");
              }}
            >
              <span className="block font-semibold">Profile &amp; Preferences</span>
              <span className="block text-[12px] font-normal text-ink-muted">Timezone, working hours, notifications &amp; Outlook</span>
            </MenuItem>
          </div>
          <div className="border-t border-line-soft py-1.5">
            <a href="/launchpad" className="block px-3.5 py-2 text-[13.5px] hover:bg-[#f0f0f0]" data-testid="exit-launchpad">
              Exit to Training Launchpad
            </a>
          </div>
        </>
      )}
    </Menu>
  );
}

export function Chrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-nav">
      <header className="relative z-[35] flex h-12 shrink-0 items-center gap-3 px-3 text-white">
        <A to="/deals" className="inline-flex h-9 w-9 items-center justify-center rounded-[6px] hover:bg-nav-hover" aria-label="HubSpot home">
          <HubSpotSprocket size={24} />
        </A>
        <Search />
        <div className="ml-auto flex items-center gap-1.5">
          <SettingsGear />
          <Bell />
          <AccountMenu />
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="hs-scroll relative min-w-0 flex-1 overflow-y-auto rounded-tl-[12px] bg-hs-bg" data-testid="shell-main" id="shell-main">
          {children}
        </main>
      </div>
    </div>
  );
}
