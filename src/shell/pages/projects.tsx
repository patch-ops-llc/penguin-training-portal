"use client";

import { useState } from "react";
import { nowMs } from "@/lib/format";
import { useSeen, useShell } from "@/store/store";
import type { Project } from "@/tenants/types";
import { Ext } from "../ext";
import { FloatingComposer, type ComposerKind } from "../floating-composer";
import { date, money, shortDate } from "../format";
import { Icon } from "../icons";
import { A, Avatar, Button, Card, cx, Empty, LineTabs, Prop, Tag } from "../ui";
import { IndexPage, type Column, type View } from "./index-table";

function statusTagTone(status: Project["status"]) {
  if (status === "On Track" || status === "Completed") return "green" as const;
  if (status === "Blocked") return "red" as const;
  return "neutral" as const;
}

export function ProjectsIndex() {
  const { pack, world, persona, dispatch } = useShell();
  const [pipelineId, setPipelineId] = useState<"project-pipeline" | "delivery-board">("project-pipeline");
  const [board, setBoard] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  const pipeline = pack.projectPipelines.find((p) => p.id === pipelineId) ?? pack.projectPipelines[0];
  const canEdit =
    persona.permissionSet === "project-manager" ||
    persona.permissionSet === "sales-manager" ||
    persona.permissionSet === "executive";

  const views: View<Project>[] = [
    { id: "all", label: "All projects", filter: () => true, closable: false },
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
        <A to={`/projects/${p.id}`} className="hs-link" data-testid={`project-link-${p.id}`}>
          {p.code} · {p.name}
        </A>
      ),
    },
    {
      id: "status",
      label: "Status",
      cell: (p) => <Tag tone={statusTagTone(p.status)}>{p.status}</Tag>,
    },
    {
      id: "stage",
      label: pipelineId === "project-pipeline" ? "Project Stage" : "Delivery Stage",
      cell: (p) => {
        const sid = pipelineId === "project-pipeline" ? p.stage : p.deliveryStage;
        return <Tag tone="blue">{pipeline?.stages.find((s) => s.id === sid)?.label ?? sid}</Tag>;
      },
    },
    {
      id: "company",
      label: "Associated Company",
      cell: (p) => {
        const co = world.companies.find((c) => c.id === p.companyId);
        return co ? (
          <A to={`/companies/${co.id}`} className="hs-link">
            {co.name}
          </A>
        ) : (
          "—"
        );
      },
    },
    {
      id: "owner",
      label: "Project Manager",
      cell: (p) => {
        const pm = pack.personas.find((x) => x.id === p.ownerId);
        return pm ? (
          <span className="inline-flex items-center gap-1.5">
            <Avatar name={pm.name} color={pm.color} size={20} />
            <span>{pm.name}</span>
          </span>
        ) : (
          p.ownerId
        );
      },
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
    { id: "due", label: "Target Delivery", cell: (p) => shortDate(p.targetDueDate) },
  ];

  return (
    <IndexPage
      title="Projects"
      objectSwitcherLabel="Projects"
      noun="project"
      rows={world.projects}
      columns={columns}
      views={views}
      rowKey={(p) => p.id}
      searchText={(p) => `${p.code} ${p.name} ${p.status}`}
      onPreviewRow={(p) => dispatch({ t: "ui", k: "preview", v: `project:${p.id}` })}
      headerActions={
        <>
          <Button size="sm" icon="columns">
            Edit columns
          </Button>
          <Tag tone="teal">Post-Award Delivery Sync</Tag>
        </>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-[3px] border border-[#cbd6e2] bg-white">
            <button
              type="button"
              onClick={() => setBoard(false)}
              data-testid="projects-layout-table"
              className={cx(
                "inline-flex h-8 items-center gap-1.5 border-r border-[#cbd6e2] px-2.5 text-[12.5px] font-semibold",
                !board ? "bg-[#eaf0f6] text-[#33475b]" : "text-[#516f90] hover:bg-[#f5f8fa]",
              )}
            >
              <Icon name="list" size={14} /> List
            </button>
            <button
              type="button"
              onClick={() => setBoard(true)}
              data-testid="projects-layout-board"
              className={cx(
                "inline-flex h-8 items-center gap-1.5 px-2.5 text-[12.5px] font-semibold",
                board ? "bg-[#eaf0f6] text-[#33475b]" : "text-[#516f90] hover:bg-[#f5f8fa]",
              )}
            >
              <Icon name="board" size={14} /> Board
            </button>
          </div>

          <select
            value={pipelineId}
            onChange={(e) => setPipelineId(e.target.value as "project-pipeline" | "delivery-board")}
            data-testid="project-pipeline-select"
            className="hs-input !h-8 !bg-white font-semibold text-[#0091ae]"
          >
            {pack.projectPipelines.map((pl) => (
              <option key={pl.id} value={pl.id}>
                {pl.name}
              </option>
            ))}
          </select>
        </div>
      }
      alternate={
        board && pipeline
          ? (visible) => (
              <div className="hs-scroll flex flex-1 gap-3 overflow-x-auto px-6 py-4" data-testid="projects-board">
                {pipeline.stages.map((st) => {
                  const cards = visible.filter((p) => (pipelineId === "project-pipeline" ? p.stage : p.deliveryStage) === st.id);
                  const contractSum = cards.reduce((acc, p) => {
                    const dl = world.deals.find((d) => d.id === p.dealId);
                    return acc + (dl?.amount ?? 0);
                  }, 0);

                  return (
                    <div
                      key={st.id}
                      onDragOver={(e) => canEdit && e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (!canEdit || !dragId) return;
                        dispatch({
                          t: "project.setStage",
                          projectId: dragId,
                          pipelineId,
                          stage: st.id,
                          at: nowMs(),
                        });
                        setDragId(null);
                      }}
                      className="flex min-h-[400px] w-[280px] shrink-0 flex-col rounded-[4px] border border-[#dfe3eb] bg-[#eaf0f6]/65"
                    >
                      <div className="border-b border-[#dfe3eb] bg-white px-3 py-2.5">
                        <div className="flex items-center justify-between">
                          <span className="truncate text-[13px] font-semibold text-[#33475b]">{st.label}</span>
                          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#eaf0f6] px-1.5 text-[11px] font-bold text-[#516f90]">
                            {cards.length}
                          </span>
                        </div>
                      </div>

                      <div className="hs-scroll flex-1 space-y-2.5 overflow-y-auto p-2.5">
                        {cards.map((p) => {
                          const co = world.companies.find((c) => c.id === p.companyId);
                          const pm = pack.personas.find((x) => x.id === p.ownerId);
                          const openMilestones = p.phases.flatMap((ph) => ph.tasks).filter((t) => !t.done);

                          return (
                            <div
                              key={p.id}
                              draggable={canEdit}
                              onDragStart={() => setDragId(p.id)}
                              className="rounded-[4px] border border-[#cbd6e2] bg-white shadow-[0_1px_2px_rgba(51,71,91,0.06)]"
                            >
                              <div className="p-3">
                                <A to={`/projects/${p.id}`} className="hs-link text-[13px]">
                                  {p.code} · {p.name}
                                </A>
                                {co ? <p className="mt-1 text-[11.5px] text-[#516f90]">{co.name}</p> : null}
                                <div className="mt-2 flex items-center justify-between text-[12px]">
                                  <Tag tone={statusTagTone(p.status)}>{p.status}</Tag>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11.5px] text-[#516f90]">Due {shortDate(p.targetDueDate)}</span>
                                    {pm ? <Avatar name={pm.name} color={pm.color} size={19} /> : null}
                                  </div>
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
                                    className="hs-input mt-2 !h-7 w-full !bg-[#f5f8fa] !px-2 !text-[11.5px]"
                                  >
                                    {pipeline.stages.map((opt) => (
                                      <option key={opt.id} value={opt.id}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                ) : null}
                              </div>
                              <div className="flex items-center gap-1.5 border-t border-[#eaf0f6] bg-[#f5f8fa] px-3 py-1.5 text-[11px] text-[#516f90]">
                                <Icon name="task" size={12} className="text-[#0091ae]" />
                                <span className="truncate">
                                  {openMilestones[0] ? `Next: ${openMilestones[0].title}` : "All milestones complete"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="border-t border-[#dfe3eb] bg-white px-3 py-2 text-[11.5px] text-[#516f90]">
                        <div className="flex items-center justify-between">
                          <span>Contract value:</span>
                          <strong className="font-semibold tabular-nums text-[#33475b]">{money(contractSum)}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          : undefined
      }
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
  const [composerKind, setComposerKind] = useState<ComposerKind | null>(null);

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
    <div className="hs-record-3pane" data-testid="project-record">
      {/* LEFT SIDEBAR */}
      <aside className="hs-record-left hs-scroll">
        <div className="p-4">
          <A to="/projects" className="hs-link inline-flex items-center gap-1 text-[12.5px]">
            <Icon name="chevronLeft" size={14} /> Projects
          </A>

          <div className="mt-2.5">
            <h1 className="text-[17.5px] font-bold leading-snug text-[#33475b]">
              {project.code} · {project.name}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Tag tone={statusTagTone(project.status)}>{project.status}</Tag>
              {lateTasks > 0 ? <Tag tone="red">{lateTasks} late</Tag> : null}
            </div>
          </div>

          {/* Circular HubSpot Quick Actions */}
          <div className="mt-4 flex items-center justify-between px-1">
            {(["note", "email", "call", "task", "meeting"] as const).map((k) => (
              <button key={k} type="button" onClick={() => setComposerKind(k)} className="hs-quick-action">
                <span className="hs-quick-action-circle">
                  <Icon name={k} size={14} />
                </span>
                <span className="capitalize">{k}</span>
              </button>
            ))}
          </div>

          {/* Pipeline & Stage Progress Control */}
          {pipeline ? (
            <Ext id="project-deal-sync" className="mt-4 rounded-[4px] border border-[#dfe3eb] bg-[#f5f8fa] p-3">
              <label className="block text-[11.5px] font-medium text-[#516f90]">
                Board / Pipeline
                <select
                  value={activePipeline}
                  onChange={(e) => setActivePipeline(e.target.value as "project-pipeline" | "delivery-board")}
                  data-testid="project-record-pipeline-select"
                  className="hs-input mt-1 !h-7 w-full !bg-white !text-[12px] font-semibold text-[#0091ae]"
                >
                  {pack.projectPipelines.map((pl) => (
                    <option key={pl.id} value={pl.id}>
                      {pl.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="mt-2.5 flex flex-wrap gap-1">
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
                        "rounded-[3px] px-1.5 py-1 text-[10.5px] font-semibold transition-colors",
                        st.id === currentStageId
                          ? "bg-[#ff5c35] text-white"
                          : passed
                            ? "bg-[#0091ae]/20 text-[#00677d]"
                            : "border border-[#dfe3eb] bg-white text-[#516f90]",
                        !canEdit && "cursor-default",
                      )}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </Ext>
          ) : null}
        </div>

        {/* Project Health & Status */}
        <div className="border-t border-[#dfe3eb] px-4 py-3" data-testid="project-status-card">
          <p className="text-[12.5px] font-bold text-[#33475b]">Project Health &amp; Status</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
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
                  "rounded-[3px] border px-2 py-1 text-[11.5px] font-semibold",
                  project.status === st
                    ? "border-[#33475b] bg-[#33475b] text-white"
                    : "border-[#cbd6e2] bg-white text-[#33475b] hover:bg-[#eaf0f6]",
                  !canEdit && "opacity-60",
                )}
              >
                {st}
              </button>
            ))}
          </div>

          {project.status === "Blocked" || blockerInput ? (
            <div className="mt-2.5 space-y-1.5">
              <label className="block text-[11px] font-semibold text-[#b0232a]">Blocker reason (visible to Sales Rep)</label>
              <textarea
                rows={2}
                disabled={!canEdit}
                value={blockerInput}
                onChange={(e) => setBlockerInput(e.target.value)}
                data-testid="project-blocker-input"
                className="hs-input w-full !bg-white !text-[12px]"
              />
            </div>
          ) : null}
        </div>

        <div className="border-t border-[#dfe3eb] px-4 py-3">
          <p className="text-[12.5px] font-bold text-[#33475b]">About this project</p>
          <dl className="mt-1">
            <Prop label="Project code">{project.code}</Prop>
            <Prop label="Project Manager">
              {pm ? (
                <span className="inline-flex items-center gap-1.5">
                  <Avatar name={pm.name} color={pm.color} size={20} />
                  {pm.name}
                </span>
              ) : (
                project.ownerId
              )}
            </Prop>
            <Prop label="Start date">{date(project.startDate)}</Prop>
            <Prop label="Target delivery date">{date(project.targetDueDate)}</Prop>
            {deal?.customerPo ? <Prop label="Customer PO #">{deal.customerPo}</Prop> : null}
            {deal?.amicoOrderNumber ? <Prop label="AMICO Order #">{deal.amicoOrderNumber}</Prop> : null}
          </dl>
        </div>
      </aside>

      {/* MIDDLE CANVAS */}
      <section className="hs-record-center hs-scroll">
        <div className="border-b border-[#dfe3eb] bg-white px-6 pt-1">
          <LineTabs
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "plan", label: `Project Plan (${completedTasks}/${allTasks.length})`, testId: "project-plan-tab" },
              { id: "overview", label: `Activities (${activities.length})`, testId: "project-overview-tab" },
            ]}
          />
        </div>

        <div className="space-y-4 p-5">
          {!canEdit ? (
            <div
              className="flex items-center gap-2 rounded-[4px] border border-[#f5c26b] bg-[#fef6e7] px-4 py-2.5 text-[12.5px] font-semibold text-[#8a5300]"
              data-testid="project-rep-readonly-banner"
            >
              <Icon name="eye" size={15} />
              <span>
                View-only for Sales Reps · Switch role to Project Manager in the Penguin Training Guide below to update tasks &amp; delivery stages
              </span>
            </div>
          ) : null}

          {tab === "plan" ? (
            <div className="space-y-4" data-testid="project-plan-view">
              <Card title="Milestone Execution Summary">
                <div className="flex items-center justify-between text-[13px] font-semibold">
                  <span>
                    {completedTasks} of {allTasks.length} milestone tasks completed ({pctDone}%)
                  </span>
                  {lateTasks > 0 ? <Tag tone="red">{lateTasks} overdue</Tag> : <Tag tone="green">Schedule healthy</Tag>}
                </div>
                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[#eaf0f6]">
                  <div className="h-full rounded-full bg-[#00bda5] transition-all" style={{ width: `${pctDone}%` }} />
                </div>
              </Card>

              {project.phases.map((phase) => {
                const pDone = phase.tasks.filter((t) => t.done).length;
                return (
                  <Card
                    key={phase.id}
                    title={phase.name}
                    right={
                      <span className="text-[12px] text-[#516f90] tabular-nums">
                        {pDone}/{phase.tasks.length} complete
                      </span>
                    }
                    pad={false}
                    testId={`project-phase-${phase.id}`}
                  >
                    <ul className="divide-y divide-[#eaf0f6]">
                      {phase.tasks.map((task) => {
                        const assignee = pack.personas.find((x) => x.id === task.assigneeId);
                        return (
                          <li key={task.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px]">
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
                                className="accent-[#0091ae]"
                              />
                              <span className={cx("text-[#33475b]", task.done && "line-through text-[#7c98b6]")}>{task.title}</span>
                            </label>
                            <div className="flex shrink-0 items-center gap-2 text-[12px] text-[#516f90]">
                              {!task.done && task.late ? <Tag tone="red">Late</Tag> : null}
                              <span>Due {shortDate(task.dueDate)}</span>
                              {assignee ? <Avatar name={assignee.name} color={assignee.color} size={20} /> : null}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-end">
                <Button size="sm" variant="primary" icon="note" onClick={() => setComposerKind("note")}>
                  Create project note
                </Button>
              </div>
              {activities.map((act) => (
                <Card key={act.id}>
                  <div className="flex items-center justify-between text-[11.5px] text-[#516f90]">
                    <span className="font-bold uppercase text-[#0091ae]">{act.type}</span>
                    <span>{date(act.at)}</span>
                  </div>
                  <p className="mt-1 text-[13.5px] font-semibold text-[#33475b]">{act.title}</p>
                  {act.body ? <p className="mt-0.5 text-[13px] text-[#516f90]">{act.body}</p> : null}
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* RIGHT SIDEBAR */}
      <aside className="hs-record-right hs-scroll divide-y divide-[#dfe3eb]">
        <div className="p-4" data-testid="project-origin-deal-card">
          <p className="text-[13px] font-bold text-[#33475b]">Deals (1)</p>
          {deal ? (
            <div className="mt-2 rounded-[4px] border border-[#dfe3eb] p-2.5 text-[12.5px]">
              <div className="flex items-center justify-between gap-2">
                <A to={`/deals/${deal.id}`} className="hs-link" data-testid="project-deal-link">
                  {deal.name}
                </A>
                <Tag tone="blue">Originating Deal</Tag>
              </div>
              <p className="mt-1 text-[12px] text-[#516f90]" data-testid="project-synced-deal-stage">
                Synced Deal Stage: <strong className="text-[#33475b]">{deal.stage}</strong>
              </p>
            </div>
          ) : null}
        </div>

        <div className="p-4">
          <p className="text-[13px] font-bold text-[#33475b]">Companies ({company ? 1 : 0})</p>
          {company ? (
            <div className="mt-2 rounded-[4px] border border-[#dfe3eb] p-2.5 text-[12.5px]">
              <div className="flex items-center justify-between">
                <A to={`/companies/${company.id}`} className="hs-link">
                  {company.name}
                </A>
                <Tag tone="blue">Primary</Tag>
              </div>
              <p className="mt-0.5 text-[11.5px] text-[#516f90]">{company.crossDivision?.primaryDivision ?? company.industry}</p>
            </div>
          ) : null}
        </div>

        <div className="p-4">
          <p className="text-[13px] font-bold text-[#33475b]">Contacts ({contacts.length})</p>
          <div className="mt-2 space-y-2">
            {contacts.map((c) => (
              <div key={c.id} className="rounded-[4px] border border-[#dfe3eb] p-2.5 text-[12.5px]">
                <A to={`/contacts/${c.id}`} className="hs-link">
                  {c.firstName} {c.lastName}
                </A>
                <p className="text-[11.5px] text-[#516f90]">{c.title}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {composerKind ? (
        <FloatingComposer
          kind={composerKind}
          onKindChange={setComposerKind}
          onClose={() => setComposerKind(null)}
          target={{
            recordLabel: `${project.code}: ${project.name}`,
            contactIds: project.contactIds,
            companyIds: [project.companyId],
            dealIds: [project.dealId],
            projectIds: [project.id],
            defaultEmailTo: contacts[0]?.email,
          }}
        />
      ) : null}
    </div>
  );
}
