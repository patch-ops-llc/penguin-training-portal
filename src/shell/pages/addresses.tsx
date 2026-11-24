"use client";

import { useMemo } from "react";
import { useShell } from "@/store/store";
import { shortDate } from "../format";
import { Icon } from "../icons";
import { A, Card, Empty, Prop, Tag } from "../ui";
import { IndexPage, type Column, type Filter, type View } from "./index-table";

export type AmicoAddress = {
  id: string;
  addressName: string;
  addressType: "Bill-to" | "Ship-to" | "Both";
  city: string;
  street: string;
  postalCode: string;
  siteNumber: string;
  companyId: string;
  sourceSystem: "Oracle" | "Epicor";
  status: "Active" | "Inactive";
  primary?: boolean;
  createdAt: string;
};

const SYNTHETIC_ADDRESSES: AmicoAddress[] = [
  {
    id: "addr-gp-sac-ship",
    addressName: "Grading Pacific — Sacramento Ship-To",
    addressType: "Ship-to",
    city: "Sacramento",
    street: "1840 Industrial Park Dr",
    postalCode: "95834",
    siteNumber: "ORA-SITE-88421",
    companyId: "co-grading-pacific",
    sourceSystem: "Oracle",
    status: "Active",
    primary: true,
    createdAt: "@-400d",
  },
  {
    id: "addr-gp-phx-yard",
    addressName: "Grading Pacific — Phoenix Yard",
    addressType: "Ship-to",
    city: "Phoenix",
    street: "2900 W Buckeye Rd",
    postalCode: "85009",
    siteNumber: "ORA-SITE-88455",
    companyId: "co-grading-pacific-phx",
    sourceSystem: "Oracle",
    status: "Active",
    createdAt: "@-220d",
  },
  {
    id: "addr-vanguard-jobsite",
    addressName: "Vanguard Civil — Ashburn Jobsite",
    addressType: "Both",
    city: "Ashburn",
    street: "44050 Digital Loudoun Plaza",
    postalCode: "20147",
    siteNumber: "EPI-77802",
    companyId: "co-vanguard-gc",
    sourceSystem: "Epicor",
    status: "Active",
    createdAt: "@-45d",
  },
  {
    id: "addr-redstone-hq",
    addressName: "Redstone Industrial Supply — HQ Bill-To",
    addressType: "Bill-to",
    city: "Birmingham",
    street: "800 Redstone Pkwy",
    postalCode: "35209",
    siteNumber: "ORA-88412",
    companyId: "co-redstone-supply",
    sourceSystem: "Oracle",
    status: "Active",
    primary: true,
    createdAt: "@-600d",
  },
];

type AddressRow = AmicoAddress & { companyName: string };

export function AddressesIndex() {
  const { world } = useShell();

  const rows: AddressRow[] = useMemo(() => {
    return SYNTHETIC_ADDRESSES.map((a) => {
      const company = world.companies.find((c) => c.id === a.companyId);
      return { ...a, companyName: company?.name ?? "—" };
    });
  }, [world.companies]);

  const views: View<AddressRow>[] = [
    { id: "all", label: "All records", filter: () => true },
    { id: "ship", label: "Ship-to", filter: (r) => r.addressType === "Ship-to" || r.addressType === "Both" },
    { id: "bill", label: "Bill-to", filter: (r) => r.addressType === "Bill-to" || r.addressType === "Both" },
  ];

  const filters: Filter<AddressRow>[] = [
    {
      id: "type",
      label: "Address Type",
      options: [
        { value: "Ship-to", label: "Ship-to" },
        { value: "Bill-to", label: "Bill-to" },
        { value: "Both", label: "Both" },
      ],
      test: (r, v) => r.addressType === v,
    },
    {
      id: "city",
      label: "City",
      options: Array.from(new Set(rows.map((r) => r.city))).map((c) => ({ value: c, label: c })),
      test: (r, v) => r.city === v,
    },
  ];

  const columns: Column<AddressRow>[] = [
    {
      id: "name",
      label: "Address",
      sort: (r) => r.addressName,
      cell: (r) => (
        <A to={`/addresses/${r.id}`} className="hs-link font-semibold" data-testid={`address-link-${r.id}`}>
          {r.addressName}
        </A>
      ),
    },
    {
      id: "type",
      label: "Address Type",
      cell: (r) => <span className="hs-assoc-chip inline-flex rounded px-2 py-0.5 text-[12px]">{r.addressType}</span>,
    },
    { id: "city", label: "City", cell: (r) => r.city },
    { id: "street", label: "Street Address", cell: (r) => <span className="text-[12px] text-[#666666]">{r.street}</span> },
    { id: "postal", label: "Postal Code", cell: (r) => r.postalCode },
    { id: "site", label: "Site Number / ID", cell: (r) => <span className="font-mono text-[12px]">{r.siteNumber}</span> },
  ];

  return (
    <IndexPage
      title="Addresses"
      objectSwitcherLabel="Addresses"
      noun="address"
      rows={rows}
      columns={columns}
      views={views}
      filters={filters}
      searchText={(r) => `${r.addressName} ${r.city} ${r.street} ${r.siteNumber}`}
      rowKey={(r) => r.id}
      countLabel={(n) => `${n.toLocaleString()} record${n === 1 ? "" : "s"}`}
    />
  );
}

