"use client";

import { useEffect, useState } from "react";
import { resolveDates } from "@/store/dates";
import { parseLocation, useLocation } from "@/store/router";
import { clearSession, loadSession, type Saved } from "@/store/session";
import { ShellProvider, useShell } from "@/store/store";
import type { Pack, TrainingTrackMeta } from "@/tenants/types";
import { Chrome } from "./chrome";
import { CompletionCard } from "./completion-card";
import "./hubspot.css";
import { RecordPreviewHost } from "./record-preview-drawer";
import { Routes } from "./routes";
import { TrainingBar } from "./training-bar";
import { cx } from "./ui";

type Loaded = { trackId: string; pack: Pack; saved: Saved | null; location: string };

const packMemoryCache = new Map<string, Promise<Pack>>();

function fetchPack(tenantSlug: string, trackId: string, version: string): Promise<Pack> {
  const key = `${version}/${tenantSlug}/${trackId}`;
  let pending = packMemoryCache.get(key);
  if (!pending) {
    pending = fetch(`/api/packs/${key}`, { credentials: "same-origin" })
      .then((res) => {
        if (!res.ok) throw new Error(`Pack load failed (${res.status})`);
        return res.json() as Promise<Pack>;
      })
      .then((raw) => resolveDates(raw, Date.now()));
    pending.catch(() => packMemoryCache.delete(key));
    packMemoryCache.set(key, pending);
  }
  return pending;
}

function Frame() {
  const { route, highlight, completionOpen } = useShell();
  return (
    <div
      className={cx("hs-app flex h-screen min-w-[1180px] flex-col overflow-hidden", highlight && "px-highlight")}
      data-testid="shell"
      data-path={route.path}
    >
      <Chrome>
        <Routes />
      </Chrome>
      <RecordPreviewHost />
      {highlight ? <div className="px-dim" aria-hidden="true" /> : null}
      <TrainingBar />
      {completionOpen ? <CompletionCard /> : null}
    </div>
  );
}

export function ShellApp({
  tenantSlug,
  tracks,
  packVersions,
}: {
  tenantSlug: string;
  tenantName: string;
  tracks: TrainingTrackMeta[];
  packVersions: Record<string, string>;
}) {
  const fallbackTrack = tracks[0]?.id ?? "";
  const location = useLocation(`/learn/${tenantSlug}/${fallbackTrack}`);
  const parsed = parseLocation(location);
  const trackId = packVersions[parsed.trackId] ? parsed.trackId : fallbackTrack;
  const packVersion = packVersions[trackId];

  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const url = new URL(window.location.href);
    if (url.searchParams.get("fresh") === "1") {
      clearSession(tenantSlug, trackId);
      url.searchParams.delete("fresh");
      window.history.replaceState(null, "", url.pathname + url.search);
    }
    const loc = window.location.pathname + url.search;

    fetchPack(tenantSlug, trackId, packVersion)
      .then((pack) => {
        if (cancelled) return;
        setLoaded({
          trackId,
          pack,
          saved: loadSession(tenantSlug, trackId, packVersion),
          location: loc,
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [tenantSlug, trackId, packVersion]);

  if (failed) {
    return (
      <div className="hs-app flex h-screen flex-col items-center justify-center gap-3 bg-[#f5f8fa]">
        <p className="text-[16px] font-semibold text-[#33475b]">The training sandbox could not load.</p>
        <p className="text-[13px] text-[#516f90]">Your session may have expired or you may not have access to this track.</p>
        <a href="/launchpad" className="hs-link">
          Back to Training Launchpad
        </a>
      </div>
    );
  }

  if (!loaded || loaded.trackId !== trackId) {
    return <div className="hs-app h-screen bg-[#1f2a37]" data-testid="shell-loading" />;
  }

  return (
    <ShellProvider key={`${tenantSlug}/${trackId}`} pack={loaded.pack} version={packVersion} initial={loaded.saved} initialLocation={loaded.location}>
      <Frame />
    </ShellProvider>
  );
}
