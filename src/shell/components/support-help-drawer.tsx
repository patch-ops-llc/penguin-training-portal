"use client";

export function SupportHelpDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[71] flex justify-end" data-testid="support-help-drawer">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close help" onClick={onClose} />
      <aside className="relative w-full max-w-[400px] bg-white shadow-2xl">
        <header className="border-b border-[#dfe3eb] px-4 py-3">
          <h2 className="text-[15px] font-semibold text-[#33475b]">HubSpot Support &amp; AMICO Enablement</h2>
        </header>
        <ul className="space-y-3 px-4 py-4 text-[13px] text-[#33475b]">
          <li>
            <strong>Ask Breeze Assistant</strong> — first-line answers on AMICO CRM rules (top bar).
          </li>
          <li>
            <a href="https://knowledge.hubspot.com" className="text-[#006162] font-semibold" target="_blank" rel="noreferrer">
              HubSpot Knowledge Base
            </a>{" "}
            — how-to articles and in-app help.
          </li>
          <li>
            <strong>NSM escalation</strong> — duplicate merges, ERP quote errors, and permission changes go to your National Sales Manager, not manual HubSpot edits.
          </li>
          <li>
            <a href="/launchpad" className="text-[#006162] font-semibold">
              Penguin Training Portal
            </a>{" "}
            — interactive modules, Reference Guide checklists, and go-live readiness tracking.
          </li>
        </ul>
        <button type="button" onClick={onClose} data-testid="support-help-close" className="mx-4 mb-4 w-[calc(100%-2rem)] rounded border border-[#cbd6e2] py-2 text-[12px] font-semibold">
          Close
        </button>
      </aside>
    </div>
  );
}