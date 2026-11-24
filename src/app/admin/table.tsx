import type { ReactNode } from "react";

/**
 * One column of an admin table. A width in pixels is fixed; columns without one share whatever
 * width is left, so the table always fills its card and no column is squeezed by its neighbors.
 */
export type AdminColumn = { label: string; width?: number; wrapLabel?: boolean };

/** Every body cell: same padding and top alignment, so a one-line cell lines up with the first line of a taller one. */
export const cell = "px-3 py-3 align-top first:pl-4 last:pr-4";
/** Dates, counts, and other values that must stay on one line. */
export const cellNoWrap = `${cell} whitespace-nowrap tabular-nums`;
export const muted = "text-[#5f5b73]";

/**
 * The shared frame for the admin tables. Widths come from `columns`, not from the content, so a
 * long value wraps or is shortened inside its own cell. Below `minWidth` the table scrolls inside
 * its card instead of pushing the page sideways.
 */
export function AdminTable({ columns, minWidth, testId, children }: { columns: AdminColumn[]; minWidth: number; testId?: string; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed text-left text-[13px] leading-[1.45]" style={{ minWidth }} data-testid={testId}>
        <colgroup>
          {columns.map((column) => (
            <col key={column.label} style={column.width ? { width: column.width } : undefined} />
          ))}
        </colgroup>
        <thead className="bg-[#faf9fd] text-[11.5px] uppercase tracking-wide text-[#5f5b73]">
          <tr>
            {columns.map((column) => (
              <th key={column.label} className={`px-3 py-2.5 align-bottom font-semibold first:pl-4 last:pr-4 ${column.wrapLabel ? "" : "whitespace-nowrap"}`}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

/** One line that ends in an ellipsis when it is too long, with the full value on hover. For emails and addresses, where a wrap would break the value in two. */
export function Clip({ children, className }: { children: string; className?: string }) {
  return (
    <span className={`block truncate ${className ?? ""}`} title={children}>
      {children}
    </span>
  );
}

const PILL_TONES = {
  green: "bg-[#e5f5ec] text-[#11603a]",
  amber: "bg-[#fff4d9] text-[#7a5200]",
  gray: "bg-[#ececf1] text-[#55516b]",
};

export function Pill({ tone, children }: { tone: keyof typeof PILL_TONES; children: ReactNode }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-semibold leading-[1.5] ${PILL_TONES[tone]}`}>{children}</span>;
}

export function EmptyRow({ columns, children }: { columns: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={columns} className="px-4 py-8 text-center text-[#5f5b73]">
        {children}
      </td>
    </tr>
  );
}
