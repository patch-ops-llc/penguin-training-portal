"use client";

import { useShell } from "@/store/store";
import { money, shortDate } from "./format";
import { Icon } from "./icons";
import { A, Avatar, Button, Card, colorFor, Drawer, Prop, statusTone, Tag } from "./ui";

export type PreviewTarget =
  | { kind: "company"; id: string }
  | { kind: "contact"; id: string }
  | { kind: "deal"; id: string }
  | { kind: "project"; id: string }
  | { kind: "epicor-quote"; id: string };

/** Parse `world.ui.preview` (`"deal:dl-ironpeak-perim"`, `"company:co-grading-pacific"`, etc.). */
export function parsePreview(raw?: string): PreviewTarget | null {
  if (!raw || !raw.includes(":")) return null;
  const idx = raw.indexOf(":");
  const kind = raw.slice(0, idx) as PreviewTarget["kind"];
  const id = raw.slice(idx + 1);
  if (!id) return null;
  if (kind === "company" || kind === "contact" || kind === "deal" || kind === "project" || kind === "epicor-quote") {
    return { kind, id };
  }
  return null;
}

export function RecordPreviewHost() {
  const { pack, world, dispatch, navigate } = useShell();
  const target = parsePreview(world.ui.preview);
  if (!target) return null;

  const close = () => dispatch({ t: "ui", k: "preview", v: "" });
  const userName = (id?: string | null) => pack.personas.find((u) => u.id === id)?.name ?? "Unassigned";

  if (target.kind === "company") {
    const company = world.companies.find((c) => c.id === target.id);
    if (!company) return null;
    const contacts = world.contacts.filter((c) => c.companyId === company.id);
    const deals = world.deals.filter((d) => !d.readOnly && (d.companyId === company.id || d.additionalCompanyIds?.includes(company.id)));

    return (
      <Drawer
        title={company.name}
        subtitle={`Company · ${company.domain || company.industry}`}
        width={460}
        onClose={close}
        testId="record-preview-drawer"
        headerRight={
          <Button
            size="xs"
            onClick={() => {
              close();
              navigate(`/companies/${company.id}`);
            }}
            data-testid="preview-open-record"
          >
            Open record <Icon name="external" size={12} />
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-[4px] border border-[#dfe3eb] bg-[#f5f8fa] p-3">
            <Avatar name={company.name} color={colorFor(company.id)} size={38} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14.5px] font-semibold text-[#33475b]">{company.name}</p>
              <p className="text-[12px] text-[#516f90]">
                {company.city}, {company.state} · {company.industry}
              </p>
            </div>
            <Tag tone="blue">{company.crossDivision?.primaryDivision ?? "Account"}</Tag>
          </div>

          <Card title="About this company">
            <dl>
              <Prop label="Company domain name">{company.domain}</Prop>
              <Prop label="Phone number">{company.phone}</Prop>
              <Prop label="Primary AMICO Division">{company.crossDivision?.primaryDivision ?? "—"}</Prop>
              <Prop label="Company owner">{userName(company.ownerId)}</Prop>
              <Prop label="Epicor Customer ID">{company.erp?.accountNumber ?? "—"}</Prop>
              <Prop label="Credit status">
                {company.erp ? <Tag tone={statusTone(company.erp.creditStatus)}>{company.erp.creditStatus}</Tag> : "—"}
              </Prop>
            </dl>
          </Card>

          <Card title={`Contacts (${contacts.length})`}>
            {contacts.length === 0 ? <p className="text-[12.5px] text-[#516f90]">No associated contacts.</p> : null}
            <ul className="divide-y divide-[#eaf0f6]">
              {contacts.map((ct) => (
                <li key={ct.id} className="flex items-center justify-between py-2 text-[13px]">
                  <div>
                    <A to={`/contacts/${ct.id}`} onClick={close} className="hs-link">
                      {ct.firstName} {ct.lastName}
                    </A>
                    <p className="text-[11.5px] text-[#516f90]">{ct.title} · {ct.email}</p>
                  </div>
                  <Tag tone="neutral">Primary</Tag>
                </li>
              ))}
            </ul>
          </Card>

          <Card title={`Deals (${deals.length})`}>
            {deals.length === 0 ? <p className="text-[12.5px] text-[#516f90]">No active division deals.</p> : null}
            <ul className="divide-y divide-[#eaf0f6]">
              {deals.map((dl) => (
                <li key={dl.id} className="flex items-center justify-between py-2 text-[13px]">
                  <div>
                    <A to={`/deals/${dl.id}`} onClick={close} className="hs-link">
                      {dl.name}
                    </A>
                    <p className="text-[11.5px] text-[#516f90]">{dl.division} · Close {shortDate(dl.closeDate)}</p>
                  </div>
                  <span className="font-semibold tabular-nums">{money(dl.amount)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Drawer>
    );
  }

  if (target.kind === "contact") {
    const contact = world.contacts.find((c) => c.id === target.id);
    if (!contact) return null;
    const company = world.companies.find((c) => c.id === contact.companyId);
    const deals = world.deals.filter((d) => !d.readOnly && d.contactIds.includes(contact.id));

    return (
      <Drawer
        title={`${contact.firstName} ${contact.lastName}`}
        subtitle={`Contact · ${contact.title}`}
        width={460}
        onClose={close}
        testId="record-preview-drawer"
        headerRight={
          <Button
            size="xs"
            onClick={() => {
              close();
              navigate(`/contacts/${contact.id}`);
            }}
            data-testid="preview-open-record"
          >
            Open record <Icon name="external" size={12} />
          </Button>
        }
      >
        <div className="space-y-4">
          <Card title="About this contact">
            <dl>
              <Prop label="Email">{contact.email}</Prop>
              <Prop label="Phone number">{contact.phone}</Prop>
              <Prop label="Job title">{contact.title}</Prop>
              <Prop label="Lifecycle stage">{contact.lifecycle}</Prop>
              <Prop label="Lead status">{contact.leadStatus}</Prop>
              <Prop label="Contact owner">{userName(contact.ownerId)}</Prop>
            </dl>
          </Card>

          <Card title="Primary Company">
            {company ? (
              <div className="flex items-center justify-between text-[13px]">
                <A to={`/companies/${company.id}`} onClick={close} className="hs-link">
                  {company.name}
                </A>
                <Tag tone="blue">Primary</Tag>
              </div>
            ) : (
              <p className="text-[12.5px] text-[#516f90]">No company associated.</p>
            )}
          </Card>

          <Card title={`Deals (${deals.length})`}>
            {deals.length === 0 ? <p className="text-[12.5px] text-[#516f90]">No associated deals.</p> : null}
            <ul className="divide-y divide-[#eaf0f6]">
              {deals.map((dl) => (
                <li key={dl.id} className="flex items-center justify-between py-2 text-[13px]">
                  <A to={`/deals/${dl.id}`} onClick={close} className="hs-link">
                    {dl.name}
                  </A>
                  <span className="font-semibold tabular-nums">{money(dl.amount)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Drawer>
    );
  }

  if (target.kind === "deal") {
    const deal = world.deals.find((d) => d.id === target.id);
    if (!deal) return null;
    const pipeline = pack.pipelines.find((p) => p.id === deal.pipelineId) ?? pack.pipelines[0];
    const stageLabel = pipeline.stages.find((s) => s.id === deal.stage)?.label ?? deal.stage;
    const company = world.companies.find((c) => c.id === deal.companyId);
    const contacts = world.contacts.filter((c) => deal.contactIds.includes(c.id));

    return (
      <Drawer
        title={deal.name}
        subtitle={`${pipeline.name} · ${stageLabel}`}
        width={480}
        onClose={close}
        testId="record-preview-drawer"
        headerRight={
          <Button
            size="xs"
            onClick={() => {
              close();
              navigate(`/deals/${deal.id}`);
            }}
            data-testid="preview-open-record"
          >
            Open record <Icon name="external" size={12} />
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 rounded-[4px] border border-[#dfe3eb] bg-[#f5f8fa] p-3 text-center">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#516f90]">Amount</p>
              <p className="mt-0.5 text-[15px] font-semibold tabular-nums text-[#33475b]">{money(deal.amount)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#516f90]">Stage</p>
              <p className="mt-0.5 truncate text-[12.5px] font-semibold text-[#006162]">{stageLabel}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#516f90]">Close date</p>
              <p className="mt-0.5 text-[12.5px] font-semibold text-[#33475b]">{shortDate(deal.closeDate)}</p>
            </div>
          </div>

          <Card title="About this deal">
            <dl>
              <Prop label="Pipeline">{pipeline.name}</Prop>
              <Prop label="Division">{deal.division}</Prop>
              <Prop label="Deal owner">{userName(deal.ownerId)}</Prop>
              {deal.estimatorOwnerId ? <Prop label="Estimator">{userName(deal.estimatorOwnerId)}</Prop> : null}
              {deal.bidDate ? <Prop label="Bid date">{shortDate(deal.bidDate)}</Prop> : null}
              {deal.quoteNumber ? (
                <Prop label="Active Quote">
                  {deal.quoteNumber} {deal.quoteRevision ? `(${deal.quoteRevision})` : ""}
                </Prop>
              ) : null}
            </dl>
          </Card>

          <Card title="Associated Companies & Contacts">
            {company ? (
              <div className="flex items-center justify-between border-b border-[#eaf0f6] pb-2 text-[13px]">
                <A to={`/companies/${company.id}`} onClick={close} className="hs-link">
                  {company.name}
                </A>
                <Tag tone="blue">Primary Company</Tag>
              </div>
            ) : null}
            <ul className="mt-2 space-y-1.5">
              {contacts.map((ct) => (
                <li key={ct.id} className="flex items-center justify-between text-[13px]">
                  <A to={`/contacts/${ct.id}`} onClick={close} className="hs-link">
                    {ct.firstName} {ct.lastName}
                  </A>
                  <span className="text-[11.5px] text-[#516f90]">{ct.title}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Drawer>
    );
  }

  if (target.kind === "project") {
    const project = world.projects.find((p) => p.id === target.id);
    if (!project) return null;
    return (
      <Drawer
        title={`${project.code}: ${project.name}`}
        subtitle={`Project · ${project.status}`}
        width={460}
        onClose={close}
        testId="record-preview-drawer"
        headerRight={
          <Button
            size="xs"
            onClick={() => {
              close();
              navigate(`/projects/${project.id}`);
            }}
          >
            Open record <Icon name="external" size={12} />
          </Button>
        }
      >
        <Card title="About this project">
          <dl>
            <Prop label="Project code">{project.code}</Prop>
            <Prop label="Status">{project.status}</Prop>
            <Prop label="Project Manager">{userName(project.ownerId)}</Prop>
            <Prop label="Target due date">{shortDate(project.targetDueDate)}</Prop>
          </dl>
        </Card>
      </Drawer>
    );
  }

  const eq = world.epicorQuotes.find((q) => q.id === target.id);
  if (!eq) return null;
  return (
    <Drawer
      title={`${eq.quoteNumber}: ${eq.title}`}
      subtitle={`Epicor Quote · ${eq.sourceSystem}`}
      width={460}
      onClose={close}
      testId="record-preview-drawer"
      headerRight={
        <Button
          size="xs"
          onClick={() => {
            close();
            navigate(`/epicor-quotes/${eq.id}`);
          }}
        >
          Open record <Icon name="external" size={12} />
        </Button>
      }
    >
      <Card title="Epicor ERP Quote Summary">
        <dl>
          <Prop label="Quote Total">{money(eq.total)}</Prop>
          <Prop label="Status">{eq.status}</Prop>
          <Prop label="Division">{eq.division}</Prop>
          <Prop label="Epicor Customer ID">{eq.epicorCustomerId}</Prop>
          <Prop label="Customer PO #">{eq.customerPo || "—"}</Prop>
        </dl>
      </Card>
    </Drawer>
  );
}
