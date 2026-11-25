"use client";

import { useMemo, useState } from "react";
import { nowMs } from "@/lib/format";
import { useShell } from "@/store/store";
import {
  AMICO_EMAIL_SNIPPETS,
  AMICO_EMAIL_TEMPLATES,
  personalizeEmailTokens,
  type AmicoEmailSnippetId,
  type AmicoEmailTemplateId,
} from "./email-data";
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
  /** When present, composer can attach a quote link chip. */
  quoteId?: string;
  quoteLabel?: string;
  contactFirstName?: string;
  companyName?: string;
  dealName?: string;
  quoteNumber?: string;
  quoteTotal?: string;
  closeDate?: string;
  division?: string;
};

const COMPOSER_TABS: { id: ComposerKind; label: string; icon: IconName; cta: string; sendCta?: string }[] = [
  { id: "note", label: "Note", icon: "note", cta: "Save note" },
  { id: "email", label: "Email", icon: "email", cta: "Log email", sendCta: "Send" },
  { id: "call", label: "Call", icon: "call", cta: "Log call" },
  { id: "task", label: "Task", icon: "task", cta: "Create task" },
  { id: "meeting", label: "Meeting", icon: "meeting", cta: "Log meeting" },
];

const CALL_OUTCOMES = ["Connected", "Left voicemail", "Left live message", "No answer", "Busy", "Wrong number"];
const CALL_DIRECTIONS = ["Outbound", "Inbound"];

const DEFAULTS: Record<ComposerKind, string> = {
  note: "@Marcus Alvarez Confirmed site drawings and estimator scope — ready for bid review.",
  email: "Please review the attached quote package and confirm lead times for your release schedule.",
  call: "Spoke with GC estimator — confirmed Friday 2:00 PM bid deadline and alternates.",
  task: "Follow up with GC estimator on quote revision before bid close",
  meeting: "Project scope & perimeter specification review with GC + A/E team",
};

const SALES_FROM = "AMICO Sales <rep@amicoglobal.com>";

