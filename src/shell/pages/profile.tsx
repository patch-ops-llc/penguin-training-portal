"use client";

import { useState } from "react";
import { useShell } from "@/store/store";
import { Ext } from "../ext";
import { Icon } from "../icons";
import { Avatar, Button, Card, Tag, Toast } from "../ui";

const TIMEZONES = [
  "America/Chicago (CST/CDT)",
  "America/New_York (EST/EDT)",
  "America/Phoenix (MST)",
  "America/Los_Angeles (PST/PDT)",
  "America/Toronto (EST/EDT)",
];

export function ProfilePage() {
  const { world, persona, dispatch } = useShell();
  const [timezone, setTimezone] = useState(world.profile.timezone);
  const [workingHoursStart, setWorkingHoursStart] = useState(world.profile.workingHoursStart);
  const [workingHoursEnd, setWorkingHoursEnd] = useState(world.profile.workingHoursEnd);
  const [taskReminders, setTaskReminders] = useState(world.profile.taskReminders);
  const [mentionAlerts, setMentionAlerts] = useState(world.profile.mentionAlerts);
  const [noisyPropertyAlerts, setNoisyPropertyAlerts] = useState(world.profile.noisyPropertyAlerts);
  const [outlookConnected, setOutlookConnected] = useState(world.profile.outlookConnected);
  const [outlookAddInInstalled, setOutlookAddInInstalled] = useState(world.profile.outlookAddInInstalled);
  const [savedToast, setSavedToast] = useState(false);

  const isSaved = world.flags["profile.saved"] === true;

  function save() {
    dispatch({
      t: "profile.update",
      patch: {
        timezone,
        workingHoursStart,
        workingHoursEnd,
        taskReminders,
        mentionAlerts,
        noisyPropertyAlerts,
        outlookConnected,
        outlookAddInInstalled,
      },
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2400);
  }

  return (
    <div className="mx-auto max-w-[920px] space-y-5 px-6 py-6" data-testid="profile-page">
      {savedToast ? <Toast>Profile &amp; notification preferences saved.</Toast> : null}

      <header className="flex items-center justify-between border-b border-line pb-4">
        <div className="flex items-center gap-3.5">
          <Avatar name={persona.name} color={persona.color} size={46} />
          <div>
            <h1 className="text-[21px] font-semibold">Profile &amp; Preferences</h1>
            <p className="text-[13px] text-ink-muted">
              {persona.name} · {persona.title} · {persona.division}
            </p>
          </div>
        </div>
        <Button variant="primary" onClick={save} data-testid="save-profile-btn">
          Save preferences
        </Button>
      </header>

      <Ext id="profile-outlook-setup">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Card title="General · Timezone & Working Hours" testId="profile-general-card">
            <div className="space-y-4 text-[13.5px]">
              <label className="block space-y-1">
                <span className="text-[12px] font-semibold text-ink-muted">Time zone</span>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  data-testid="profile-timezone-select"
                  className="h-9 w-full rounded-[6px] border border-line bg-white px-3 text-[13.5px]"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-[12px] font-semibold text-ink-muted">Start of day</span>
                  <input
                    type="text"
                    value={workingHoursStart}
                    onChange={(e) => setWorkingHoursStart(e.target.value)}
                    data-testid="profile-hours-start"
                    className="h-9 w-full rounded-[6px] border border-line bg-white px-3 text-[13.5px]"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[12px] font-semibold text-ink-muted">End of day</span>
                  <input
                    type="text"
                    value={workingHoursEnd}
                    onChange={(e) => setWorkingHoursEnd(e.target.value)}
                    data-testid="profile-hours-end"
                    className="h-9 w-full rounded-[6px] border border-line bg-white px-3 text-[13.5px]"
                  />
                </label>
              </div>
            </div>
          </Card>

          <Card title="Connected Email & Calendar (Microsoft 365)" testId="profile-outlook-card">
            <div className="space-y-3 text-[13.5px]">
              <div className="flex items-center justify-between rounded-[8px] border border-line-soft bg-[#fafafa] px-3.5 py-3">
                <div>
                  <p className="font-semibold">Microsoft Outlook 365</p>
                  <p className="text-[12px] text-ink-muted">{world.profile.outlookEmail || persona.email}</p>
                </div>
                <Tag tone={outlookConnected ? "green" : "amber"}>
                  {outlookConnected ? "Connected" : "Not connected"}
                </Tag>
              </div>
              <label className="flex items-center gap-2 text-[12.5px]">
                <input
                  type="checkbox"
                  checked={outlookAddInInstalled}
                  onChange={(e) => setOutlookAddInInstalled(e.target.checked)}
                />
                <span>HubSpot Sales Outlook Add-in pinned in ribbon</span>
              </label>
              <Button
                size="sm"
                variant={outlookConnected ? "secondary" : "primary"}
                icon="email"
                data-testid="toggle-outlook-btn"
                onClick={() => setOutlookConnected((v) => !v)}
              >
                {outlookConnected ? "Verify connection" : "Connect Outlook 365"}
              </Button>
            </div>
          </Card>
        </div>
      </Ext>

      <Card title="Notifications · Tasks, @Mentions & Noise Control" testId="profile-notifications-card">
        <div className="space-y-3 text-[13.5px]">
          <label className="flex items-start gap-3 rounded-[8px] border border-line-soft p-3">
            <input
              type="checkbox"
              checked={taskReminders}
              onChange={(e) => setTaskReminders(e.target.checked)}
              data-testid="notif-task-checkbox"
              className="mt-1"
            />
            <div>
              <span className="font-semibold">Task reminders &amp; assignments (Email &amp; Bell)</span>
              <p className="text-[12px] text-ink-muted">
                Required at AMICO so automated workflow tasks (Engineering Review, Quote Follow-Up, Stuck Deal) never go missed.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-[8px] border border-line-soft p-3">
            <input
              type="checkbox"
              checked={mentionAlerts}
              onChange={(e) => setMentionAlerts(e.target.checked)}
              data-testid="notif-mentions-checkbox"
              className="mt-1"
            />
            <div>
              <span className="font-semibold">@Mentions on notes, deals &amp; projects</span>
              <p className="text-[12px] text-ink-muted">
                Alerts you immediately when another division rep, estimator, or PM tags you on a shared account.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-[8px] border border-line-soft p-3">
            <input
              type="checkbox"
              checked={noisyPropertyAlerts}
              onChange={(e) => setNoisyPropertyAlerts(e.target.checked)}
              className="mt-1"
            />
            <div>
              <span className="font-semibold">Every automated ERP sync property change (keep unchecked to avoid alert fatigue)</span>
              <p className="text-[12px] text-ink-muted">AMICO best practice: turn off noisy background field-sync alerts.</p>
            </div>
          </label>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-line-soft pt-3 text-[12.5px] text-ink-muted">
          <span className="flex items-center gap-1.5">
            <Icon name="info" size={14} /> Status: {isSaved ? "Saved in this training session" : "Ready to save"}
          </span>
          <Button variant="primary" size="sm" onClick={save}>
            Save preferences
          </Button>
        </div>
      </Card>
    </div>
  );
}
