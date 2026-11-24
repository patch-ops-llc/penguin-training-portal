"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { TenantLockup } from "@/components/brand";
import { AMICO_BRAND, TenantLogo } from "@/components/tenant-logo";
import { emitEvent } from "@/lib/beacon";
import { hasSavedSession } from "@/store/session";
import type { TrainingModuleMeta, TrainingTrackMeta } from "@/tenants/types";
import { switchActiveTenantAction } from "./actions";

const emptySubscribe = () => () => {};

export interface ModuleProgressSnapshot {
  status: "IN_PROGRESS" | "COMPLETED";
  furthestStep: number;
  totalSteps: number;
  completedCount: number;
  usedShowMeCount: number;
}

const ROLE_FILTERS = ["All roles", "Sales Rep", "Inside Sales Rep", "Estimator", "Sales Manager / NSM", "Project Manager", "Executive"] as const;

export function Launchpad({
  user,
  tenant,
  allTenants,
  tracks,
  requiredTrackIds,
  packVersions,
  progressMap,
}: {
  user: {
    email: string;
    name: string | null;
    role: "PENGUIN_ADMIN" | "CLIENT_ADMIN" | "TRAINEE";
    division: string | null;
    jobRole: string | null;
    trackLocked: boolean;
  };
  tenant: { slug: string; name: string; accentColor: string };
  allTenants: { slug: string; name: string }[];
  tracks: TrainingTrackMeta[];
  requiredTrackIds: string[];
  packVersions: Record<string, string>;
  progressMap: Record<string, ModuleProgressSnapshot>;
}) {
  const [roleFilter, setRoleFilter] = useState<string>("All roles");
  const [query, setQuery] = useState("");
  const [openTrackIds, setOpenTrackIds] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(tracks.map((t) => [t.id, true])),
  );
  const hydrated = useSyncExternalStore(emptySubscribe, () => true, () => false);

  useEffect(() => {
    emitEvent({ type: "launchpad_opened", tenantSlug: tenant.slug });
  }, [tenant.slug]);

  // Warm the authenticated immutable pack cache in the background on idle
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      for (const t of tracks) {
        if (controller.signal.aborted) break;
        const ver = packVersions[t.id];
        if (!ver) continue;
        try {
          await fetch(`/api/packs/${ver}/${tenant.slug}/${t.id}`, { credentials: "same-origin", signal: controller.signal });
        } catch {
          break;
        }
      }
    }, 350);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [packVersions, tenant.slug, tracks]);

  const q = query.trim().toLowerCase();
  const filterModule = (mod: TrainingModuleMeta, track: TrainingTrackMeta) => {
    const roleMatch = roleFilter === "All roles" || mod.roleTags.includes(roleFilter);
    if (!roleMatch) return false;
    if (!q) return true;
    const hay = `${track.title} ${track.division} ${mod.code} ${mod.title} ${mod.summary} ${mod.objective}`.toLowerCase();
    return hay.includes(q);
  };

  const requiredTracks = tracks.filter((t) => requiredTrackIds.includes(t.id));
  const optionalTracks = tracks.filter((t) => !requiredTrackIds.includes(t.id));

  // Overall required-module completion stats
  const requiredModules = (requiredTracks.length > 0 ? requiredTracks : tracks).flatMap((t) =>
    t.modules.map((m) => ({ trackId: t.id, moduleId: m.id })),
  );
  const completedRequiredCount = requiredModules.filter(
    (m) => progressMap[`${m.trackId}/${m.moduleId}`]?.status === "COMPLETED",
  ).length;
  const pct = requiredModules.length > 0 ? Math.round((completedRequiredCount / requiredModules.length) * 100) : 0;

  const isAdmin = user.role === "CLIENT_ADMIN" || user.role === "PENGUIN_ADMIN";

  function toggleTrack(trackId: string) {
    setOpenTrackIds((prev) => {
      const next = !prev[trackId];
      if (next) emitEvent({ type: "track_opened", tenantSlug: tenant.slug, trackId });
      return { ...prev, [trackId]: next };
    });
  }

  function renderTrackCard(track: TrainingTrackMeta, isRequired: boolean) {
    const filteredModules = track.modules.filter((m) => filterModule(m, track));
    if (filteredModules.length === 0 && (q || roleFilter !== "All roles")) return null;

    const trackCompleted = track.modules.filter((m) => progressMap[`${track.id}/${m.id}`]?.status === "COMPLETED").length;
    const isOpen = openTrackIds[track.id] ?? true;

    return (
      <article
        key={track.id}
        data-testid={`track-${track.id}`}
        className="overflow-hidden rounded-[12px] border border-line bg-surface shadow-[0_1px_3px_rgba(45,62,80,0.06)] transition hover:border-[#adbcd1]"
      >
        <button
          type="button"
          onClick={() => toggleTrack(track.id)}
          aria-expanded={isOpen}
          className="flex w-full items-start gap-5 px-6 py-5 text-left"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {isRequired ? (
                <span className="rounded-full bg-penguin-soft px-2.5 py-0.5 font-penguin text-[11px] font-semibold text-penguin">
                  Required for your role
                </span>
              ) : (
                <span className="rounded-full bg-surface-sunken px-2.5 py-0.5 text-[11px] font-medium text-ink-muted">
                  Optional curriculum
                </span>
              )}
              <span className="rounded-full border border-line px-2.5 py-0.5 text-[11px] font-medium text-ink-soft">
                {track.division}
              </span>
              <span className="text-[12px] text-ink-muted">{track.subtitle}</span>
            </div>
            <h3 className="mt-1.5 font-display text-[18.5px] font-semibold text-ink">{track.title}</h3>
            <p className="mt-1 text-[13.5px] text-ink-soft">{track.summary}</p>
          </div>
          <div className="flex shrink-0 items-center gap-4 pt-1">
            <div className="text-right">
              <div className="text-[13px] font-semibold text-ink tabular-nums">
                {trackCompleted} / {track.modules.length} completed
              </div>
              <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-surface-sunken">
                <div
                  className="h-full rounded-full bg-success transition-all"
                  style={{ width: `${track.modules.length ? Math.round((trackCompleted / track.modules.length) * 100) : 0}%` }}
                />
              </div>
            </div>
            <span
              className={`grid h-8 w-8 place-items-center rounded-full border border-line text-ink-soft transition ${isOpen ? "rotate-180 bg-surface-subtle" : ""}`}
              aria-hidden="true"
            >
              ▾
            </span>
          </div>
        </button>

        {isOpen ? (
          <div className="border-t border-line bg-surface-subtle px-6 py-5">
            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
              {filteredModules.map((mod) => {
                const key = `${track.id}/${mod.id}`;
                const prog = progressMap[key];
                const canResume = Boolean(
                  (hydrated && hasSavedSession(tenant.slug, track.id, mod.id)) ||
                    (prog && prog.furthestStep > 1 && prog.status !== "COMPLETED"),
                );
                const baseHref = `/learn/${tenant.slug}/${track.id}/${mod.id}`;
                const isCompleted = prog?.status === "COMPLETED";
                const ctaHref = canResume ? baseHref : `${baseHref}?fresh=1`;
                const ctaLabel = isCompleted ? "Replay →" : canResume ? "Continue →" : "Start module →";
                const statusBadge =
                  prog?.status === "COMPLETED" ? (
                    <span
                      data-testid={`status-${track.id}-${mod.id}`}
                      className="rounded-full bg-success-soft px-2.5 py-0.5 text-[11px] font-semibold text-success"
                    >
                      ✓ Completed
                    </span>
                  ) : prog?.status === "IN_PROGRESS" ? (
                    <span
                      data-testid={`status-${track.id}-${mod.id}`}
                      className="rounded-full bg-info-soft px-2.5 py-0.5 text-[11px] font-semibold text-info"
                    >
                      In progress · Step {prog.furthestStep}{prog.totalSteps ? `/${prog.totalSteps}` : ""}
                    </span>
                  ) : (
                    <span
                      data-testid={`status-${track.id}-${mod.id}`}
                      className="rounded-full bg-surface px-2.5 py-0.5 text-[11px] font-medium text-ink-muted"
                    >
                      Not started
                    </span>
                  );

                return (
                  <div
                    key={mod.id}
                    data-testid={`module-${track.id}-${mod.id}`}
                    className="flex flex-col justify-between rounded-[10px] border border-line bg-surface p-4"
                  >
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11.5px]">
                        <span className="font-semibold tracking-wide text-penguin">{mod.code}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-ink-muted">~{mod.minutes} min</span>
                          {statusBadge}
                        </div>
                      </div>
                      <h4 className="mt-1.5 font-display text-[15px] font-semibold text-ink">
                        <Link
                          href={ctaHref}
                          data-testid={`title-link-${track.id}-${mod.id}`}
                          className="transition-colors hover:text-brand hover:underline"
                        >
                          {mod.title}
                        </Link>
                      </h4>
                      <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{mod.summary}</p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {mod.roleTags.map((tag) => (
                          <span key={tag} className="rounded bg-surface-sunken px-2 py-0.5 text-[11px] text-ink-muted">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2.5 pt-1">
                      <Link
                        href={ctaHref}
                        data-testid={`launch-${track.id}-${mod.id}`}
                        className="inline-flex items-center gap-1.5 rounded-[6px] bg-brand px-3.5 py-1.5 text-[13px] font-semibold text-white shadow-xs transition hover:bg-brand-hover"
                      >
                        {ctaLabel}
                      </Link>
                      {canResume ? (
                        <Link
                          href={`${baseHref}?fresh=1`}
                          data-testid={`restart-${track.id}-${mod.id}`}
                          className="inline-flex items-center rounded-[6px] border border-line bg-surface px-3 py-1.5 text-[13px] font-medium text-ink transition hover:bg-surface-subtle"
                        >
                          Start over
                        </Link>
                      ) : null}
                      {prog && prog.usedShowMeCount > 0 ? (
                        <span className="ml-auto text-[11.5px] text-ink-muted">
                          Show me used {prog.usedShowMeCount}×
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <div className="min-h-screen bg-surface-subtle text-ink">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-8 py-4">
          <TenantLockup tenantSlug={tenant.slug} tenantName={tenant.name} accentColor={tenant.accentColor} height={28} />
          <div className="flex flex-wrap items-center gap-3 text-[13px] text-ink-muted">
            {user.role === "PENGUIN_ADMIN" && allTenants.length > 1 ? (
              <form action={switchActiveTenantAction} className="flex items-center gap-1.5">
                <input type="hidden" name="returnTo" value="/launchpad" />
                <label htmlFor="launchpad-tenant-select" className="font-penguin text-[12px] font-semibold text-penguin">
                  Tenant:
                </label>
                <select
                  id="launchpad-tenant-select"
                  name="tenantSlug"
                  defaultValue={tenant.slug}
                  data-testid="tenant-switcher-select"
                  className="rounded-md border border-line bg-surface px-2.5 py-1 text-[12.5px] font-medium text-ink"
                >
                  {allTenants.map((t) => (
                    <option key={t.slug} value={t.slug}>
                      {t.name} ({t.slug})
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  data-testid="tenant-switcher-submit"
                  className="rounded-md bg-penguin px-2.5 py-1 font-penguin text-[12px] font-semibold text-white hover:bg-penguin-strong"
                >
                  Switch
                </button>
              </form>
            ) : null}
            {user.division ? (
              <span className="rounded-full border border-line bg-surface-subtle px-2.5 py-0.5 text-[12px] font-medium text-ink-soft">
                {user.division}
              </span>
            ) : null}
            <Link href="/account" className="text-ink-soft hover:text-ink hover:underline" title="Account settings">
              {user.name ?? user.email}
            </Link>
            {isAdmin ? (
              <Link
                href="/admin"
                data-testid="nav-admin-link"
                className="rounded-md bg-penguin-soft px-2.5 py-1 font-penguin text-[12.5px] font-semibold text-penguin hover:bg-penguin hover:text-white"
              >
                Admin
              </Link>
            ) : null}
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-md border border-line px-2.5 py-1 text-[12.5px] font-medium text-ink-soft hover:bg-surface-subtle"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-8 py-9">
        {/* Learner Progress Banner */}
        <section
          data-testid="progress-banner"
          className="flex flex-wrap items-center justify-between gap-6 rounded-[14px] border border-line bg-surface px-7 py-6 shadow-[0_1px_3px_rgba(45,62,80,0.05)]"
        >
          <div className="max-w-[680px]">
            <div className="mb-2.5 flex flex-wrap items-center gap-3">
              <TenantLogo
                tenantSlug={tenant.slug}
                tenantName={tenant.name}
                accentColor={tenant.accentColor}
                mode="mark"
                height={34}
                testId="launchpad-hero-mark"
              />
              <div>
                <p className="font-penguin text-[12px] font-semibold uppercase tracking-[0.08em] text-penguin">
                  {tenant.name} HubSpot Onboarding &amp; Role Curriculum
                </p>
                {tenant.slug === AMICO_BRAND.slug ? (
                  <p className="text-[11.5px] font-medium text-ink-muted">{AMICO_BRAND.legalName}</p>
                ) : null}
              </div>
            </div>
            <h1 className="mt-1 font-display text-[26px] font-bold leading-tight text-ink">
              Welcome{user.name ? `, ${user.name.split(" ")[0]}` : ""}. Practice in a safe {tenant.name} sandbox.
            </h1>
            <p className="mt-1.5 text-[14px] text-ink-soft">
              Every module runs inside a realistic replica of {tenant.name}&rsquo;s configured HubSpot CRM — complete tasks hands-on, press{" "}
              <kbd className="rounded border border-line bg-surface-subtle px-1.5 py-0.5 text-[11.5px] font-semibold text-ink">H</kbd> for{" "}
              {tenant.name} process callouts, or use <strong className="font-semibold text-ink">Show me</strong> whenever you want guided help.
            </p>
          </div>
          <div className="min-w-[240px] rounded-[10px] border border-line bg-surface-subtle px-5 py-4">
            <div className="text-[12px] font-medium text-ink-muted">Required curriculum progress</div>
            <div className="mt-1 flex items-baseline justify-between gap-3">
              <span className="font-display text-[24px] font-bold text-ink tabular-nums" data-testid="required-progress-count">
                {completedRequiredCount} of {requiredModules.length}
              </span>
              <span className="text-[13px] font-semibold text-success tabular-nums">{pct}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-sunken">
              <div className="h-full rounded-full bg-success transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </section>

        {/* Role filter pills + Search */}
        <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter modules by job role">
            {ROLE_FILTERS.map((rf) => {
              const active = roleFilter === rf;
              return (
                <button
                  key={rf}
                  type="button"
                  onClick={() => setRoleFilter(rf)}
                  className={`rounded-full px-3 py-1.5 text-[12.5px] font-medium transition ${
                    active
                      ? "bg-nav text-white"
                      : "border border-line bg-surface text-ink-soft hover:bg-surface-sunken"
                  }`}
                >
                  {rf}
                </button>
              );
            })}
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search modules, topics, or codes…"
            aria-label="Search modules"
            className="w-72 rounded-[8px] border border-line bg-surface px-3.5 py-1.5 text-[13.5px] text-ink outline-none focus:border-info"
          />
        </div>

        {/* Required Tracks */}
        {requiredTracks.length > 0 ? (
          <section className="mt-6 space-y-4" data-testid="required-tracks-section">
            <h2 className="font-display text-[15px] font-semibold text-ink-soft">Assigned training tracks</h2>
            {requiredTracks.map((t) => renderTrackCard(t, true))}
          </section>
        ) : null}

        {/* Optional Tracks (hidden when trackLocked is enabled for a trainee) */}
        {optionalTracks.length > 0 ? (
          <section className="mt-8 space-y-4" data-testid="optional-tracks-section">
            <h2 className="font-display text-[15px] font-semibold text-ink-soft">Additional division tracks</h2>
            {optionalTracks.map((t) => renderTrackCard(t, false))}
          </section>
        ) : null}
      </main>

      <footer className="mt-14 border-t border-line bg-surface py-5 text-[12px] text-ink-muted">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-8">
          <span>
            Interactive {tenant.name} training sandbox · All CRM data shown is synthetic training data; no changes affect production HubSpot, Epicor, or Oracle.
          </span>
          <span>Keyboard shortcuts inside modules: H coaching callouts · R reset module</span>
        </div>
      </footer>
    </div>
  );
}
