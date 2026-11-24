"use client";

import { useMemo, useState } from "react";
import { useShell } from "@/store/store";
import { Icon } from "../icons";
import { A, Button, cx, Drawer, Empty, Menu, MenuItem, Tag } from "../ui";

export type Column<T> = {
  id: string;
  label: string;
  cell: (row: T) => React.ReactNode;
  sort?: (row: T) => string | number;
  align?: "right";
  width?: number;
};

export type View<T> = { id: string; label: string; filter: (row: T) => boolean; closable?: boolean };
export type Filter<T> = {
  id: string;
  label: string;
  options: { value: string; label: string }[];
  test: (row: T, value: string) => boolean;
};

const OBJECT_SWITCHER_ITEMS = [
  { label: "Contacts", to: "/contacts" },
  { label: "Companies", to: "/companies" },
  { label: "Deals", to: "/deals" },
  { label: "Tickets", to: "/tickets" },
  { label: "Leads", to: "/leads" },
  { label: "Epicor Quotes", to: "/epicor-quotes" },
  { label: "Projects", to: "/projects" },
  { label: "Quotes", to: "/quotes" },
];

type Props<T> = {
  title: React.ReactNode;
  objectSwitcherLabel?: string;
  noun: string;
  rows: T[];
  columns: Column<T>[];
  views: View<T>[];
  activeViewId?: string;
  onViewChange?: (id: string) => void;
  extraTabsRight?: React.ReactNode;
  filters?: Filter<T>[];
  searchText: (row: T) => string;
  preview?: (row: T, close: () => void) => React.ReactNode;
  onPreviewRow?: (row: T) => void;
  rowKey: (row: T) => string;
  isNew?: (row: T) => boolean;
  /** Top-right object actions (e.g. Import, Edit columns, Create deal). */
  headerActions?: React.ReactNode;
  /** Controls inside the table toolbar row (e.g. List/Board toggle + Pipeline picker). */
  toolbar?: React.ReactNode;
  alternate?: (rows: T[]) => React.ReactNode;
  initialSort?: { id: string; dir: 1 | -1 };
  countLabel?: (count: number) => string;
  searchLabel?: string;
};

function pluralizeNoun(noun: string) {
  return noun.endsWith("y") ? `${noun.slice(0, -1)}ies` : `${noun}s`;
}

