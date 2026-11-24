"use client";

import { useSeen, useShell } from "@/store/store";
import type { WorkflowNode } from "@/tenants/types";
import { Ext } from "../ext";
import { num } from "../format";
import { Icon } from "../icons";
import { A, Card, cx, Empty, statusTone, Tag } from "../ui";

function Node({ node }: { node: WorkflowNode }) {
  const box = (
    <div
      className="w-[265px] rounded-[8px] border border-hs-orange bg-white px-3.5 py-2.5 text-left shadow-[0_0_0_2px_rgba(255,72,0,0.12)]"
      data-testid={`wf-node-${node.id}`}
    >
      <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink-muted">
        <Icon name={node.kind === "trigger" ? "form" : node.kind === "branch" ? "workflow" : "check"} size={12} />
        {node.kind === "trigger" ? "Trigger" : node.kind === "branch" ? "Branch" : "Action"}
      </p>
      <p className="mt-0.5 text-[13px] font-semibold leading-snug">{node.label}</p>
      {node.detail ? <p className="mt-0.5 text-[12px] leading-snug text-ink-muted">{node.detail}</p> : null}
    </div>
  );
  return node.extId ? (
    <Ext id={node.extId} pinClass="!right-2">
      {box}
    </Ext>
  ) : (
    box
  );
}

function Connector() {
  return <span className="mx-auto block h-5 w-0.5 bg-hs-orange" aria-hidden="true" />;
}

export function WorkflowPage({ id }: { id: string }) {
  const { pack } = useShell();
  const workflow = pack.workflows.find((w) => w.id === id);
  useSeen(`seen.workflow.${id}`, Boolean(workflow));

  if (!workflow?.trunk) {
    return (
      <div className="p-10">
        <Card>
          <Empty title="Workflow not found">
            <A to="/workflows" className="hs-link">
              Go to all workflows
            </A>
          </Empty>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-full" data-testid="workflow-page">
      <header className="flex items-center justify-between border-b border-line bg-white px-6 py-3.5">
        <div>
          <A to="/workflows" className="inline-flex items-center gap-1 text-[13px] font-semibold text-link hover:underline">
            <Icon name="chevronLeft" size={14} /> Workflows
          </A>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-[19px] font-semibold">{workflow.name}</h1>
            <Tag tone={statusTone(workflow.status)}>Workflow is {workflow.status.toLowerCase()}</Tag>
          </div>
          <p className="mt-0.5 text-[12.5px] text-ink-muted">
            {workflow.object}-based · {num(workflow.enrolled)} enrolled · {workflow.description}
          </p>
        </div>
        <Tag>Read-only view</Tag>
      </header>

      <div className="hs-scroll overflow-x-auto px-6 py-6">
        <div className="mx-auto flex w-max flex-col items-center">
          {workflow.trunk.map((node, i) => (
            <div key={node.id} className="flex flex-col items-center">
              {i > 0 ? <Connector /> : null}
              <Node node={node} />
            </div>
          ))}
          {workflow.branches && workflow.branches.length > 0 ? (
            <>
              <Connector />
              <div className="flex items-start gap-5 border-t-2 border-hs-orange pt-0">
                {workflow.branches.map((branch) => (
                  <div key={branch.id} className="flex flex-col items-center" data-testid={`wf-branch-${branch.id}`}>
                    <Connector />
                    <div className={cx("w-[265px] rounded-[8px] bg-hs-orange px-3 py-2 text-center text-white")}>
                      <p className="text-[13px] font-semibold">{branch.label}</p>
                      <p className="text-[11.5px] text-white/85">{branch.rule}</p>
                    </div>
                    {branch.nodes.map((node) => (
                      <div key={node.id} className="flex flex-col items-center">
                        <Connector />
                        <Node node={node} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
