"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNav({ isPenguinAdmin }: { isPenguinAdmin: boolean }) {
  const pathname = usePathname();
  const items = [
    { href: "/admin", label: "Users & invites", exact: true },
    { href: "/knowledge", label: "Knowledge library", exact: false },
    { href: "/admin/progress", label: "Completion matrix", exact: false },
    { href: "/admin/attempts", label: "Module attempts", exact: false },
    { href: "/admin/activity", label: "Access log", exact: false },
    { href: "/admin/audit", label: "Admin audit", exact: false },
    ...(isPenguinAdmin ? [{ href: "/admin/tenants", label: "Tenants", exact: false }] : []),
  ];

  return (
    <nav className="flex flex-wrap items-center gap-1" aria-label="Admin sections">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-md px-3 py-1.5 text-[13.5px] font-medium ${
              active ? "bg-penguin-soft text-penguin" : "text-[#4a4660] hover:bg-[#f2f0fa]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