export function IndexPage<T>({
  title,
  objectSwitcherLabel,
  noun,
  rows,
  columns,
  views,
  activeViewId,
  onViewChange,
  extraTabsRight,
  filters = [],
  searchText,
  preview,
  onPreviewRow,
  rowKey,
  isNew,
  headerActions,
  toolbar,
  alternate,
  initialSort,
  countLabel,
  searchLabel = `Search ${pluralizeNoun(noun)}`,
}: Props<T>) {
  const { navigate } = useShell();
  const [internalViewId, setInternalViewId] = useState(views[0]?.id ?? "all");
  const [closedTabIds, setClosedTabIds] = useState<string[]>([]);
  const openViews = views.filter((v, idx) => idx === 0 || !closedTabIds.includes(v.id));
  const viewId = activeViewId && openViews.some((v) => v.id === activeViewId) ? activeViewId : internalViewId;

  const selectView = (id: string) => {
    setInternalViewId(id);
    onViewChange?.(id);
  };

  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [dateRecency, setDateRecency] = useState<string>("");
  const [sort, setSort] = useState<{ id: string; dir: 1 | -1 } | null>(initialSort ?? null);
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Record<string, boolean>>({});
  const [pageSize, setPageSize] = useState(25);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const visible = useMemo(() => {
    const view = openViews.find((v) => v.id === viewId) ?? openViews[0] ?? views[0];
    const q = query.trim().toLowerCase();
    let out = rows.filter(
      (row) =>
        (view ? view.filter(row) : true) &&
        (!q || searchText(row).toLowerCase().includes(q)) &&
        filters.every((f) => !picked[f.id] || f.test(row, picked[f.id])),
    );
    const column = sort ? columns.find((c) => c.id === sort.id) : undefined;
    if (column?.sort && sort) {
      const value = column.sort;
      out = [...out].sort((a, b) => {
        const x = value(a);
        const y = value(b);
        return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y))) * sort.dir;
      });
    }
    return out;
  }, [rows, openViews, views, viewId, query, filters, picked, sort, columns, searchText]);

  const paged = visible.slice(0, pageSize);
  const previewRow = previewKey ? rows.find((row) => rowKey(row) === previewKey) : undefined;
  const selectedCount = Object.values(selectedKeys).filter(Boolean).length;
  const allChecked = paged.length > 0 && paged.every((r) => selectedKeys[rowKey(r)]);

  const toggleAll = () => {
    if (allChecked) {
      setSelectedKeys({});
    } else {
      const next: Record<string, boolean> = {};
      for (const r of paged) next[rowKey(r)] = true;
      setSelectedKeys(next);
    }
  };

  const hasPreview = Boolean(preview || onPreviewRow);

  return (
    <div className="flex min-h-full flex-col bg-white">
      {/* 1. HubSpot Object Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#dfe3eb] bg-white px-6 py-3.5">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            {objectSwitcherLabel ? (
              <Menu
                width={210}
                menuTestId="object-switcher-menu"
                button={({ toggle }) => (
                  <button
                    type="button"
                    onClick={toggle}
                    data-testid="object-switcher"
                    className="hs-heading inline-flex items-center gap-1.5 rounded-[3px] px-1 py-0.5 text-[20px] font-bold text-[#0091ae] hover:bg-[#e5f5f8]"
                  >
                    <span>{objectSwitcherLabel}</span>
                    <Icon name="chevronDown" size={16} className="text-[#0091ae]" />
                  </button>
                )}
              >
                {(close) => (
                  <>
                    <p className="px-3.5 pb-1 pt-1 text-[10.5px] font-bold uppercase tracking-wider text-[#516f90]">
                      CRM Objects
                    </p>
                    {OBJECT_SWITCHER_ITEMS.map((item) => (
                      <MenuItem
                        key={item.to}
                        active={item.label === objectSwitcherLabel}
                        onClick={() => {
                          close();
                          navigate(item.to);
                        }}
                      >
                        {item.label}
                      </MenuItem>
                    ))}
                  </>
                )}
              </Menu>
            ) : null}
            {typeof title === "string" && objectSwitcherLabel ? null : (
              <div className="hs-heading text-[20px] font-bold leading-tight text-[#33475b]">{title}</div>
            )}
          </div>
          <p className="mt-0.5 text-[12px] font-medium text-[#516f90]" data-testid="index-count">
            {countLabel ? countLabel(visible.length) : `${visible.length} record${visible.length === 1 ? "" : "s"}`}
            {dateRecency ? ` · Filtered: ${dateRecency}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {headerActions ?? toolbar}
        </div>
      </div>

      {/* 2. Saved View Tabs Bar */}
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-[#dfe3eb] bg-[#f5f8fa] px-6 pt-2" data-testid="saved-views-bar">
        <div className="flex flex-wrap items-end">
          {openViews.map((view, idx) => {
            const active = view.id === viewId;
            const canClose = view.closable ?? idx > 0;
            return (
              <div
                key={view.id}
                className={cx(
                  "group relative -mb-px flex h-9 items-center border-r border-t border-[#dfe3eb] first:border-l",
                  active
                    ? "border-b-white bg-white font-semibold text-[#33475b] before:absolute before:inset-x-0 before:top-0 before:h-[2.5px] before:bg-[#33475b]"
                    : "border-b-[#dfe3eb] bg-[#eaf0f6]/65 text-[#516f90] hover:bg-[#eaf0f6] hover:text-[#33475b]",
                )}
              >
                <button
                  type="button"
                  data-testid={`view-tab-${view.id}`}
                  onClick={() => selectView(view.id)}
                  className="inline-flex h-full items-center px-3.5 text-[12.5px]"
                >
                  {view.label}
                </button>
                {canClose ? (
                  <button
                    type="button"
                    aria-label={`Close ${view.label} tab`}
                    onClick={() => {
                      setClosedTabIds((prev) => [...prev, view.id]);
                      if (active && openViews[0]) selectView(openViews[0].id);
                    }}
                    className="-ml-1.5 mr-2 rounded p-0.5 text-[#7c98b6] opacity-70 hover:bg-[#dfe3eb] hover:text-[#33475b] hover:opacity-100"
                  >
                    <Icon name="close" size={11} />
                  </button>
                ) : null}
              </div>
            );
          })}
          {extraTabsRight ? <div className="mb-1 ml-2 flex items-center gap-1">{extraTabsRight}</div> : null}
          {closedTabIds.length > 0 ? (
            <button
              type="button"
              onClick={() => setClosedTabIds([])}
              className="mb-1 ml-2 text-[12px] font-semibold text-[#0091ae] hover:underline"
            >
              All views ({views.length})
            </button>
          ) : (
            <span className="mb-1.5 ml-3 text-[12px] font-medium text-[#0091ae]">All views</span>
          )}
        </div>
      </div>

      {/* 3. HubSpot Quick Filter Strip */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eaf0f6] bg-white px-6 py-2"
        data-testid="quick-filter-strip"
      >
        <div className="flex flex-wrap items-center gap-1">
          {filters.map((filter) => {
            const current = filter.options.find((o) => o.value === picked[filter.id]);
            return (
              <Menu
                key={filter.id}
                width={230}
                button={({ toggle }) => (
                  <button type="button" onClick={toggle} className="hs-filter-pill" data-active={Boolean(current)}>
                    <span>
                      {filter.label}
                      {current ? `: ${current.label}` : ""}
                    </span>
                    <Icon name="chevronDown" size={12} />
                  </button>
                )}
              >
                {(close) => (
                  <>
                    <MenuItem
                      active={!current}
                      onClick={() => {
                        setPicked((p) => ({ ...p, [filter.id]: "" }));
                        close();
                      }}
                    >
                      All
                    </MenuItem>
                    {filter.options.map((o) => (
                      <MenuItem
                        key={o.value}
                        active={o.value === current?.value}
                        onClick={() => {
                          setPicked((p) => ({ ...p, [filter.id]: o.value }));
                          close();
                        }}
                      >
                        {o.label}
                      </MenuItem>
                    ))}
                  </>
                )}
              </Menu>
            );
          })}

          {/* Standard HubSpot Date Quick Filters */}
          <Menu
            width={200}
            button={({ toggle }) => (
              <button type="button" onClick={toggle} className="hs-filter-pill" data-active={dateRecency.startsWith("Create")}>
                <span>Create date</span>
                <Icon name="chevronDown" size={12} />
              </button>
            )}
          >
            {(close) => (
              <>
                <MenuItem active={!dateRecency} onClick={() => { setDateRecency(""); close(); }}>All time</MenuItem>
                <MenuItem onClick={() => { setDateRecency("Create: This quarter"); close(); }}>This quarter</MenuItem>
                <MenuItem onClick={() => { setDateRecency("Create: Last 30 days"); close(); }}>Last 30 days</MenuItem>
              </>
            )}
          </Menu>

          <Menu
            width={210}
            button={({ toggle }) => (
              <button type="button" onClick={toggle} className="hs-filter-pill" data-active={dateRecency.startsWith("Activity")}>
                <span>Last activity date</span>
                <Icon name="chevronDown" size={12} />
              </button>
            )}
          >
            {(close) => (
              <>
                <MenuItem active={!dateRecency} onClick={() => { setDateRecency(""); close(); }}>Any time</MenuItem>
                <MenuItem onClick={() => { setDateRecency("Activity: Last 7 days"); close(); }}>Last 7 days</MenuItem>
                <MenuItem onClick={() => { setDateRecency("Activity: > 14 days ago"); close(); }}>More than 14 days ago</MenuItem>
              </>
            )}
          </Menu>

          <button type="button" onClick={() => setAdvancedOpen(true)} className="hs-filter-pill">
            <Icon name="plus" size={12} /> More
          </button>

          <span className="mx-1 h-4 w-px bg-[#dfe3eb]" aria-hidden="true" />

          <button
            type="button"
            onClick={() => setAdvancedOpen(true)}
            data-testid="advanced-filters-btn"
            className="hs-filter-pill"
          >
            <Icon name="filter" size={12} /> Advanced filters
          </button>
        </div>

        <div className="flex items-center gap-2">
          {savedNotice ? <Tag tone="green">View saved</Tag> : null}
          <Button
            size="xs"
            icon="download"
            onClick={() => {
              setSavedNotice(true);
              setTimeout(() => setSavedNotice(false), 1800);
            }}
          >
            Export
          </Button>
          <Button
            size="xs"
            onClick={() => {
              setSavedNotice(true);
              setTimeout(() => setSavedNotice(false), 1800);
            }}
          >
            Save view
          </Button>
        </div>
      </div>

      {/* 4. Table Action Toolbar (In-Table Search + List/Board + Pipeline Picker) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dfe3eb] bg-[#f5f8fa] px-6 py-2.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Icon name="search" size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#516f90]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchLabel}
              aria-label={searchLabel}
              data-testid="index-search"
              className="hs-input !h-8 w-[250px] !bg-white !pl-8 !pr-3"
            />
          </div>
          {headerActions && toolbar ? toolbar : null}
          {selectedCount > 0 ? (
            <div className="flex items-center gap-2 rounded-[3px] border border-[#99d6e2] bg-[#e5f5f8] px-2.5 py-1 text-[12px] font-medium text-[#00677d]">
              <span>{selectedCount} selected</span>
              <button type="button" onClick={() => setSelectedKeys({})} className="font-semibold underline">
                Clear
              </button>
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2 text-[12px] text-[#516f90]">
          <span>Edit columns ({columns.length})</span>
        </div>
      </div>

      {/* 5. Main Content: Kanban Board OR Dense Bordered HubSpot Data Grid */}
      <div className="flex min-h-0 flex-1 flex-col bg-[#f5f8fa]">
        {alternate ? (
          alternate(visible)
        ) : visible.length === 0 ? (
          <div className="m-6 rounded-[4px] border border-[#dfe3eb] bg-white">
            <Empty title={`No ${pluralizeNoun(noun)} match current filters`}>
              Clear the search query or filter pills above to display every {noun} in this view.
            </Empty>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col px-6 py-4">
            <div className="hs-grid-wrap hs-scroll overflow-x-auto">
              <table className="hs-grid" data-testid="index-table">
                <thead>
                  <tr>
                    <th className="hs-sticky-check">
                      <input
                        type="checkbox"
                        aria-label="Select all rows"
                        checked={allChecked}
                        onChange={toggleAll}
                        className="accent-[#0091ae]"
                      />
                    </th>
                    {columns.map((column, idx) => (
                      <th
                        key={column.id}
                        className={cx(
                          idx === 0 && "hs-sticky-name",
                          column.align === "right" && "!text-right",
                        )}
                        style={column.width ? { width: column.width } : undefined}
                      >
                        {column.sort ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 uppercase tracking-wider hover:text-[#33475b]"
                            onClick={() =>
                              setSort((s) =>
                                s?.id === column.id ? { id: column.id, dir: s.dir === 1 ? -1 : 1 } : { id: column.id, dir: 1 },
                              )
                            }
                          >
                            <span>{column.label}</span>
                            <Icon
                              name={sort?.id === column.id ? "chevronDown" : "sort"}
                              size={12}
                              className={cx(
                                sort?.id === column.id && sort.dir === -1 && "rotate-180",
                                sort?.id === column.id ? "text-[#0091ae]" : "opacity-55",
                              )}
                            />
                          </button>
                        ) : (
                          column.label
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((row) => {
                    const key = rowKey(row);
                    const checked = Boolean(selectedKeys[key]);
                    return (
                      <tr
                        key={key}
                        data-testid={`row-${key}`}
                        data-selected={checked || previewKey === key}
                        className={cx(isNew?.(row) && "hs-row-new")}
                      >
                        <td className="hs-sticky-check">
                          <input
                            type="checkbox"
                            aria-label={`Select row ${key}`}
                            checked={checked}
                            onChange={(e) => setSelectedKeys((prev) => ({ ...prev, [key]: e.target.checked }))}
                            className="accent-[#0091ae]"
                          />
                        </td>
                        {columns.map((column, i) => (
                          <td
                            key={column.id}
                            className={cx(
                              i === 0 && "hs-sticky-name",
                              column.align === "right" && "text-right tabular-nums",
                            )}
                          >
                            {i === 0 && hasPreview ? (
                              <span className="flex items-center justify-between gap-3">
                                <span className="min-w-0">{column.cell(row)}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onPreviewRow) onPreviewRow(row);
                                    else setPreviewKey(key);
                                  }}
                                  data-testid={`preview-${key}`}
                                  className="hs-preview-btn shrink-0"
                                >
                                  Preview
                                </button>
                              </span>
                            ) : (
                              column.cell(row)
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* HubSpot Pagination Footer */}
            <div
              className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[12.5px] text-[#516f90]"
              data-testid="index-pagination"
            >
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled
                  className="inline-flex h-7 items-center gap-1 rounded-[3px] border border-[#dfe3eb] bg-white px-2 text-[#7c98b6]"
                >
                  <Icon name="chevronLeft" size={13} /> Prev
                </button>
                <span className="inline-flex h-7 items-center rounded-[3px] border border-[#0091ae] bg-[#e5f5f8] px-2.5 font-semibold text-[#00677d]">
                  1
                </span>
                <button
                  type="button"
                  disabled={visible.length <= pageSize}
                  className="inline-flex h-7 items-center gap-1 rounded-[3px] border border-[#dfe3eb] bg-white px-2 text-[#7c98b6]"
                >
                  Next <Icon name="chevronRight" size={13} />
                </button>
                <span className="ml-2">
                  1 - {Math.min(visible.length, pageSize)} of {visible.length}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <select
                  aria-label="Records per page"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="hs-input !h-7 !bg-white !px-2 !text-[12px] font-semibold text-[#0091ae]"
                >
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legacy custom preview drawer fallback */}
      {previewRow && preview ? (
        <Drawer
          title="Record Preview"
          width={450}
          onClose={() => setPreviewKey(null)}
          testId="preview-panel"
        >
          {preview(previewRow, () => setPreviewKey(null))}
        </Drawer>
      ) : null}

      {/* Advanced Filters Slide-Over Drawer */}
      {advancedOpen ? (
        <Drawer
          title="Advanced filters"
          subtitle={`Filter ${noun} properties with AND / OR groups`}
          width={420}
          onClose={() => setAdvancedOpen(false)}
          testId="advanced-filters-drawer"
          footer={<Button variant="primary" size="sm" onClick={() => setAdvancedOpen(false)}>Apply filters</Button>}
        >
          <div className="space-y-3 text-[13px]">
            <div className="rounded-[4px] border border-[#dfe3eb] bg-[#f5f8fa] p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#516f90]">Group 1 (AND)</p>
              <p className="mt-1.5 font-medium text-[#33475b]">
                {filters.length > 0
                  ? filters.map((f) => `${f.label}: ${picked[f.id] || "is known"}`).join(" AND ")
                  : `All active ${noun} records in portal`}
              </p>
            </div>
            <Button size="sm" icon="plus" onClick={() => setAdvancedOpen(false)}>
              Add filter condition
            </Button>
          </div>
        </Drawer>
      ) : null}
    </div>
  );
}

export function PreviewShell({
  title,
  subtitle,
  to,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  to: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[16px] font-semibold text-[#33475b]">{title}</p>
        {subtitle ? <p className="text-[12.5px] text-[#516f90]">{subtitle}</p> : null}
      </div>
      <div>{children}</div>
      <div className="flex items-center gap-2 border-t border-[#dfe3eb] pt-3">
        <A
          to={to}
          onClick={onClose}
          className="inline-flex h-8 items-center rounded-[3px] bg-[#ff5c35] px-3.5 text-[12.5px] font-semibold text-white hover:bg-[#e84b27]"
          data-testid="preview-view-record"
        >
          Open full record
        </A>
        <Button size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
