"use client";

import { useState } from "react";
import { nowMs } from "@/lib/format";
import { useShell } from "@/store/store";
import { Icon, type IconName } from "./icons";
import { Button, cx, Tag } from "./ui";

export type ComposerKind = "note" | "email" | "call" | "task" | "meeting";

export type ComposerTarget = {
  recordLabel: string;
  contactIds: string[];
  companyIds: string[];
  dealIds: string[];
  projectIds?: string[];
  defaultEmailTo?: string;
};

const COMPOSER_TABS: { id: ComposerKind; label: string; icon: IconName; cta: string }[] = [
  { id: "note", label: "Note", icon: "note", cta: "Save note" },
  { id: "email", label: "Email", icon: "email", cta: "Log email" },
  { id: "call", label: "Call", icon: "call", cta: "Log call" },
  { id: "task", label: "Task", icon: "task", cta: "Create task" },
  { id: "meeting", label: "Meeting", icon: "meeting", cta: "Log meeting" },
];

const CALL_OUTCOMES = ["Connected", "Left voicemail", "Left live message", "No answer", "Busy", "Wrong number"];
const CALL_DIRECTIONS = ["Outbound", "Inbound"];

const DEFAULTS: Record<ComposerKind, string> = {
  note: "@Marcus Alvarez Confirmed site drawings and estimator scope — ready for bid review.",
  email: "Sent quote package and submittal timeline via Outlook 365.",
  call: "Spoke with GC estimator — confirmed Friday 2:00 PM bid deadline and alternates.",
  task: "Follow up with GC estimator on quote revision before bid close",
  meeting: "Project scope & perimeter specification review with GC + A/E team",
};

/**
 * Authentic floating bottom-right HubSpot Activity Composer dock.
 * Opens from circular Quick Action icons in the left record sidebar or "Create note / Log call / Log email / Create task" in the middle canvas.
 */
