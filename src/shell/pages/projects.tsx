"use client";

import { useState } from "react";
import { nowMs } from "@/lib/format";
import { useSeen, useShell } from "@/store/store";
import type { Project } from "@/tenants/types";
import { Ext } from "../ext";
import { date } from "../format";
import { Icon } from "../icons";
import { A, Avatar, Button, Card, cx, Empty, LineTabs, Prop, Tag } from "../ui";
import { IndexPage, PreviewShell, type Column, type View } from "./index-table";

function statusTagTone(status: Project["status"]) {
  if (status === "On Track" || status === "Completed") return "green" as const;
  if (status === "Blocked") return "red" as const;
  return "neutral" as const;
}

export function ProjectsIndex() {
  const { pack, world, persona, dispatch } = useShell();
  const [pipelineId, setPipelineId] = useState<"project-pipeline" | "delivery-board">("project-pipeline");
  const [board, setBoard] = useState(false);

  const pipeline = pack.projectPipelines.find((p) => p.id === pipelineId) ?? pack.projectPipelines[0];
  const canEdit =
    persona.permissionSet === "project-manager" ||
    persona.permissionSet === "sales-manager" ||
    persona.permissionSet === "executive";

  const views: View<Project>[] = [
    { id: "all", label: "All projects", filter: () => true },
    { id: "mine", label: "My projects", filter: (p) => p.ownerId === persona.id },
    { id: "blocked", label: "Blocked", filter: (p) => p.status === "Blocked" },
    { id: "ontrack", label: "On track", filter: (p) => p.status === "On Track" },
  ];

  const columns: Column<Project>[] = [
    {
      id: "name",
      label: "Project Name",
      sort: (p) => p.name,
      cell: (p) => (
        <A to={`/projects/${p.id}`} className="hs-link font-semibold" data-testid={`project-link-${p.id}`}>
          {p.code} · {p.name}
        </A>
      ),
    },
    {
      id: "status",
      label: "Health Status",
      cell: (p) => <Tag tone={statusTagTone(p.status)}>{p.status}</Tag>,
    },
    {
      id: "stage",
      label: pipelineId === "project-pipeline" ? "Project Stage" : "Delivery Stage",
      cell: (p) => {
        const sid = pipelineId === "project-pipeline" ? p.stage : p.deliveryStage;
        return pipeline?.stages.find((s) => s.id === sid)?.label ?? sid;
      },
    },
    {
      id: "company",
      label: "Company",
      cell: (p) => world.companies.find((c) => c.id === p.companyId)?.name ?? "—",
    },
    {
      id: "owner",
      label: "Project Manager",
      cell: (p) => pack.personas.find((x) => x.id === p.ownerId)?.name ?? p.ownerId,
    },
    {
      id: "tasks",
      label: "Project Plan",
      cell: (p) => {
        const all = p.phases.flatMap((ph) => ph.tasks);
        const done = all.filter((t) => t.done).length;
        const late = all.filter((t) => !t.done && t.late).length;
        return (
          <span className="inline-flex items-center gap-2 text-[12.5px] tabular-nums">
            <span>
              {done}/{all.length} tasks
            </span>
            {late > 0 ? <Tag tone="red">{late} late</Tag> : null}
          </span>
        );
      },
    },
    { id: "due", label: "Target Delivery", cell: (p) => date(p.targetDueDate) },
  ];

  return (
    <IndexPage
      title="Projects · Post-Award Delivery"
      noun="project"
      rows={world.projects}
      columns={columns}
      views={views}
      rowKey={(p) => p.id}
      searchText={(p) => `${p.code} ${p.name} ${p.status}`}
      toolbar={
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={pipelineId}
            onChange={(e) => setPipelineId(e.target.value as "project-pipeline" | "delivery-board")}
            data-testid="project-pipeline-select"
            className="h-9 rounded-[6px] border border-line bg-white px-3 text-[13.5px] font-semibold"
          >
            {pack.projectPipelines.map((pl) => (
              <option key={pl.id} value={pl.id}>
                {pl.name}
              </option>
            ))}
          </select>
          <div className="inline-flex overflow-hidden rounded-[6px] border border-line bg-white">
            <button
              type="button"
              onClick={() => setBoard(false)}
              data-testid="projects-layout-table"
              className={cx("inline-flex h-9 items-center gap-1.5 px-3 text-[13px] font-semibold", !board ? "bg-nav text-white" : "text-ink")}
            >
              <Icon name="list" size={14} /> Table
            </button>
            <button
              type="button"
              onClick={() => setBoard(true)}
              data-testid="projects-layout-board"
              className={cx("inline-flex h-9 items-center gap-1.5 px-3 text-[13px] font-semibold", board ? "bg-nav text-white" : "text-ink")}
            >
              <Icon name="board" size={14} /> Board
            </button>
          </div>
        </div>
      }
      alternate={
        board && pipeline
          ? (visible) => (
              <div className="hs-scroll flex gap-3 overflow-x-auto p-4" data-testid="projects-board">
                {pipeline.stages.map((st) => {
                  const cards = visible.filter((p) => (pipelineId === "project-pipeline" ? p.stage : p.deliveryStage) === st.id);
                  return (
                    <div key={st.id} className="flex w-[270px] shrink-0 flex-col rounded-[8px] bg-[#f4f5f7] p-2.5">
                      <div className="mb-2 flex items-center justify-between px-1">
                        <span className="text-[12.5px] font-semibold">{st.label}</span>
                        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold">{cards.length}</span>
                      </div>
                      <div className="space-y-2.5">
                        {cards.map((p) => (
                          <div key={p.id} className="rounded-[8px] border border-line bg-white p-3 shadow-xs">
                            <A to={`/projects/${p.id}`} className="hs-link text-[13.5px] font-semibold">
                              {p.code} · {p.name}
                            </A>
                            <div className="mt-1.5 flex items-center justify-between text-[12px]">
                              <Tag tone={statusTagTone(p.status)}>{p.status}</Tag>
                              <span className="text-ink-muted">Due {date(p.targetDueDate)}</span>
                            </div>
                            {canEdit ? (
                              <select
                                value={pipelineId === "project-pipeline" ? p.stage : p.deliveryStage}
                                onChange={(e) =>
                                  dispatch({
                                    t: "project.setStage",
                                    projectId: p.id,
                                    pipelineId,
                                    stage: e.target.value,
                                    at: nowMs(),
                                  })
                                }
                                aria-label={`Move ${p.name} stage`}
                                className="mt-2 h-7 w-full rounded border border-line bg-[#fafafa] px-2 text-[11.5px]"
                              >
                                {pipeline.stages.map((opt) => (
                                  <option key={opt.id} value={opt.id}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          : undefined
      }
      preview={(p, close) => (
        <PreviewShell title={`${p.code} · ${p.name}`} subtitle={p.status} to={`/projects/${p.id}`} onClose={close}>
          <dl>
            <Prop label="Status">
              <Tag tone={statusTagTone(p.status)}>{p.status}</Tag>
            </Prop>
            {p.blockerNote ? <Prop label="Blocker Note">{p.blockerNote}</Prop> : null}
            <Prop label="Target Delivery">{date(p.targetDueDate)}</Prop>
          </dl>
        </PreviewShell>
      )}
    />
  );
}

export function ProjectRecord({ id }: { id: string }) {
  const { pack, world, persona, dispatch } = useShell();
  const project = world.projects.find((p) => p.id === id);
  useSeen(`seen.project.${id}`, Boolean(project));

  const [tab, setTab] = useState<"plan" | "overview">("plan");
  const [activePipeline, setActivePipeline] = useState<"project-pipeline" | "delivery-board">("project-pipeline");
  const [blockerInput, setBlockerInput] = useState(project?.blockerNote ?? "");
  const [noteText, setNoteText] = useState("");

  if (!project) {
    return (
      <div className="p-10">
        <Card>
          <Empty title="Project not found">
            <A to="/projects" className="hs-link">
              Back to Projects
            </A>
          </Empty>
        </Card>
      </div>
    );
  }

  const canEdit =
    persona.permissionSet === "project-manager" ||
    persona.permissionSet === "sales-manager" ||
    persona.permissionSet === "executive";

  const pm = pack.personas.find((p) => p.id === project.ownerId);
  const deal = world.deals.find((d) => d.id === project.dealId);
  const company = world.companies.find((c) => c.id === project.companyId);
  const contacts = world.contacts.filter((c) => project.contactIds.includes(c.id));
  const pipeline = pack.projectPipelines.find((pl) => pl.id === activePipeline) ?? pack.projectPipelines[0];
  const currentStageId = activePipeline === "project-pipeline" ? project.stage : project.deliveryStage;

  const allTasks = project.phases.flatMap((ph) => ph.tasks);
  const completedTasks = allTasks.filter((t) => t.done).length;
  const lateTasks = allTasks.filter((t) => !t.done && t.late).length;
  const pctDone = allTasks.length > 0 ? Math.round((completedTasks / allTasks.length) * 100) : 0;

  const activities = world.activities.filter((a) => a.projectIds?.includes(project.id) || a.dealIds?.includes(project.dealId));

  return (
    <div className="min-h-full" data-testid="project-record">
      <header className="border-b border-line bg-white px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <A to="/projects" className="inline-flex items-center gap-1 text-[13px] font-semibold text-link hover:underline">
              <Icon name="chevronLeft" size={14} /> Projects
            </A>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h1 className="text-[20px] font-semibold">
                {project.code} · {project.name}
              </h1>
              <Tag tone={statusTagTone(project.status)}>{project.status}</Tag>
              {lateTasks > 0 ? <Tag tone="red">{lateTasks} late</Tag> : null}
            </div>
            <p className="mt-0.5 text-[12.5px] text-ink-muted">
              {deal?.division ?? "Delivery"} · Start {date(project.startDate)} · Target Delivery {date(project.targetDueDate)}
            </p>
          </div>

          {!canEdit ? (
            <div
              className="flex items-center gap-2 rounded-[8px] border border-[#fdefc8] bg-[#fffaf0] px-3.5 py-2 text-[12.5px] font-medium text-[#754c00]"
              data-testid="project-rep-readonly-banner"
            >
              <Icon name="eye" size={15} />
              View-only for Sales Reps · Switch role to Project Manager in the bar below to update tasks &amp; delivery stages
            </div>
          ) : (
            <Tag tone="green">PM Delivery Edit Mode</Tag>
          )}
        </div>

        {pipeline ? (
          <Ext id="project-deal-sync" className="mt-4">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={activePipeline}
                onChange={(e) => setActivePipeline(e.target.value as "project-pipeline" | "delivery-board")}
                data-testid="project-record-pipeline-select"
                className="h-8 rounded-[6px] border border-line bg-[#fafafa] px-2.5 text-[12.5px] font-semibold"
              >
                {pack.projectPipelines.map((pl) => (
                  <option key={pl.id} value={pl.id}>
                    {pl.name}
                  </option>
                ))}
              </select>
              <div className="flex flex-1 flex-wrap gap-1">
                {pipeline.stages.map((st, idx) => {
                  const activeIdx = pipeline.stages.findIndex((x) => x.id === currentStageId);
                  const passed = idx <= activeIdx;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      disabled={!canEdit}
                      data-testid={`project-stage-${st.id}`}
                      onClick={() =>
                        dispatch({
                          t: "project.setStage",
                          projectId: project.id,
                          pipelineId: activePipeline,
                          stage: st.id,
                          at: nowMs(),
                        })
                      }
                      className={cx(
                        "flex-1 rounded-[5px] px-2.5 py-1.5 text-center text-[12px] font-semibold transition",
                        st.id === currentStageId
                          ? "bg-hs-orange text-white"
                          : passed
                            ? "bg-[#ffe4d6] text-[#a03400]"
                            : "bg-[#efefef] text-ink-muted",
                        canEdit && "hover:opacity-90",
                        !canEdit && "cursor-default",
                      )}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </Ext>
        ) : null}
      </header>

      <div className="grid grid-cols-1 gap-5 p-6 lg:grid-cols-[290px_1fr_300px]">
        <div className="space-y-4">
          <Card title="Project Health & Status" testId="project-status-card">
            <div className="space-y-3 text-[13px]">
              <div className="flex flex-wrap gap-1.5">
                {(["On Track", "Blocked", "Completed", "Cancelled"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    disabled={!canEdit}
                    data-testid={`project-status-btn-${st.toLowerCase().replace(/\s+/g, "-")}`}
                    onClick={() =>
                      dispatch({
                        t: "project.setStatus",
                        projectId: project.id,
                        status: st,
                        blockerNote: st === "Blocked" ? blockerInput || "Awaiting customer approval / site readiness" : "",
                        at: nowMs(),
                      })
                    }
                    className={cx(
                      "rounded-[6px] border px-2.5 py-1 text-[12px] font-semibold",
                      project.status === st ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:bg-[#f5f5f5]",
                      !canEdit && "opacity-60",
                    )}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {project.status === "Blocked" || blockerInput ? (
                <div className="space-y-1.5">
                  <label className="block text-[11.5px] font-semibold text-[#99201a]">Blocker reason (visible to Sales Rep)</label>
                  <textarea
                    rows={2}
                    disabled={!canEdit}
                    value={blockerInput}
                    onChange={(e) => setBlockerInput(e.target.value)}
                    placeholder="Describe what is blocking fabrication or shipment…"
                    data-testid="project-blocker-input"
                    className="w-full rounded-[6px] border border-line p-2 text-[12.5px]"
                  />
                  {canEdit ? (
                    <Button
                      size="sm"
                      onClick={() =>
                        dispatch({
                          t: "project.setStatus",
                          projectId: project.id,
                          status: "Blocked",
                          blockerNote: blockerInput,
                          at: nowMs(),
                        })
                      }
                    >
                      Save blocker note
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </Card>

          <Card title="About this Project">
            <dl className="divide-y divide-line-soft">
              <Prop label="Project Code">{project.code}</Prop>
              <Prop label="Project Manager">
                {pm ? (
                  <span className="inline-flex items-center gap-2">
                    <Avatar name={pm.name} color={pm.color} size={22} />
                    {pm.name}
                  </span>
                ) : (
                  project.ownerId
                )}
              </Prop>
              <Prop label="Start Date">{date(project.startDate)}</Prop>
              <Prop label="Target Delivery Date">{date(project.targetDueDate)}</Prop>
              {deal?.customerPo ? <Prop label="Customer PO #">{deal.customerPo}</Prop> : null}
              {deal?.amicoOrderNumber ? <Prop label="AMICO Order #">{deal.amicoOrderNumber}</Prop> : null}
            </dl>
          </Card>
        </div>

        <div className="space-y-4">
          <Card pad={false}>
            <div className="px-4 pt-2">
              <LineTabs
                value={tab}
                onChange={setTab}
                tabs={[
                  { id: "plan", label: `Project Plan (${completedTasks}/${allTasks.length})`, testId: "project-plan-tab" },
                  { id: "overview", label: `Timeline & Updates (${activities.length})`, testId: "project-overview-tab" },
                ]}
              />
            </div>

            {tab === "plan" ? (
              <div className="space-y-4 p-4" data-testid="project-plan-view">
                <div className="rounded-[8px] border border-line-soft bg-[#fafafa] p-3.5">
                  <div className="flex items-center justify-between text-[13px] font-semibold">
                    <span>
                      {completedTasks} of {allTasks.length} milestone tasks completed ({pctDone}%)
                    </span>
                    {lateTasks > 0 ? <Tag tone="red">{lateTasks} overdue</Tag> : <Tag tone="green">Schedule healthy</Tag>}
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#e6e6e6]">
                    <div className="h-full rounded-full bg-[#0b5b2b] transition-all" style={{ width: `${pctDone}%` }} />
                  </div>
                </div>

                {project.phases.map((phase) => {
                  const pDone = phase.tasks.filter((t) => t.done).length;
                  return (
                    <div key={phase.id} className="rounded-[8px] border border-line" data-testid={`project-phase-${phase.id}`}>
                      <div className="flex items-center justify-between border-b border-line-soft bg-[#fafafa] px-3.5 py-2.5">
                        <h4 className="text-[13.5px] font-semibold">{phase.name}</h4>
                        <span className="text-[12px] text-ink-muted tabular-nums">
                          {pDone}/{phase.tasks.length} complete
                        </span>
                      </div>
                      <ul className="divide-y divide-line-soft">
                        {phase.tasks.map((task) => {
                          const assignee = pack.personas.find((x) => x.id === task.assigneeId);
                          return (
                            <li key={task.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-[13px]">
                              <label className="flex items-center gap-2.5">
                                <input
                                  type="checkbox"
                                  checked={task.done}
                                  disabled={!canEdit}
                                  data-testid={`project-task-${task.id}`}
                                  onChange={() =>
                                    dispatch({
                                      t: "project.toggleTask",
                                      projectId: project.id,
                                      taskId: task.id,
                                      at: nowMs(),
                                    })
                                  }
                                />
                                <span className={cx(task.done && "line-through text-ink-muted")}>{task.title}</span>
                              </label>
                              <div className="flex shrink-0 items-center gap-2 text-[12px] text-ink-muted">
                                {!task.done && task.late ? <Tag tone="red">Late</Tag> : null}
                                <span>Due {date(task.dueDate)}</span>
                                {assignee ? <Avatar name={assignee.name} color={assignee.color} size={20} /> : null}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4 p-4">
                <div className="space-y-2 rounded-[8px] border border-line-soft p-3">
                  <textarea
                    rows={2}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Post a project note or @mention the Sales Rep with an ETA update…"
                    className="w-full rounded border border-line p-2 text-[13px]"
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={!noteText.trim()}
                    onClick={() => {
                      dispatch({
                        t: "log",
                        kind: "note",
                        text: noteText.trim(),
                        contactIds: project.contactIds,
                        companyIds: [project.companyId],
                        dealIds: [project.dealId],
                        projectIds: [project.id],
                        at: nowMs(),
                      });
                      setNoteText("");
                    }}
                  >
                    Save project note
                  </Button>
                </div>

                <div className="space-y-3">
                  {activities.map((act) => (
                    <div key={act.id} className="rounded-[8px] border border-line-soft p-3 text-[13px]">
                      <div className="flex items-center justify-between text-[11.5px] text-ink-muted">
                        <span className="font-semibold uppercase">{act.type}</span>
                        <span>{date(act.at)}</span>
                      </div>
                      <p className="mt-1 font-semibold">{act.title}</p>
                      {act.body ? <p className="mt-0.5 text-ink">{act.body}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Originating Deal (Live Delivery Sync)" testId="project-origin-deal-card">
            {deal ? (
              <div className="rounded-[8px] border border-line-soft p-3 text-[13px]">
                <A to={`/deals/${deal.id}`} className="hs-link font-semibold" data-testid="project-deal-link">
                  {deal.name}
                </A>
                <p className="mt-1 text-[12px] text-ink-muted" data-testid="project-synced-deal-stage">
                  Synced Deal Stage: <strong className="text-ink">{deal.stage}</strong>
                </p>
              </div>
            ) : (
              <p className="text-[13px] text-ink-muted">No deal linked.</p>
            )}
          </Card>

          <Card title="Customer Company">
            {company ? (
              <div className="rounded-[8px] border border-line-soft p-3 text-[13px]">
                <A to={`/companies/${company.id}`} className="hs-link font-semibold">
                  {company.name}
                </A>
                <p className="mt-0.5 text-[12px] text-ink-muted">{company.crossDivision?.primaryDivision ?? company.industry}</p>
              </div>
            ) : null}
          </Card>

          <Card title="Project Contacts">
            <div className="space-y-2">
              {contacts.map((c) => (
                <div key={c.id} className="rounded-[8px] border border-line-soft p-2.5 text-[13px]">
                  <A to={`/contacts/${c.id}`} className="hs-link font-semibold">
                    {c.firstName} {c.lastName}
                  </A>
                  <p className="text-[12px] text-ink-muted">{c.title}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
