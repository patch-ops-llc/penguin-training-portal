"use client";

import { useState } from "react";
import { useShell } from "@/store/store";
import type { StagePromptValues } from "@/store/world";
import type { Deal, DealStage } from "@/tenants/types";
import { Icon } from "../icons";
import { Button, Modal, Tag } from "../ui";

/**
 * Authentic HubSpot Required-Property Stage Gate Modal:
 * "Properties required for [Stage Name]" — disables Save until all required `*` stage properties are populated.
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
  const { pack } = useShell();
  const prompt = targetStage.prompt;
  const pipeline = pack.pipelines.find((p) => p.id === deal.pipelineId);
  const currentStageLabel = pipeline?.stages.find((s) => s.id === deal.stage)?.label ?? deal.stage;

  const [drawingsReceived, setDrawingsReceived] = useState<Deal["drawingsReceived"]>(deal.drawingsReceived ?? "Yes");
  const [engineeringRequired, setEngineeringRequired] = useState<Deal["engineeringRequired"]>(deal.engineeringRequired ?? "In-house");
  const [handoffRequired, setHandoffRequired] = useState<Deal["handoffRequired"]>(deal.handoffRequired ?? "Yes");
  const [customerPo, setCustomerPo] = useState(deal.customerPo ?? "");
  const [amicoOrderNumber, setAmicoOrderNumber] = useState(deal.amicoOrderNumber ?? "");
  const [poReceivedDate, setPoReceivedDate] = useState(deal.poReceivedDate ?? new Date().toISOString().slice(0, 10));
  const [lostReason, setLostReason] = useState(deal.lostReason ?? "");
  const [lostReasonDetail, setLostReasonDetail] = useState(deal.lostReasonDetail ?? "");
  const [lostNotes, setLostNotes] = useState(deal.lostNotes ?? "");

  if (!prompt) return null;

  const missingMessage =
    prompt.field === "handoffRequired" && !handoffRequired
      ? "Project / Handoff Required is required before moving to Awarded."
      : prompt.field === "handoffRequired" && prompt.includePoFields && !customerPo.trim()
        ? "Customer PO # is required before moving to Awarded."
        : prompt.field === "lostReason" && !lostReason
          ? "Lost Reason is required before closing a deal as Lost."
          : null;

  const isValid = !missingMessage;

  function submit() {
    if (!isValid || !prompt) return;
    if (prompt.field === "handoffRequired") {
      onConfirm({
        handoffRequired,
        customerPo: customerPo.trim(),
        amicoOrderNumber: amicoOrderNumber.trim() || `SO-${Math.floor(88000 + Math.random() * 900)}`,
        poReceivedDate,
      });
      return;
    }
    if (prompt.field === "lostReason") {
      onConfirm({
        lostReason,
        lostReasonDetail: lostReasonDetail.trim(),
        lostNotes: lostNotes.trim(),
      });
      return;
    }
    if (prompt.field === "drawingsReceived") {
      onConfirm({ drawingsReceived: drawingsReceived ?? "Yes" });
      return;
    }
    if (prompt.field === "engineeringRequired") {
      onConfirm({ engineeringRequired: engineeringRequired ?? "In-house" });
      return;
    }
    onConfirm({});
  }

  return (
    <Modal
      title={`Properties required for ${targetStage.label}`}
      subtitle={`Update deal stage · ${deal.name}`}
      onClose={onCancel}
      width={540}
      testId="stage-prompt-modal"
      footer={
        <>
          <Button variant="primary" disabled={!isValid} onClick={submit} data-testid="stage-prompt-save">
            Save
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </>
      }
    >
      <div className="space-y-4 text-[13px]">
        {/* Stage Transition Header Strip */}
        <div className="flex items-center justify-between rounded-[4px] border border-[#dfe3eb] bg-[#f5f8fa] px-3.5 py-2.5 text-[12px]">
          <div className="flex items-center gap-2">
            <Tag tone="neutral">{currentStageLabel}</Tag>
            <Icon name="arrowRight" size={13} className="text-[#516f90]" />
            <Tag tone="blue">{targetStage.label}</Tag>
          </div>
          <span className="font-medium text-[#516f90]">
            {targetStage.probability > 0 && targetStage.probability <= 1
              ? Math.round(targetStage.probability * 100)
              : Math.round(targetStage.probability)}
            % probability
          </span>
        </div>

        <p className="text-[12.5px] text-[#516f90]">
          {prompt.helperText ??
            `Complete the required stage properties below before advancing this deal to ${targetStage.label}.`}
        </p>

        {prompt.field === "drawingsReceived" ? (
          <label className="block space-y-1">
            <span className="font-semibold text-[#33475b]">
              {prompt.label} <span className="text-[#f2545b]">*</span>
            </span>
            <span className="block text-[11.5px] text-[#516f90]">
              Indicates whether architectural / perimeter drawings are attached for takeoff.
            </span>
            <select
              value={drawingsReceived ?? "Yes"}
              onChange={(e) => setDrawingsReceived(e.target.value as Deal["drawingsReceived"])}
              data-testid="prompt-drawings-select"
              className="hs-input w-full !bg-white"
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
            <span className="font-semibold text-[#33475b]">
              {prompt.label} <span className="text-[#f2545b]">*</span>
            </span>
            <span className="block text-[11.5px] text-[#516f90]">
              Selecting In-house or Third-party automatically assigns an Engineering Review task to the Estimator.
            </span>
            <select
              value={engineeringRequired ?? "In-house"}
              onChange={(e) => setEngineeringRequired(e.target.value as Deal["engineeringRequired"])}
              data-testid="prompt-engineering-select"
              className="hs-input w-full !bg-white"
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
              <span className="font-semibold text-[#33475b]">
                {prompt.label} <span className="text-[#f2545b]">*</span>
              </span>
              <span className="block text-[11.5px] text-[#516f90]">
                Setting Yes auto-creates a linked HubSpot Project and assigns post-award delivery to the Security PM.
              </span>
              <select
                value={handoffRequired ?? "Yes"}
                onChange={(e) => setHandoffRequired(e.target.value as Deal["handoffRequired"])}
                data-testid="prompt-handoff-select"
                className="hs-input w-full !bg-white"
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
                    <span className="font-semibold text-[#33475b]">
                      Customer PO # <span className="text-[#f2545b]">*</span>
                    </span>
                    <input
                      type="text"
                      value={customerPo}
                      onChange={(e) => setCustomerPo(e.target.value)}
                      placeholder="PO-VCC-44910"
                      data-testid="prompt-customer-po"
                      className="hs-input w-full !bg-white"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="font-semibold text-[#33475b]">AMICO Order #</span>
                    <input
                      type="text"
                      value={amicoOrderNumber}
                      onChange={(e) => setAmicoOrderNumber(e.target.value)}
                      placeholder="SO-88412"
                      data-testid="prompt-amico-order"
                      className="hs-input w-full !bg-white"
                    />
                  </label>
                </div>
                <label className="block space-y-1">
                  <span className="font-semibold text-[#33475b]">PO Received Date</span>
                  <input
                    type="date"
                    value={poReceivedDate}
                    onChange={(e) => setPoReceivedDate(e.target.value)}
                    className="hs-input w-full !bg-white"
                  />
                </label>
              </>
            ) : null}
          </>
        ) : null}

        {prompt.field === "lostReason" ? (
          <>
            <label className="block space-y-1">
              <span className="font-semibold text-[#33475b]">
                {prompt.label} <span className="text-[#f2545b]">*</span>
              </span>
              <span className="block text-[11.5px] text-[#516f90]">
                Required for AMICO executive win/loss reporting across divisions.
              </span>
              <select
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                data-testid="prompt-lost-reason"
                className="hs-input w-full !bg-white"
              >
                <option value="">Please select…</option>
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
                  <span className="font-semibold text-[#33475b]">Competitor / Secondary Detail</span>
                  <input
                    type="text"
                    value={lostReasonDetail}
                    onChange={(e) => setLostReasonDetail(e.target.value)}
                    placeholder="e.g., Incumbent regional GC lost prime bid"
                    data-testid="prompt-lost-detail"
                    className="hs-input w-full !bg-white"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="font-semibold text-[#33475b]">Closed Lost Notes</span>
                  <textarea
                    rows={2}
                    value={lostNotes}
                    onChange={(e) => setLostNotes(e.target.value)}
                    placeholder="Post-bid feedback from estimator or GC…"
                    className="hs-input w-full !bg-white"
                  />
                </label>
              </>
            ) : null}
          </>
        ) : null}

        {missingMessage ? (
          <p
            role="alert"
            className="flex items-center gap-2 rounded-[4px] border border-[#f5c26b] bg-[#fef6e7] px-3 py-2 text-[12px] font-medium text-[#8a5300]"
          >
            <Icon name="warning" size={14} className="shrink-0 text-[#d97706]" />
            <span>{missingMessage}</span>
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
