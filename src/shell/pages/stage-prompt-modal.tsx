"use client";

import { useState } from "react";
import type { StagePromptValues } from "@/store/world";
import type { Deal, DealStage } from "@/tenants/types";
import { Button, Modal } from "../ui";

/**
 * Stage Properties Gate Modal triggered when moving a Deal into a stage with `prompt`
 * (`Design / Estimating` -> Drawings Received, `Engineering Review` -> Engineering Required,
 * `Awarded - Won` -> required Project / Handoff Required + PO/Order #, `Closed - Lost` -> required Lost Reason).
 */
export function StagePromptModal({
  deal,
  targetStage,
  onCancel,
  onConfirm,
}: {
  deal: Deal;
  targetStage: DealStage;
  onCancel: () => void;
  onConfirm: (values: StagePromptValues) => void;
}) {
  const prompt = targetStage.prompt;
  const [drawingsReceived, setDrawingsReceived] = useState<Deal["drawingsReceived"]>(deal.drawingsReceived ?? "Yes");
  const [engineeringRequired, setEngineeringRequired] = useState<Deal["engineeringRequired"]>(deal.engineeringRequired ?? "In-house");
  const [handoffRequired, setHandoffRequired] = useState<Deal["handoffRequired"]>(deal.handoffRequired ?? "Yes");
  const [customerPo, setCustomerPo] = useState(deal.customerPo ?? "");
  const [amicoOrderNumber, setAmicoOrderNumber] = useState(deal.amicoOrderNumber ?? "");
  const [poReceivedDate, setPoReceivedDate] = useState(deal.poReceivedDate ?? new Date().toISOString().slice(0, 10));
  const [lostReason, setLostReason] = useState(deal.lostReason ?? "");
  const [lostReasonDetail, setLostReasonDetail] = useState(deal.lostReasonDetail ?? "");
  const [lostNotes, setLostNotes] = useState(deal.lostNotes ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!prompt) return null;

  function submit() {
    if (prompt?.field === "handoffRequired") {
      if (!handoffRequired) {
        setValidationError("Select whether a Project / PM Handoff is required before marking Awarded.");
        return;
      }
      if (prompt.includePoFields && !customerPo.trim()) {
        setValidationError("Customer PO # is required at Awarded.");
        return;
      }
      onConfirm({
        handoffRequired,
        customerPo: customerPo.trim(),
        amicoOrderNumber: amicoOrderNumber.trim() || `SO-${Math.floor(88000 + Math.random() * 900)}`,
        poReceivedDate,
      });
      return;
    }
    if (prompt?.field === "lostReason") {
      if (!lostReason) {
        setValidationError("Lost Reason is required before closing a deal as Lost.");
        return;
      }
      onConfirm({
        lostReason,
        lostReasonDetail: lostReasonDetail.trim(),
        lostNotes: lostNotes.trim(),
      });
      return;
    }
    if (prompt?.field === "drawingsReceived") {
      onConfirm({ drawingsReceived: drawingsReceived ?? "Yes" });
      return;
    }
    if (prompt?.field === "engineeringRequired") {
      onConfirm({ engineeringRequired: engineeringRequired ?? "In-house" });
      return;
    }
    onConfirm({});
  }

  return (
    <Modal
      title={`${prompt.label} · Move to ${targetStage.label}`}
      onClose={onCancel}
      testId="stage-prompt-modal"
      footer={
        <>
          <Button onClick={onCancel}>Cancel</Button>
          <Button variant="primary" onClick={submit} data-testid="stage-prompt-save">
            Save &amp; update stage
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-[13.5px]">
        {prompt.helperText ? <p className="text-[13px] text-ink-muted">{prompt.helperText}</p> : null}

        {prompt.field === "drawingsReceived" ? (
          <label className="block space-y-1">
            <span className="font-semibold">{prompt.label} *</span>
            <select
              value={drawingsReceived ?? "Yes"}
              onChange={(e) => setDrawingsReceived(e.target.value as Deal["drawingsReceived"])}
              data-testid="prompt-drawings-select"
              className="h-9 w-full rounded-[6px] border border-line bg-white px-3"
            >
              {prompt.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {prompt.field === "engineeringRequired" ? (
          <label className="block space-y-1">
            <span className="font-semibold">{prompt.label} *</span>
            <select
              value={engineeringRequired ?? "In-house"}
              onChange={(e) => setEngineeringRequired(e.target.value as Deal["engineeringRequired"])}
              data-testid="prompt-engineering-select"
              className="h-9 w-full rounded-[6px] border border-line bg-white px-3"
            >
              {prompt.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {prompt.field === "handoffRequired" ? (
          <>
            <label className="block space-y-1">
              <span className="font-semibold">{prompt.label} *</span>
              <select
                value={handoffRequired ?? "Yes"}
                onChange={(e) => setHandoffRequired(e.target.value as Deal["handoffRequired"])}
                data-testid="prompt-handoff-select"
                className="h-9 w-full rounded-[6px] border border-line bg-white px-3"
              >
                {prompt.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            {prompt.includePoFields ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-1">
                    <span className="font-semibold">Customer PO # *</span>
                    <input
                      type="text"
                      value={customerPo}
                      onChange={(e) => setCustomerPo(e.target.value)}
                      placeholder="PO-99418"
                      data-testid="prompt-customer-po"
                      className="h-9 w-full rounded-[6px] border border-line bg-white px-3"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="font-semibold">AMICO Order #</span>
                    <input
                      type="text"
                      value={amicoOrderNumber}
                      onChange={(e) => setAmicoOrderNumber(e.target.value)}
                      placeholder="SO-88412"
                      data-testid="prompt-amico-order"
                      className="h-9 w-full rounded-[6px] border border-line bg-white px-3"
                    />
                  </label>
                </div>
                <label className="block space-y-1">
                  <span className="font-semibold">PO Received Date</span>
                  <input
                    type="date"
                    value={poReceivedDate}
                    onChange={(e) => setPoReceivedDate(e.target.value)}
                    className="h-9 w-full rounded-[6px] border border-line bg-white px-3"
                  />
                </label>
              </>
            ) : null}
          </>
        ) : null}

        {prompt.field === "lostReason" ? (
          <>
            <label className="block space-y-1">
              <span className="font-semibold">{prompt.label} *</span>
              <select
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                data-testid="prompt-lost-reason"
                className="h-9 w-full rounded-[6px] border border-line bg-white px-3"
              >
                <option value="">Select a required reason…</option>
                {prompt.options.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            {prompt.includeLossDetails ? (
              <>
                <label className="block space-y-1">
                  <span className="font-semibold">Competitor / Secondary Detail</span>
                  <input
                    type="text"
                    value={lostReasonDetail}
                    onChange={(e) => setLostReasonDetail(e.target.value)}
                    placeholder="e.g., Competitor offered 4-week lead time"
                    data-testid="prompt-lost-detail"
                    className="h-9 w-full rounded-[6px] border border-line bg-white px-3"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="font-semibold">Closed Lost Notes</span>
                  <textarea
                    rows={2}
                    value={lostNotes}
                    onChange={(e) => setLostNotes(e.target.value)}
                    placeholder="Post-bid feedback from estimator or GC…"
                    className="w-full rounded-[6px] border border-line bg-white p-2.5"
                  />
                </label>
              </>
            ) : null}
          </>
        ) : null}

        {validationError ? (
          <p role="alert" className="rounded-[6px] border border-[#f3b4b4] bg-[#fdf1f1] px-3 py-2 text-[12.5px] font-medium text-[#99201a]">
            {validationError}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