export function FloatingComposer({
  kind,
  onKindChange,
  target,
  onClose,
}: {
  kind: ComposerKind;
  onKindChange: (k: ComposerKind) => void;
  target: ComposerTarget;
  onClose: () => void;
}) {
  const { dispatch, persona } = useShell();
  const [minimized, setMinimized] = useState(false);
  const [text, setText] = useState("");
  const [callOutcome, setCallOutcome] = useState("Connected");
  const [callDirection, setCallDirection] = useState("Outbound");
  const [callDuration, setCallDuration] = useState("12 min");
  const [emailSubject, setEmailSubject] = useState(`Re: ${target.recordLabel} — AMICO Quote & Submittals`);
  const [taskPriority, setTaskPriority] = useState<"High" | "Medium" | "Low">("High");
  const [taskDue, setTaskDue] = useState("In 3 business days");
  const [meetingOutcome, setMeetingOutcome] = useState("Scheduled");

  const activeTab = COMPOSER_TABS.find((t) => t.id === kind) ?? COMPOSER_TABS[0];
  const assocCount =
    target.companyIds.length + target.contactIds.length + target.dealIds.length + (target.projectIds?.length ?? 0);

  const submit = () => {
    const raw = (text.trim() || DEFAULTS[kind]).trim();
    const enriched =
      kind === "call"
        ? `[${callDirection} · Outcome: ${callOutcome} · ${callDuration}] ${raw}`
        : kind === "email"
          ? `Subject: ${emailSubject} — ${raw}`
          : kind === "task"
            ? `${raw} (${taskPriority} priority · ${taskDue})`
            : kind === "meeting"
              ? `[Outcome: ${meetingOutcome}] ${raw}`
              : raw;

    dispatch({
      t: "log",
      kind,
      text: enriched,
      contactIds: target.contactIds,
      companyIds: target.companyIds,
      dealIds: target.dealIds,
      projectIds: target.projectIds,
      at: nowMs(),
    });
    setText("");
    onClose();
  };

  return (
    <div
      className="hs-composer-window fixed bottom-[76px] right-6 z-[74] flex w-[470px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-t-[6px] rounded-b-[4px] border border-[#cbd6e2] bg-white"
      data-testid="floating-composer"
    >
      {/* HubSpot Dark Slate Composer Title Bar */}
      <header className="flex h-10 items-center justify-between bg-[#253342] px-3.5 text-white">
        <div className="flex min-w-0 items-center gap-2">
          <Icon name={activeTab.icon} size={14} className="shrink-0 text-[#7fd1de]" />
          <span className="truncate text-[13px] font-semibold">
            {activeTab.label} · {target.recordLabel}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMinimized((m) => !m)}
            aria-label={minimized ? "Expand composer" : "Minimize composer"}
            data-testid="composer-minimize"
            className="rounded p-1 text-white/80 hover:bg-white/15 hover:text-white"
          >
            <Icon name={minimized ? "chevronUp" : "minimize"} size={14} />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close composer"
            data-testid="composer-close"
            className="rounded p-1 text-white/80 hover:bg-white/15 hover:text-white"
          >
            <Icon name="close" size={15} />
          </button>
        </div>
      </header>

      {!minimized ? (
        <>
          {/* Activity Type Switcher Strip */}
          <div className="flex items-center gap-1 border-b border-[#dfe3eb] bg-[#f5f8fa] px-3 py-1.5">
            {COMPOSER_TABS.map((t) => {
              const active = t.id === kind;
              return (
                <button
                  key={t.id}
                  type="button"
                  data-testid={`log-kind-${t.id}`}
                  onClick={() => onKindChange(t.id)}
                  className={cx(
                    "inline-flex h-7 items-center gap-1.5 rounded-[3px] px-2.5 text-[12px] font-semibold transition-colors",
                    active
                      ? "bg-[#33475b] text-white"
                      : "text-[#516f90] hover:bg-[#eaf0f6] hover:text-[#33475b]",
                  )}
                >
                  <Icon name={t.icon} size={13} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Metadata Controls per Activity Kind */}
          {kind === "call" ? (
            <div className="grid grid-cols-3 gap-2 border-b border-[#eaf0f6] bg-white px-3.5 py-2.5 text-[12px]">
              <label className="block">
                <span className="text-[11px] font-medium text-[#516f90]">Call outcome *</span>
                <select
                  value={callOutcome}
                  onChange={(e) => setCallOutcome(e.target.value)}
                  data-testid="call-outcome-select"
                  className="hs-input mt-0.5 !h-7 w-full !px-2 !text-[12px]"
                >
                  {CALL_OUTCOMES.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[11px] font-medium text-[#516f90]">Direction</span>
                <select
                  value={callDirection}
                  onChange={(e) => setCallDirection(e.target.value)}
                  className="hs-input mt-0.5 !h-7 w-full !px-2 !text-[12px]"
                >
                  {CALL_DIRECTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[11px] font-medium text-[#516f90]">Duration</span>
                <input
                  value={callDuration}
                  onChange={(e) => setCallDuration(e.target.value)}
                  className="hs-input mt-0.5 !h-7 w-full !px-2 !text-[12px]"
                />
              </label>
            </div>
          ) : null}

          {kind === "email" ? (
            <div className="space-y-1.5 border-b border-[#eaf0f6] bg-white px-3.5 py-2.5 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-[#516f90]">
                  To:{" "}
                  <strong className="font-semibold text-[#33475b]">
                    {target.defaultEmailTo ?? "Primary Associated Contact"}
                  </strong>
                </span>
                <Tag tone="teal">Outlook 365 Synced</Tag>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-12 shrink-0 text-[#516f90]">Subject</span>
                <input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  data-testid="email-subject-input"
                  className="hs-input !h-7 flex-1 !px-2 !text-[12px]"
                />
              </div>
            </div>
          ) : null}

          {kind === "task" ? (
            <div className="grid grid-cols-3 gap-2 border-b border-[#eaf0f6] bg-white px-3.5 py-2.5 text-[12px]">
              <label className="block">
                <span className="text-[11px] font-medium text-[#516f90]">Due date</span>
                <select
                  value={taskDue}
                  onChange={(e) => setTaskDue(e.target.value)}
                  className="hs-input mt-0.5 !h-7 w-full !px-2 !text-[12px]"
                >
                  <option value="Today">Today</option>
                  <option value="Tomorrow">Tomorrow</option>
                  <option value="In 3 business days">In 3 business days</option>
                  <option value="In 1 week">In 1 week</option>
                </select>
              </label>
              <label className="block">
                <span className="text-[11px] font-medium text-[#516f90]">Priority</span>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as "High" | "Medium" | "Low")}
                  className="hs-input mt-0.5 !h-7 w-full !px-2 !text-[12px]"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </label>
              <label className="block">
                <span className="text-[11px] font-medium text-[#516f90]">Assigned to</span>
                <input
                  readOnly
                  value={persona.name}
                  className="hs-input mt-0.5 !h-7 w-full !bg-[#f5f8fa] !px-2 !text-[12px]"
                />
              </label>
            </div>
          ) : null}

          {kind === "meeting" ? (
            <div className="grid grid-cols-2 gap-2 border-b border-[#eaf0f6] bg-white px-3.5 py-2.5 text-[12px]">
              <label className="block">
                <span className="text-[11px] font-medium text-[#516f90]">Meeting outcome</span>
                <select
                  value={meetingOutcome}
                  onChange={(e) => setMeetingOutcome(e.target.value)}
                  className="hs-input mt-0.5 !h-7 w-full !px-2 !text-[12px]"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Rescheduled">Rescheduled</option>
                  <option value="No show">No show</option>
                </select>
              </label>
              <label className="block">
                <span className="text-[11px] font-medium text-[#516f90]">Attendees</span>
                <input
                  readOnly
                  value={`${persona.name} + Associated contacts`}
                  className="hs-input mt-0.5 !h-7 w-full !bg-[#f5f8fa] !px-2 !text-[12px]"
                />
              </label>
            </div>
          ) : null}

          {/* Rich Editor Body */}
          <div className="p-3.5">
            <textarea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={DEFAULTS[kind]}
              data-testid="log-text"
              className="hs-input w-full !bg-white leading-relaxed"
            />
            {/* Formatting & @Mention Helper Strip */}
            <div className="mt-2 flex items-center justify-between text-[11.5px] text-[#516f90]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setText((prev) => `${prev ? `${prev} ` : ""}@Marcus Alvarez `)}
                  className="rounded-[3px] border border-[#cbd6e2] bg-[#f5f8fa] px-2 py-0.5 font-semibold text-[#0091ae] hover:bg-[#e5f5f8]"
                >
                  @ Mention teammate
                </button>
                <span className="text-[#7c98b6]">B · I · U · Link · Snippet</span>
              </div>
              <span className="font-medium text-[#0091ae]">
                Associated with {assocCount} record{assocCount === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          {/* Composer Footer */}
          <footer className="flex items-center justify-between border-t border-[#dfe3eb] bg-[#f5f8fa] px-3.5 py-2.5">
            <Button variant="primary" size="sm" onClick={submit} data-testid="log-submit">
              {activeTab.cta}
            </Button>
            <Button size="sm" onClick={onClose}>
              Discard
            </Button>
          </footer>
        </>
      ) : null}
    </div>
  );
}