/**
 * Authentic floating bottom-right HubSpot Activity Composer dock.
 * Opens from circular Quick Action icons in the left record sidebar or timeline quick-create buttons.
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
  const [emailTo, setEmailTo] = useState(target.defaultEmailTo ?? "");
  const [emailCc, setEmailCc] = useState("");
  const [emailBcc, setEmailBcc] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<AmicoEmailTemplateId | "">("");
  const [selectedSnippet, setSelectedSnippet] = useState<AmicoEmailSnippetId | "">("");
  const [enrollSequence, setEnrollSequence] = useState(false);
  const [trackOpens, setTrackOpens] = useState(true);
  const [trackClicks, setTrackClicks] = useState(true);
  const [logToCrm, setLogToCrm] = useState(true);
  const [assocContact, setAssocContact] = useState(target.contactIds.length > 0);
  const [assocCompany, setAssocCompany] = useState(target.companyIds.length > 0);
  const [assocDeal, setAssocDeal] = useState(target.dealIds.length > 0);
  const [attachQuote, setAttachQuote] = useState(Boolean(target.quoteId));
  const [taskPriority, setTaskPriority] = useState<"High" | "Medium" | "Low">("High");
  const [taskDue, setTaskDue] = useState("In 3 business days");
  const [meetingOutcome, setMeetingOutcome] = useState("Scheduled");

  const tokenCtx = useMemo(
    () => ({
      contactFirstName: target.contactFirstName,
      companyName: target.companyName,
      dealName: target.dealName ?? target.recordLabel,
      quoteNumber: target.quoteNumber,
      quoteTotal: target.quoteTotal,
      closeDate: target.closeDate,
      division: target.division ?? persona.division,
      ownerName: persona.name,
    }),
    [persona, target],
  );

  const activeTab = COMPOSER_TABS.find((t) => t.id === kind) ?? COMPOSER_TABS[0];

  const applyTemplate = (templateId: AmicoEmailTemplateId) => {
    const tpl = AMICO_EMAIL_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    setSelectedTemplate(templateId);
    setEmailSubject(personalizeEmailTokens(tpl.subject, tokenCtx));
    setText(personalizeEmailTokens(tpl.body, tokenCtx));
    dispatch({ t: "flag", k: `email.template.${templateId}` });
  };

  const applySnippet = (snippetId: AmicoEmailSnippetId) => {
    const sn = AMICO_EMAIL_SNIPPETS.find((s) => s.id === snippetId);
    if (!sn) return;
    setSelectedSnippet(snippetId);
    setText((prev) => `${prev ? `${prev}\n\n` : ""}${sn.text}`);
    dispatch({ t: "flag", k: "email.snippet.used" });
    dispatch({ t: "flag", k: `email.snippet.${snippetId}` });
  };

  const resolvedContactIds = assocContact ? target.contactIds : [];
  const resolvedCompanyIds = assocCompany ? target.companyIds : [];
  const resolvedDealIds = assocDeal ? target.dealIds : [];

  const submitLog = () => {
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
      contactIds: kind === "email" ? resolvedContactIds : target.contactIds,
      companyIds: kind === "email" ? resolvedCompanyIds : target.companyIds,
      dealIds: kind === "email" ? resolvedDealIds : target.dealIds,
      projectIds: target.projectIds,
      at: nowMs(),
    });
    setText("");
    onClose();
  };

  const submitEmail = () => {
    const body = (text.trim() || DEFAULTS.email).trim();
    dispatch({
      t: "email.send",
      subject: emailSubject.trim(),
      body,
      to: emailTo.trim() || target.defaultEmailTo || "",
      templateId: selectedTemplate || undefined,
      snippetId: selectedSnippet || undefined,
      sequenceEnroll: enrollSequence,
      trackOpens,
      trackClicks,
      logToCrm,
      attachQuoteId: attachQuote ? target.quoteId : undefined,
      contactIds: resolvedContactIds,
      companyIds: resolvedCompanyIds,
      dealIds: resolvedDealIds,
      at: nowMs(),
    });
    setText("");
    onClose();
  };

  const submit = () => {
    if (kind === "email" && logToCrm) submitEmail();
    else submitLog();
  };

  return (
    <div
      className={cx(
        "hs-composer-window fixed bottom-[76px] right-6 z-[74] flex max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-t-[6px] rounded-b-[4px] border border-[#cbd6e2] bg-white",
        kind === "email" ? "w-[560px]" : "w-[470px]",
      )}
      data-testid="floating-composer"
    >
      <header className="flex h-10 items-center justify-between bg-[#333333] px-3.5 text-white">
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
            <div className="space-y-2 border-b border-[#eaf0f6] bg-white px-3.5 py-2.5 text-[12px]">
              <EmailFieldRow label="From" testId="email-from-field">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[#33475b]">{SALES_FROM}</span>
                  <span data-testid="outlook-connected-badge">
                    <Tag tone="teal">Outlook / Office 365</Tag>
                  </span>
                </div>
              </EmailFieldRow>

              <EmailFieldRow label="To" testId="email-to-row">
                <input
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  data-testid="email-to-input"
                  className="hs-input !h-7 w-full !px-2 !text-[12px]"
                  placeholder={target.defaultEmailTo ?? "Primary contact"}
                />
                <button
                  type="button"
                  className="ml-auto text-[11px] font-semibold text-[#006162] hover:underline"
                  onClick={() => setShowCcBcc((v) => !v)}
                  data-testid="email-toggle-cc-bcc"
                >
                  Cc/Bcc
                </button>
              </EmailFieldRow>

              {showCcBcc ? (
                <EmailFieldRow label="Cc">
                  <input
                    value={emailCc}
                    onChange={(e) => setEmailCc(e.target.value)}
                    data-testid="email-cc-input"
                    className="hs-input !h-7 w-full !px-2 !text-[12px]"
                  />
                </EmailFieldRow>
              ) : null}
              {showCcBcc ? (
                <EmailFieldRow label="Bcc">
                  <input
                    value={emailBcc}
                    onChange={(e) => setEmailBcc(e.target.value)}
                    data-testid="email-bcc-input"
                    className="hs-input !h-7 w-full !px-2 !text-[12px]"
                  />
                </EmailFieldRow>
              ) : null}

              <EmailFieldRow label="Subject">
                <input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  data-testid="email-subject-input"
                  className="hs-input !h-7 w-full !px-2 !text-[12px]"
                />
              </EmailFieldRow>

              <div className="flex flex-wrap gap-2 pt-0.5">
                <select
                  value={selectedTemplate}
                  onChange={(e) => {
                    const id = e.target.value as AmicoEmailTemplateId | "";
                    if (id) applyTemplate(id);
                    else setSelectedTemplate("");
                  }}
                  data-testid="email-template-picker"
                  className="hs-input !h-7 min-w-[160px] !px-2 !text-[11.5px]"
                  aria-label="Templates"
                >
                  <option value="">Templates…</option>
                  {AMICO_EMAIL_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedSnippet}
                  onChange={(e) => {
                    const id = e.target.value as AmicoEmailSnippetId | "";
                    if (id) applySnippet(id);
                    else setSelectedSnippet("");
                  }}
                  data-testid="email-snippet-picker"
                  className="hs-input !h-7 min-w-[140px] !px-2 !text-[11.5px]"
                  aria-label="Snippets"
                >
                  <option value="">Snippets…</option>
                  {AMICO_EMAIL_SNIPPETS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <label className="inline-flex items-center gap-1.5 text-[11.5px] text-[#516f90]">
                  <input
                    type="checkbox"
                    checked={enrollSequence}
                    onChange={(e) => {
                      setEnrollSequence(e.target.checked);
                      if (e.target.checked) dispatch({ t: "flag", k: "email.sequence.enrolled" });
                    }}
                    data-testid="email-sequence-enroll"
                  />
                  Enroll in sequence
                </label>
              </div>

              {target.quoteId ? (
                <label className="flex items-center gap-2 rounded border border-[#cbd6e2] bg-[#f5f8fa] px-2 py-1.5 text-[11.5px]">
                  <input
                    type="checkbox"
                    checked={attachQuote}
                    onChange={(e) => {
                      setAttachQuote(e.target.checked);
                      if (e.target.checked) dispatch({ t: "flag", k: "email.quote.attached" });
                    }}
                    data-testid="email-quote-attach"
                  />
                  <span className="font-medium text-[#33475b]">
                    Attach quote link · {target.quoteLabel ?? target.quoteId}
                  </span>
                </label>
              ) : null}
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

          <div className="p-3.5">
            <textarea
              rows={kind === "email" ? 5 : 4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={DEFAULTS[kind]}
              data-testid="log-text"
              className="hs-input w-full !bg-white leading-relaxed"
            />
            <div className="mt-2 flex items-center justify-between text-[11.5px] text-[#516f90]">
              <EmailFormatStrip onInsertSnippet={applySnippet} />
              {kind === "email" ? (
                <span className="font-medium text-[#006162]" data-testid="email-assoc-summary">
                  Log to {[
                    assocContact && "Contact",
                    assocCompany && "Company",
                    assocDeal && "Deal",
                  ]
                    .filter(Boolean)
                    .join(", ") || "no records"}
                </span>
              ) : (
                <span className="font-medium text-[#006162]">
                  Associated with{" "}
                  {target.companyIds.length +
                    target.contactIds.length +
                    target.dealIds.length +
                    (target.projectIds?.length ?? 0)}{" "}
                  record
                  {target.companyIds.length +
                    target.contactIds.length +
                    target.dealIds.length +
                    (target.projectIds?.length ?? 0) ===
                  1
                    ? ""
                    : "s"}
                </span>
              )}
            </div>
          </div>

          {kind === "email" ? (
            <EmailAssocFooter
              trackOpens={trackOpens}
              trackClicks={trackClicks}
              logToCrm={logToCrm}
              assocContact={assocContact}
              assocCompany={assocCompany}
              assocDeal={assocDeal}
              hasContact={target.contactIds.length > 0}
              hasCompany={target.companyIds.length > 0}
              hasDeal={target.dealIds.length > 0}
              onTrackOpens={setTrackOpens}
              onTrackClicks={setTrackClicks}
              onLogToCrm={setLogToCrm}
              onAssocContact={setAssocContact}
              onAssocCompany={setAssocCompany}
              onAssocDeal={setAssocDeal}
            />
          ) : null}

          <footer className="flex items-center justify-between border-t border-[#dfe3eb] bg-[#f5f8fa] px-3.5 py-2.5">
            <Button
              variant="primary"
              size="sm"
              onClick={submit}
              data-testid={kind === "email" ? "email-send-submit" : "log-submit"}
            >
              {kind === "email" && logToCrm ? (activeTab.sendCta ?? "Send") : activeTab.cta}
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

function EmailFieldRow({
  label,
  children,
  testId,
}: {
  label: string;
  children: React.ReactNode;
  testId?: string;
}) {
  return (
    <div className="flex items-center gap-2" data-testid={testId}>
      <span className="w-12 shrink-0 text-[#516f90]">{label}</span>
      <div className="flex min-w-0 flex-1 items-center gap-2">{children}</div>
    </div>
  );
}

function EmailFormatStrip({ onInsertSnippet }: { onInsertSnippet: (id: AmicoEmailSnippetId) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onInsertSnippet("cross-sell")}
        className="rounded-[3px] border border-[#cbd6e2] bg-[#f5f8fa] px-2 py-0.5 font-semibold text-[#006162] hover:bg-[#e6f7f7]"
        data-testid="email-insert-snippet-btn"
      >
        Insert snippet
      </button>
      <span className="text-[#7c98b6]">B · I · U · Link</span>
    </div>
  );
}

function EmailAssocFooter({
  trackOpens,
  trackClicks,
  logToCrm,
  assocContact,
  assocCompany,
  assocDeal,
  hasContact,
  hasCompany,
  hasDeal,
  onTrackOpens,
  onTrackClicks,
  onLogToCrm,
  onAssocContact,
  onAssocCompany,
  onAssocDeal,
}: {
  trackOpens: boolean;
  trackClicks: boolean;
  logToCrm: boolean;
  assocContact: boolean;
  assocCompany: boolean;
  assocDeal: boolean;
  hasContact: boolean;
  hasCompany: boolean;
  hasDeal: boolean;
  onTrackOpens: (v: boolean) => void;
  onTrackClicks: (v: boolean) => void;
  onLogToCrm: (v: boolean) => void;
  onAssocContact: (v: boolean) => void;
  onAssocCompany: (v: boolean) => void;
  onAssocDeal: (v: boolean) => void;
}) {
  const { dispatch } = useShell();
  return (
    <div
      className="space-y-2 border-t border-[#eaf0f6] bg-[#fafbfc] px-3.5 py-2.5 text-[11.5px] text-[#516f90]"
      data-testid="email-crm-options"
    >
      <div className="flex flex-wrap gap-4">
        <label className="inline-flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={trackOpens}
            onChange={(e) => {
              onTrackOpens(e.target.checked);
              if (e.target.checked) dispatch({ t: "flag", k: "email.track.opens" });
            }}
            data-testid="email-track-opens"
          />
          Track email opens
        </label>
        <label className="inline-flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={trackClicks}
            onChange={(e) => {
              onTrackClicks(e.target.checked);
              if (e.target.checked) dispatch({ t: "flag", k: "email.track.clicks" });
            }}
            data-testid="email-track-clicks"
          />
          Track clicks
        </label>
        <label className="inline-flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={logToCrm}
            onChange={(e) => onLogToCrm(e.target.checked)}
            data-testid="email-log-to-crm"
          />
          Log to CRM
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-semibold text-[#33475b]">Associated records:</span>
        <label className={cx("inline-flex items-center gap-1.5", !hasContact && "opacity-50")}>
          <input
            type="checkbox"
            disabled={!hasContact}
            checked={assocContact}
            onChange={(e) => onAssocContact(e.target.checked)}
            data-testid="email-assoc-contact"
          />
          Contact
        </label>
        <label className={cx("inline-flex items-center gap-1.5", !hasCompany && "opacity-50")}>
          <input
            type="checkbox"
            disabled={!hasCompany}
            checked={assocCompany}
            onChange={(e) => onAssocCompany(e.target.checked)}
            data-testid="email-assoc-company"
          />
          Company
        </label>
        <label className={cx("inline-flex items-center gap-1.5", !hasDeal && "opacity-50")}>
          <input
            type="checkbox"
            disabled={!hasDeal}
            checked={assocDeal}
            onChange={(e) => onAssocDeal(e.target.checked)}
            data-testid="email-assoc-deal"
          />
          Deal
        </label>
      </div>
    </div>
  );
}