"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HubSpotSprocket } from "@/components/brand";
import { useShell } from "@/store/store";
import type { Notification } from "@/tenants/types";
import { relative } from "./format";
import { Icon, type IconName } from "./icons";
import { A, AiPill, Avatar, cx, Menu, MenuItem, Tag, useClickOutside } from "./ui";

type NavItem = { to: string; label: string; icon: IconName; testId: string };
type NavGroup = { id: string; group: string; icon: IconName; items: NavItem[] };

const BOOKMARKS: { to: string; label: string; icon: IconName }[] = [
  { to: "/sales-workspace", label: "Sales Workspace", icon: "briefcase" },
  { to: "/deals", label: "Deals", icon: "deal" },
  { to: "/companies", label: "Companies", icon: "company" },
];

const HUBSPOT_NAV: NavGroup[] = [
  {
    id: "crm",
    group: "CRM",
    icon: "contacts",
    items: [
      { to: "/contacts", label: "Contacts", icon: "contacts", testId: "nav-contacts" },
      { to: "/companies", label: "Companies", icon: "company", testId: "nav-companies" },
      { to: "/deals", label: "Deals", icon: "deal", testId: "nav-deals" },
      { to: "/tickets", label: "Tickets", icon: "ticket", testId: "nav-tickets" },
      { to: "/leads", label: "Leads", icon: "target", testId: "nav-leads" },
      { to: "/segments", label: "Lists / Segments", icon: "segments", testId: "nav-segments" },
      { to: "/epicor-quotes", label: "Epicor Quotes", icon: "file", testId: "nav-epicor-quotes" },
      { to: "/projects", label: "Projects", icon: "project", testId: "nav-projects" },
    ],
  },
  {
    id: "sales",
    group: "Sales",
    icon: "briefcase",
    items: [
      { to: "/sales-workspace", label: "Sales Workspace", icon: "briefcase", testId: "nav-sales-workspace" },
      { to: "/tasks", label: "Tasks", icon: "task", testId: "nav-tasks" },
    ],
  },
  {
    id: "commerce",
    group: "Commerce",
    icon: "quote",
    items: [
      { to: "/quotes", label: "Quotes", icon: "quote", testId: "nav-quotes" },
      { to: "/products", label: "Products", icon: "product", testId: "nav-products" },
    ],
  },
  {
    id: "automation",
    group: "Automation",
    icon: "workflow",
    items: [{ to: "/workflows", label: "Workflows", icon: "workflow", testId: "nav-workflows" }],
  },
  {
    id: "reporting",
    group: "Reporting",
    icon: "chart",
    items: [{ to: "/reporting", label: "Dashboards", icon: "chart", testId: "nav-reporting" }],
  },
];

