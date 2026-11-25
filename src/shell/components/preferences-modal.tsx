"use client";

import { useShell } from "@/store/store";
import { Button } from "../ui";

export function PreferencesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { world, dispatch, navigate } = useShell();
  if (!open) return null;

  const p = world.profile;

  return (
    <div className="fixed inset-0 z-[71] flex items-start justify-center bg-black/45 pt-[8vh]" data-testid="preferences-modal">
      <div
        role="dialog"
        aria-labelledby="prefs-modal-title"
        className="w-full max-w-[640px] rounded-lg bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-[#dfe3eb] px-5 py-4">
          <h2 id="prefs-modal-title" className="text-[17px] font-semibold text-[#33475b]">
            General · Notifications &amp; Email Preferences
          </h2>
          <button type="button" onClick={onClose} data-testid="preferences-modal-close" className="text-[12px] font-semibold text-[#516f90]">
            Close
          </button>
        </header>
        <div className="space-y-4 px-5 py-4 text-[13px]">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              defaultChecked={p.taskReminders}
              data-testid="prefs-task-reminders"
              onChange={(e) => dispatch({ t: "profile.update", patch: { taskReminders: e.target.checked } })}
            />
            Task reminder emails (due today / overdue)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              defaultChecked={p.mentionAlerts}
              data-testid="prefs-mention-alerts"
              onChange={(e) => dispatch({ t: "profile.update", patch: { mentionAlerts: e.target.checked } })}
            />
            @mention bell and email alerts
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              defaultChecked={!p.noisyPropertyAlerts}
              data-testid="prefs-deal-stage"
              onChange={(e) => dispatch({ t: "profile.update", patch: { noisyPropertyAlerts: !e.target.checked } })}
            />
            Deal stage change notifications for my owned deals
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              defaultChecked={p.outlookConnected}
              data-testid="prefs-outlook-connected"
              onChange={(e) => dispatch({ t: "profile.update", patch: { outlookConnected: e.target.checked } })}
            />
            Connected Outlook 365 signature for tracked sales email
          </label>
        </div>
        <footer className="flex justify-end gap-2 border-t border-[#dfe3eb] px-5 py-3">
          <Button
            size="sm"
            onClick={() => {
              dispatch({
                t: "profile.update",
                patch: { taskReminders: true, mentionAlerts: true, outlookConnected: true, noisyPropertyAlerts: false },
              });
              dispatch({ t: "flag", k: "prefs.modalOpened" });
            }}
            data-testid="preferences-modal-save"
          >
            Save notification preferences
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              onClose();
              navigate("/profile");
            }}
            data-testid="preferences-open-full-profile"
          >
            Open full Profile page
          </Button>
        </footer>
      </div>
    </div>
  );
}