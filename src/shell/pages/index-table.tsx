"use client";

import { useMemo, useState } from "react";
import { Icon } from "../icons";
import { A, Button, cx, Empty, Menu, MenuItem } from "../ui";

export type Column<T> = {
  id: string;
  label: string;
  cell: (row: T) => React.ReactNode;
  sort?: (row: T) => string | number;
  align?: "right";
  width?: number;
};

export type View<T> = { id: string; label: string; filter: (row: T) => boolean };
export type Filter<T> = { id: string; label: string; options: { value: string; label: string }[]; test: (row: T, value: string) => boolean };

type Props<T> = {
  title: React.ReactNode;
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
  rowKey: (row: T) => string;
  isNew?: (row: T) => boolean;
  toolbar?: React.ReactNode;
  alternate?: (rows: T[]) => React.ReactNode;
  initialSort?: { id: string; dir: 1 | -1 };
  countLabel?: (count: number) => string;
  searchLabel?: string;
};

export function IndexPage<T>({
  title,
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
  rowKey,
  isNew,
  toolbar,
  alternate,
  initialSort,
  countLabel,
  searchLabel = `Search ${noun}s`,
}: Props<T>) {
  const [internalViewId, setInternalViewId] = useState(views[0]?.id ?? "all");
  const viewId = activeViewId && views.some((v) => v.id === activeViewId) ? activeViewId : internalViewId;
  const selectView = (id: string) => {
    setInternalViewId(id);
    onViewChange?.(id);
  };

  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{ id: string; dir: 1 | -1 } | null>(initialSort ?? null);
  const [previewKey, setPreviewKey] = useState<string | null>(null);

  const visible = useMemo(() => {
    const view = views.find((v) => v.id === viewId) ?? views[0];
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
  }, [rows, views, viewId, query, filters, picked, sort, columns, searchText]);

  const previewRow = previewKey ? rows.find((row) => rowKey(row) === previewKey) : undefined;

  return (
    <div className="flex min-h-full flex-col px-6 pb-6 pt-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold leading-tight">{title}</h1>
          <p className="mt-0.5 text-[12.5px] text-ink-muted" data-testid="index-count">
            {countLabel ? countLabel(visible.length) : `${visible.length} ${visible.length === 1 ? noun : `${noun}s`}`}
          </p>
        </div>
        {toolbar}
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-1 border-b border-line">
        {views.map((view) => (
          <button
            key={view.id}
            type="button"
            data-testid={`view-tab-${view.id}`}
            onClick={() => selectView(view.id)}
            className={cx(
              "-mb-px h-9 rounded-t-[8px] border px-4 text-[13.5px]",
              view.id === viewId ? "border-line border-b-white bg-white font-semibold" : "border-transparent text-ink-muted hover:bg-[#e6e6e6] hover:text-ink",
            )}
          >
            {view.label}
          </button>
        ))}
        {extraTabsRight ? <div className="mb-1 ml-2 flex items-center">{extraTabsRight}</div> : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-b-[10px] border border-t-0 border-line bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-line-soft px-4 py-2.5">
          <div className="relative">
            <Icon name="search" size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchLabel}
              aria-label={searchLabel}
              data-testid="index-search"
              className="h-8 w-[240px] rounded-[6px] border border-line pl-8 pr-2 text-[13px] focus:border-ink focus:outline-none"
            />
          </div>
          {filters.map((filter) => {
            const current = filter.options.find((o) => o.value === picked[filter.id]);
            return (
              <Menu
                key={filter.id}
                width={220}
                button={({ toggle }) => (
                  <button
                    type="button"
                    onClick={toggle}
                    className={cx(
                      "inline-flex h-8 items-center gap-1.5 rounded-[6px] px-2.5 text-[13px] font-semibold",
                      current ? "bg-[#e5f1f1] text-link" : "text-link hover:bg-[#eef5f5]",
                    )}
                  >
                    {filter.label}
                    {current ? `: ${current.label}` : ""} <Icon name="chevronDown" size={13} />
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
        </div>

        {alternate ? (
          alternate(visible)
        ) : visible.length === 0 ? (
          <Empty title={`No ${noun}s match`}>Clear the search or filters to see every {noun}.</Empty>
        ) : (
          <div className="hs-scroll overflow-x-auto">
            <table className="w-full border-collapse text-[13.5px]" data-testid="index-table">
              <thead>
                <tr className="border-b border-line-soft bg-[#fafafa] text-left text-[11.5px] uppercase tracking-wide text-ink-muted">
                  {columns.map((column) => (
                    <th
                      key={column.id}
                      className={cx("whitespace-nowrap px-4 py-2 font-semibold", column.align === "right" && "text-right")}
                      style={column.width ? { width: column.width } : undefined}
                    >
                      {column.sort ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-ink"
                          onClick={() =>
                            setSort((s) => (s?.id === column.id ? { id: column.id, dir: s.dir === 1 ? -1 : 1 } : { id: column.id, dir: 1 }))
                          }
                        >
                          {column.label}
                          <Icon
                            name={sort?.id === column.id ? "chevronDown" : "sort"}
                            size={12}
                            className={cx(sort?.id === column.id && sort.dir === -1 && "rotate-180", sort?.id === column.id ? "text-ink" : "opacity-50")}
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
                {visible.map((row) => {
                  const key = rowKey(row);
                  return (
                    <tr
                      key={key}
                      data-testid={`row-${key}`}
                      className={cx(
                        "group/row border-b border-line-soft last:border-b-0 hover:bg-[#f7f7f7]",
                        isNew?.(row) && "hs-row-new",
                        previewKey === key && "bg-[#f1f7f7]",
                      )}
                    >
                      {columns.map((column, i) => (
                        <td key={column.id} className={cx("px-4 py-2.5 align-middle", column.align === "right" && "text-right tabular-nums")}>
                          {i === 0 && preview ? (
                            <span className="flex items-center justify-between gap-3">
                              <span className="min-w-0">{column.cell(row)}</span>
                              <button
                                type="button"
                                onClick={() => setPreviewKey(key)}
                                data-testid={`preview-${key}`}
                                className="invisible h-7 shrink-0 rounded-[5px] border border-line bg-white px-2.5 text-[12px] font-semibold group-hover/row:visible"
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
        )}
      </div>

      {previewRow && preview ? (
        <aside
          className="hs-slide-in fixed bottom-16 right-0 top-12 z-[36] flex w-[440px] flex-col border-l border-line bg-white shadow-[-10px_0_30px_rgba(20,20,20,0.18)]"
          data-testid="preview-panel"
        >
          {preview(previewRow, () => setPreviewKey(null))}
        </aside>
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
    <>
      <header className="flex items-start justify-between gap-3 bg-nav px-5 py-4 text-white">
        <div className="min-w-0">
          <p className="truncate text-[17px] font-semibold">{title}</p>
          {subtitle ? <p className="truncate text-[12.5px] text-white/70">{subtitle}</p> : null}
        </div>
        <button type="button" onClick={onClose} aria-label="Close preview" className="rounded p-1 hover:bg-nav-hover">
          <Icon name="close" size={18} />
        </button>
      </header>
      <div className="hs-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
      <footer className="flex gap-2 border-t border-line-soft px-5 py-3">
        <A
          to={to}
          className="inline-flex h-9 items-center rounded-[6px] bg-hs-orange px-4 text-[13.5px] font-semibold text-white hover:bg-hs-orange-strong"
          data-testid="preview-view-record"
        >
          View record
        </A>
        <Button onClick={onClose}>Close</Button>
      </footer>
    </>
  );
}