function Sidebar() {
  const { route } = useShell();
  const [pinned, setPinned] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const section = `/${route.segments[0] ?? "deals"}`;
  const labelVis = pinned ? "" : "opacity-0 group-hover/nav:opacity-100";

  const toggleGroup = (id: string) =>
    setCollapsedGroups((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));

  return (
    <nav
      aria-label="HubSpot Primary Navigation"
      data-testid="hubspot-left-nav"
      className={cx(
        "group/nav relative z-30 shrink-0 border-r border-[#33475b] bg-[#1f2a37]",
        pinned ? "w-[220px]" : "w-[52px]",
      )}
    >
      <div
        className={cx(
          "absolute inset-y-0 left-0 flex flex-col overflow-hidden bg-[#1f2a37] text-white transition-[width] duration-100",
          pinned ? "w-[220px]" : "w-[52px] hover:w-[220px] hover:shadow-[8px_0_24px_rgba(15,23,42,0.4)]",
        )}
      >
        <div className="hs-scroll flex-1 overflow-y-auto overflow-x-hidden pb-2 pt-2">
          {/* Bookmarks Group */}
          <div className="mb-2 border-b border-white/10 pb-2">
            <p
              className={cx(
                "flex h-5 items-center gap-1.5 whitespace-nowrap px-3.5 text-[10.5px] font-bold uppercase tracking-[0.07em] text-[#99acc2]",
                labelVis,
              )}
            >
              <Icon name="bookmark" size={11} /> Bookmarks
            </p>
            {BOOKMARKS.map((bm) => (
              <A
                key={`bm-${bm.to}`}
                to={bm.to}
                className={cx(
                  "mx-1.5 mt-0.5 flex h-7 items-center gap-2.5 whitespace-nowrap rounded-[4px] px-2.5 text-[12.5px] text-[#cbd6e2] hover:bg-[#2e3f50] hover:text-white",
                )}
              >
                <Icon name={bm.icon} size={14} className="shrink-0 text-[#99acc2]" />
                <span className={labelVis}>{bm.label}</span>
              </A>
            ))}
          </div>

          {/* HubSpot Collapsible Hub Groups */}
          {HUBSPOT_NAV.map((group) => {
            const isCollapsed = Boolean(collapsedGroups[group.id]);
            return (
              <div key={group.id} className="mt-1.5">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className={cx(
                    "flex h-6 w-full items-center justify-between whitespace-nowrap px-3.5 text-left text-[10.5px] font-bold uppercase tracking-[0.07em] text-[#99acc2] hover:text-white",
                    labelVis,
                  )}
                >
                  <span>{group.group}</span>
                  <Icon name={isCollapsed ? "chevronRight" : "chevronDown"} size={12} />
                </button>
                {!isCollapsed
                  ? group.items.map((item) => {
                      const itemSection = `/${item.to.split("/")[1] ?? ""}`;
                      const active = section === itemSection;
                      return (
                        <A
                          key={item.to}
                          to={item.to}
                          data-testid={item.testId}
                          className={cx(
                            "relative mx-1.5 mt-0.5 flex h-8 items-center gap-2.5 whitespace-nowrap rounded-[4px] px-2.5 text-[13px] transition-colors",
                            active
                              ? "bg-[#33475b] font-semibold text-white before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-r before:bg-[#ff5c35]"
                              : "text-[#dfe3eb] hover:bg-[#2e3f50] hover:text-white",
                          )}
                        >
                          <Icon name={item.icon} size={16} className={cx("shrink-0", active ? "text-[#ff5c35]" : "text-[#99acc2]")} />
                          <span className={labelVis}>{item.label}</span>
                        </A>
                      );
                    })
                  : null}
              </div>
            );
          })}
        </div>

        {/* Bottom Rail Settings Gear & Collapse Toggle */}
        <div className="border-t border-white/10 p-1.5">
          <A
            to="/profile"
            className="flex h-8 items-center gap-2.5 whitespace-nowrap rounded-[4px] px-2.5 text-[12.5px] text-[#cbd6e2] hover:bg-[#2e3f50] hover:text-white"
          >
            <Icon name="settings" size={16} className="shrink-0 text-[#99acc2]" />
            <span className={labelVis}>Settings</span>
          </A>
          <button
            type="button"
            onClick={() => setPinned((p) => !p)}
            data-testid="sidebar-collapse-toggle"
            className="mt-0.5 flex h-8 w-full items-center gap-2.5 whitespace-nowrap rounded-[4px] px-2.5 text-[12px] text-[#99acc2] hover:bg-[#2e3f50] hover:text-white"
          >
            <Icon name={pinned ? "chevronLeft" : "chevronRight"} size={16} className="shrink-0" />
            <span className={labelVis}>{pinned ? "Collapse sidebar" : "Expand sidebar"}</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

type Hit = { key: string; group: string; title: string; sub: string; to: string };

function Search() {
  const { world, dispatch, navigate } = useShell();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useClickOutside(wrapRef, () => setOpen(false), open);

  // Authentic HubSpot global search keyboard shortcuts: ⌘K / Ctrl+K or `/`
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = Boolean(
        target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable),
      );
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      } else if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey && e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const hits = useMemo<Hit[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const match = (...values: (string | undefined)[]) => values.some((v) => v?.toLowerCase().includes(q));
    const out: Hit[] = [];
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
    for (const c of world.contacts) {
      if (match(`${c.firstName} ${c.lastName}`, c.email, c.phone)) {
        out.push({ key: c.id, group: "Contacts", title: `${c.firstName} ${c.lastName}`, sub: c.email, to: `/contacts/${c.id}` });
      }
    }
    for (const d of world.deals) {
      if (match(d.name, d.customerPo, d.amicoOrderNumber, d.quoteNumber)) {
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
    <div ref={wrapRef} className="relative w-[430px]">
      <Icon name="search" size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#99acc2]" />
      <input
        ref={inputRef}
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
        placeholder="Search HubSpot"
        aria-label="Search HubSpot"
        data-testid="global-search"
        className="h-8 w-full rounded-[4px] border border-[#3e5266] bg-[#253342] pl-8 pr-14 text-[13px] text-white placeholder:text-[#99acc2] focus:border-[#0091ae] focus:bg-white focus:text-[#33475b] focus:outline-none focus:placeholder:text-[#7c98b6]"
      />
      <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-[3px] border border-white/15 bg-[#1f2a37]/80 px-1.5 py-0.5 text-[10.5px] font-medium text-[#cbd6e2]">
        ⌘K
      </kbd>
      {open && query.trim().length >= 2 ? (
        <div
          className="hs-pop absolute left-0 top-full z-[70] mt-1.5 max-h-[440px] w-[510px] overflow-y-auto rounded-[4px] border border-[#cbd6e2] bg-white py-1.5 text-[#33475b] shadow-[0_12px_32px_rgba(31,42,55,0.24)]"
          data-testid="search-results"
        >
          <div className="flex items-center justify-between border-b border-[#eaf0f6] px-4 py-1.5 text-[11px] text-[#516f90]">
            <span>Showing top Smart CRM matches for &ldquo;{query.trim()}&rdquo;</span>
            <span>ESC to close</span>
          </div>
          {hits.length === 0 ? (
            <p className="px-4 py-4 text-[13px] text-[#516f90]">
              No records match &ldquo;{query.trim()}&rdquo; — safe to create a new record without duplicating.
            </p>
          ) : null}
          {hits.map((hit, i) => (
            <div key={hit.key}>
              {i === 0 || hits[i - 1].group !== hit.group ? (
                <p className="bg-[#f5f8fa] px-4 py-1 text-[10.5px] font-bold uppercase tracking-wider text-[#516f90]">{hit.group}</p>
              ) : null}
              <button
                type="button"
                data-testid={`search-hit-${hit.key}`}
                className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left hover:bg-[#e5f5f8]"
                onClick={() => {
                  dispatch({ t: "search.query", q: query.trim() });
                  setOpen(false);
                  setQuery("");
                  navigate(hit.to);
                }}
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-[#0091ae]">{hit.title}</p>
                  <p className="truncate text-[11.5px] text-[#516f90]">{hit.sub}</p>
                </div>
                <Tag tone="neutral">{hit.group.replace(/s$/, "")}</Tag>
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** HubSpot `+` Global Quick-Create button right next to Search HubSpot */
function GlobalQuickCreate() {
  const { navigate, dispatch } = useShell();
  return (
    <Menu
      width={230}
      menuTestId="global-quick-create-menu"
      button={({ toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-label="Quick create record"
          title="Create record"
          data-testid="global-quick-create"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#516f90] bg-[#253342] text-white hover:border-white/60 hover:bg-[#33475b]"
        >
          <Icon name="plus" size={15} />
        </button>
      )}
    >
      {(close) => (
        <>
          <p className="px-3.5 pb-1 pt-1 text-[10.5px] font-bold uppercase tracking-wider text-[#516f90]">Quick create</p>
          <MenuItem
            testId="quick-create-deal"
            onClick={() => {
              close();
              dispatch({ t: "ui", k: "quickCreate", v: "deal" });
              navigate("/deals");
            }}
          >
            <span className="flex items-center gap-2 font-medium">
              <Icon name="deal" size={14} className="text-[#0091ae]" /> Deal
            </span>
          </MenuItem>
          <MenuItem
            testId="quick-create-contact"
            onClick={() => {
              close();
              dispatch({ t: "ui", k: "quickCreate", v: "contact" });
              navigate("/contacts");
            }}
          >
            <span className="flex items-center gap-2 font-medium">
              <Icon name="contacts" size={14} className="text-[#0091ae]" /> Contact
            </span>
          </MenuItem>
          <MenuItem
            testId="quick-create-company"
            onClick={() => {
              close();
              navigate("/companies");
            }}
          >
            <span className="flex items-center gap-2 font-medium">
              <Icon name="company" size={14} className="text-[#0091ae]" /> Company (Search first)
            </span>
          </MenuItem>
          <MenuItem
            testId="quick-create-lead"
            onClick={() => {
              close();
              navigate("/sales-workspace");
            }}
          >
            <span className="flex items-center gap-2 font-medium">
              <Icon name="briefcase" size={14} className="text-[#0091ae]" /> Open Sales Workspace
            </span>
          </MenuItem>
        </>
      )}
    </Menu>
  );
}

function BreezeCopilotButton() {
  const { world, persona } = useShell();
  const openDeals = world.deals.filter((d) => !d.readOnly && d.ownerId === persona.id);
  const openTasks = world.tasks.filter((t) => t.status === "open" && t.ownerId === persona.id);

  return (
    <Menu
      align="right"
      width={340}
      menuTestId="breeze-copilot-panel"
      button={({ toggle }) => (
        <button
          type="button"
          onClick={toggle}
          data-testid="breeze-copilot-btn"
          className="inline-flex h-7 items-center gap-1.5 rounded-[4px] border border-[#516f90]/70 bg-[#253342] px-2.5 text-[12px] font-semibold text-white hover:bg-[#33475b]"
        >
          <Icon name="sparkle" size={13} className="text-[#ff8fb1]" />
          <span>Copilot</span>
        </button>
      )}
    >
      {() => (
        <div className="px-4 py-3 text-[12.5px]">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#33475b]">Breeze Copilot</span>
            <AiPill />
          </div>
          <p className="mt-1.5 text-[#516f90]">
            Daily brief for <strong className="text-[#33475b]">{persona.name}</strong> ({persona.division}):
          </p>
          <ul className="mt-2 space-y-1.5 rounded-[4px] border border-[#dfe3eb] bg-[#f5f8fa] p-2.5 text-[12px]">
            <li>
              • <strong>{openDeals.length}</strong> active division deals in your pipeline
            </li>
            <li>
              • <strong>{openTasks.length}</strong> open follow-up / estimating tasks assigned
            </li>
            <li>• Remember to check Cross-Division Summary before outbound outreach</li>
          </ul>
        </div>
      )}
    </Menu>
  );
}

function HelpButton() {
  return (
    <Menu
      align="right"
      width={330}
      button={({ toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-label="HubSpot Help & AMICO Quoting Guide"
          data-testid="help-menu"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#cbd6e2] hover:bg-[#2e3f50] hover:text-white"
        >
          <Icon name="help" size={17} />
        </button>
      )}
    >
      {() => (
        <div className="px-4 py-3 text-[12px] text-[#33475b]">
          <p className="text-[13px] font-semibold">AMICO HubSpot Reference</p>
          <p className="mt-1 text-[#516f90]">Quoting Decision Tree across divisions:</p>
          <ul className="mt-2 space-y-1.5 border-t border-[#eaf0f6] pt-2">
            <li>
              <strong>Commerce &gt; Quotes:</strong> Solar, Global, Groenveld-BEKA (native HubSpot quote + e-sign)
            </li>
            <li>
              <strong>Workbook Ingestion:</strong> Security Fence, Architecture, FRP (Rev 1 / Rev 2 updates Deal)
            </li>
            <li>
              <strong>CRM &gt; Epicor Quotes:</strong> Industrials, Building Products, Perforated &amp; Seasafe (read-only ERP sync)
            </li>
          </ul>
        </div>
      )}
    </Menu>
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
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-full text-[#cbd6e2] hover:bg-[#2e3f50] hover:text-white"
      >
        <Icon name="bell" size={17} />
        {unread > 0 ? (
          <span
            className="absolute -right-0.5 -top-0.5 inline-flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#ff5c35] px-1 text-[10px] font-bold text-white ring-2 ring-[#1f2a37]"
            data-testid="bell-count"
          >
            {unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div
          className="hs-pop absolute right-0 top-full z-[70] mt-1.5 w-[400px] rounded-[4px] border border-[#cbd6e2] bg-white text-[#33475b] shadow-[0_12px_32px_rgba(31,42,55,0.22)]"
          data-testid="bell-panel"
        >
          <div className="flex items-center justify-between border-b border-[#dfe3eb] bg-[#f5f8fa] px-4 py-2.5">
            <p className="text-[13.5px] font-semibold">Notifications</p>
            <Tag tone="blue">{unread} unread</Tag>
          </div>
          <div className="hs-scroll max-h-[420px] overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-[13px] text-[#516f90]">No alerts for {persona.name}.</p>
            ) : null}
            {items.map((n) => (
              <div key={n.id} className={cx("border-b border-[#eaf0f6] px-4 py-3 last:border-b-0", !n.read && "bg-[#e5f5f8]/55")}>
                <button type="button" onClick={() => openItem(n)} className="block w-full text-left" data-testid={`notif-${n.id}`}>
                  <span className="flex items-center gap-2">
                    {!n.read ? <span className="h-2 w-2 shrink-0 rounded-full bg-[#ff5c35]" /> : null}
                    <span className="text-[13px] font-semibold text-[#33475b]">{n.title}</span>
                    <span className="ml-auto shrink-0 text-[11px] text-[#516f90]">{relative(n.at)}</span>
                  </span>
                  <span className="mt-0.5 block text-[12.5px] leading-snug text-[#516f90]">{n.body}</span>
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
        "inline-flex h-8 w-8 items-center justify-center rounded-full text-[#cbd6e2] hover:bg-[#2e3f50] hover:text-white",
        active && "bg-[#33475b] text-white",
      )}
    >
      <Icon name="settings" size={17} />
    </A>
  );
}

function AccountMenu() {
  const { pack, persona, navigate } = useShell();
  return (
    <Menu
      align="right"
      width={310}
      button={({ toggle }) => (
        <button
          type="button"
          onClick={toggle}
          data-testid="account-menu"
          className="flex h-8 items-center gap-2 rounded-[4px] px-2 text-[12.5px] text-white hover:bg-[#2e3f50]"
        >
          <Avatar name={persona.name} color={persona.color} size={24} />
          <span className="max-w-[185px] truncate font-medium">AMICO · HubSpot Sandbox</span>
          <Icon name="chevronDown" size={13} className="text-[#99acc2]" />
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="flex items-center gap-3 px-3.5 pb-3 pt-2">
            <Avatar name={persona.name} color={persona.color} size={36} />
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold text-[#33475b]" data-testid="persona-name">
                {persona.name}
              </p>
              <p className="truncate text-[12px] text-[#516f90]">{persona.title}</p>
              <p className="truncate text-[11.5px] text-[#516f90]">{persona.division}</p>
            </div>
          </div>
          <div className="border-t border-[#eaf0f6] px-3.5 py-2.5">
            <p className="text-[13px] font-semibold text-[#33475b]">{pack.portal.company} · HubSpot Sandbox</p>
            <p className="text-[11.5px] text-[#516f90]">Hub ID: {pack.portal.hubId}</p>
            <p className="mt-1.5">
              <Tag tone="amber">Sandbox · Synthetic Training Data</Tag>
            </p>
          </div>
          <div className="border-t border-[#eaf0f6] py-1">
            <MenuItem
              testId="menu-profile-prefs"
              onClick={() => {
                close();
                navigate("/profile");
              }}
            >
              <span className="block font-semibold">Profile &amp; Preferences</span>
              <span className="block text-[11.5px] font-normal text-[#516f90]">
                Timezone, working hours, notifications &amp; Outlook 365
              </span>
            </MenuItem>
          </div>
          <div className="border-t border-[#eaf0f6] py-1">
            <a href="/launchpad" className="block px-3.5 py-2 text-[13px] text-[#0091ae] hover:bg-[#e5f5f8]" data-testid="exit-launchpad">
              ← Exit to Penguin Training Launchpad
            </a>
          </div>
        </>
      )}
    </Menu>
  );
}

export function Chrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#1f2a37]">
      <header
        data-testid="hubspot-top-bar"
        className="relative z-[35] flex h-11 shrink-0 items-center gap-2.5 border-b border-[#33475b] bg-[#1f2a37] px-3 text-white"
      >
        <A
          to="/deals"
          className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] hover:bg-[#2e3f50]"
          aria-label="HubSpot home"
          data-testid="hubspot-sprocket-home"
        >
          <HubSpotSprocket size={23} />
        </A>
        <Search />
        <GlobalQuickCreate />

        <div className="ml-auto flex items-center gap-1">
          <BreezeCopilotButton />
          <span className="mx-1 h-4 w-px bg-white/15" aria-hidden="true" />
          <HelpButton />
          <SettingsGear />
          <Bell />
          <span className="mx-1 h-4 w-px bg-white/15" aria-hidden="true" />
          <AccountMenu />
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="hs-scroll relative min-w-0 flex-1 overflow-y-auto bg-[#f5f8fa]" data-testid="shell-main" id="shell-main">
          {children}
        </main>
      </div>
    </div>
  );
}