export function AddressRecord({ id }: { id: string }) {
  const { world } = useShell();
  const address = SYNTHETIC_ADDRESSES.find((a) => a.id === id);
  const company = address ? world.companies.find((c) => c.id === address.companyId) : undefined;

  if (!address) {
    return (
      <div className="p-10">
        <Card>
          <Empty title="Address not found">
            <A to="/addresses" className="hs-link">
              Back to Addresses
            </A>
          </Empty>
        </Card>
      </div>
    );
  }

  return (
    <div className="hs-record-3pane" data-testid="address-record">
      <aside className="hs-record-left hs-scroll p-4">
        <A to="/addresses" className="hs-link inline-flex items-center gap-1 text-[12.5px]">
          <Icon name="chevronLeft" size={14} /> Addresses
        </A>
        <h1 className="mt-3 text-[17px] font-bold text-[#333333]">{address.addressName}</h1>
        <div className="mt-2 flex flex-wrap gap-1">
          <Tag tone="neutral">{address.addressType}</Tag>
          {address.primary ? (
            <span className="hs-assoc-chip inline-flex rounded px-2 py-0.5 text-[12px] font-semibold">Primary</span>
          ) : null}
        </div>

        <Card title="About this Address" className="mt-4">
          <dl>
            <Prop label="Address name">{address.addressName}</Prop>
            <Prop label="Address type">{address.addressType}</Prop>
            <Prop label="Street address">{address.street}</Prop>
            <Prop label="City">{address.city}</Prop>
            <Prop label="Postal code">{address.postalCode}</Prop>
            <Prop label="Site number / ID">
              <span className="font-mono">{address.siteNumber}</span>
            </Prop>
            <Prop label="Source system">{address.sourceSystem}</Prop>
            <Prop label="Status">{address.status}</Prop>
            <Prop label="Create date">{shortDate(address.createdAt)}</Prop>
          </dl>
        </Card>
      </aside>

      <section className="hs-record-center hs-scroll bg-[#f5f8fa] p-5">
        <Card title="Data highlights">
          <div className="grid grid-cols-3 gap-3 text-center text-[13px]">
            <div>
              <p className="text-[11px] font-semibold uppercase text-[#666666]">Address Type</p>
              <p className="mt-1 font-bold text-[#333333]">{address.addressType}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase text-[#666666]">Source System</p>
              <p className="mt-1 font-bold text-[#333333]">{address.sourceSystem}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase text-[#666666]">Status</p>
              <p className="mt-1 font-bold text-[#333333]">{address.status}</p>
            </div>
          </div>
        </Card>
      </section>

      <aside className="hs-record-right hs-scroll p-4">
        <Card title={`Companies (${company ? 1 : 0})`}>
          {company ? (
            <div className="space-y-2">
              <A to={`/companies/${company.id}`} className="hs-link block text-[13px] font-semibold">
                {company.name}
              </A>
              {address.primary ? (
                <span className="hs-assoc-chip inline-flex rounded px-2 py-0.5 text-[11px]">Primary ship-to</span>
              ) : null}
              {company.erp ? (
                <p className="text-[12px] text-[#666666]">Epicor / Oracle ID: {company.erp.accountNumber}</p>
              ) : null}
            </div>
          ) : (
            <p className="text-[12px] text-[#666666]">No company association</p>
          )}
        </Card>
      </aside>
    </div>
  );
}