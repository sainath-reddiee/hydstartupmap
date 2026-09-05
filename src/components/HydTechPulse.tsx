"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Header from "./Header";
import DirectoryPanel from "./DirectoryPanel";
import DetailDrawer from "./DetailDrawer";
import BillboardDrawer from "./BillboardDrawer";
import ActionModal, { ModalKind } from "./ActionModal";
import PulseBanner from "./PulseBanner";
import TimingStrip from "./TimingStrip";
import type { CorridorPulse, DirectoryTab, Mode, NewsItem, RoadBillboard, Startup, TechEvent, ViewMode } from "@/types";
import { deleteBillboard, getPublishedStartups, loadCms, subscribeCms } from "@/utils/cms";
import { hiringStats } from "@/utils/hiring";
import { matchRoleIntent } from "@/utils/intent";
import { timingCopy } from "@/utils/timing";
import {
  getBannerDismissed, getBookmarks, getRailsCollapsed, getStoredMode,
  setBannerDismissed, setRailsCollapsed, setStoredMode, toggleStoredBookmark,
} from "@/utils/storage";

const MapContainer = dynamic(() => import("./MapContainer"), {
  ssr: false,
  loading: () => (
    <div className="map-loading">
      <span />
      <p>SYNCING HYDERABAD GRID</p>
    </div>
  ),
});

function istMode(): Mode {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    }).format(new Date()),
  );
  return hour >= 20 || hour < 6 ? "night" : "day";
}

export default function HydTechPulse() {
  const [mode, setMode] = useState<Mode>("day");
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [headerQuery, setHeaderQuery] = useState("");
  const [jumpTab, setJumpTab] = useState<DirectoryTab | null>(null);
  const [tabNonce, setTabNonce] = useState(0);
  const [corridorName, setCorridorName] = useState<string | undefined>();
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [events, setEvents] = useState<TechEvent[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [billboards, setBillboards] = useState<RoadBillboard[]>([]);
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<TechEvent | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [commute, setCommute] = useState<{ area: string; radius: number } | null>(null);
  const [modal, setModal] = useState<ModalKind | null>(null);
  const [focusedArea, setFocusedArea] = useState<string | null>(null);
  const [selectedBillboard, setSelectedBillboard] = useState<RoadBillboard | null>(null);
  const [railsCollapsed, setRails] = useState(false);
  const [bannerOn, setBannerOn] = useState(true);

  const refresh = () => {
    const cms = loadCms();
    const published = getPublishedStartups(cms);
    setStartups(published);
    setEvents(cms.events);
    setNews(cms.news);
    setBillboards(cms.billboards.filter((item) => item.isLive));
    setSelectedStartup((current) => (current ? published.find((item) => item.id === current.id) ?? null : null));
  };

  useEffect(() => {
    setMode(getStoredMode() ?? istMode());
    setBookmarks(getBookmarks());
    setRails(getRailsCollapsed());
    setBannerOn(!getBannerDismissed());
    refresh();
    return subscribeCms(refresh);
  }, []);

  const hiring = useMemo(() => hiringStats(startups), [startups]);
  const roleMatch = useMemo(() => matchRoleIntent(headerQuery, startups), [headerQuery, startups]);
  const timing = useMemo(() => timingCopy({ startups, events, news }), [startups, events, news]);
  const stats = useMemo(() => ({
    startups: startups.length,
    jobs: hiring.jobs,
    jobsLabel: hiring.label,
    events: events.length,
    news: news.length,
  }), [startups, events, news, hiring]);

  const changeMode = (next: Mode) => {
    setMode(next);
    setStoredMode(next);
  };

  const toggleRails = () => {
    setRails((current) => {
      const next = !current;
      setRailsCollapsed(next);
      return next;
    });
  };

  const openDirectory = (tab: DirectoryTab) => {
    setViewMode("map");
    if (railsCollapsed) {
      setRails(false);
      setRailsCollapsed(false);
    }
    setJumpTab(tab);
    setTabNonce((value) => value + 1);
  };

  const selectStartup = (startup: Startup) => {
    setSelectedEvent(null);
    setSelectedStartup(startup);
  };

  const selectEvent = (event: TechEvent) => {
    setSelectedStartup(null);
    setSelectedEvent(event);
  };

  return (
    <main className={`app ${mode} view-${viewMode} ${railsCollapsed && viewMode === "map" ? "rails-collapsed" : ""}`}>
      <Header
        mode={mode}
        viewMode={viewMode}
        railsCollapsed={railsCollapsed}
        stats={stats}
        search={headerQuery}
        onSearch={setHeaderQuery}
        onModeChange={changeMode}
        onViewModeChange={(next) => {
          setViewMode(next);
          if (next === "grid" && railsCollapsed) {
            setRails(false);
            setRailsCollapsed(false);
          }
        }}
        onToggleRails={toggleRails}
        onOpenJobs={() => openDirectory("jobs")}
        onOpenAlerts={() => setModal("alerts")}
        onOpenModal={(kind) => {
          setCorridorName(undefined);
          setModal(kind);
        }}
      />
      {bannerOn && (
        <PulseBanner
          hiring={hiring.boards}
          news={news.length}
          events={events.length}
          onAlerts={() => setModal("alerts")}
          onJobs={() => openDirectory("jobs")}
          onClaim={() => setModal("billboard")}
          onDismiss={() => {
            setBannerOn(false);
            setBannerDismissed();
          }}
        />
      )}
      <TimingStrip
        timing={timing}
        intent={roleMatch.intent}
        matches={roleMatch.matches}
        onSelect={selectStartup}
        onHireSprint={() => setModal("sprint")}
      />
      <div className="workspace">
        <DirectoryPanel
          mode={mode}
          startups={startups}
          events={events}
          news={news}
          bookmarks={bookmarks}
          query={headerQuery}
          jumpTab={jumpTab}
          tabNonce={tabNonce}
          viewMode={viewMode}
          collapsed={railsCollapsed && viewMode === "map"}
          onCollapse={toggleRails}
          onPromoteJob={() => setModal("job")}
          onHireSprint={() => setModal("sprint")}
          suggested={roleMatch.matches}
          onToggleBookmark={(id) => setBookmarks(toggleStoredBookmark(id))}
          onSelectStartup={selectStartup}
          onSelectEvent={selectEvent}
          onHover={setHoveredId}
          onCommuteChange={setCommute}
          focusedArea={focusedArea}
          onAreaFocus={setFocusedArea}
        />
        {viewMode === "map" && (
        <MapContainer
          mode={mode}
          startups={startups}
          events={events}
          billboards={billboards}
          news={news}
          selectedStartup={selectedStartup}
          selectedEvent={selectedEvent}
          hoveredId={hoveredId}
          commute={commute}
          focusedArea={focusedArea}
          railsCollapsed={railsCollapsed}
          onSelectStartup={selectStartup}
          onSelectEvent={selectEvent}
          onFocusArea={setFocusedArea}
          onSelectBillboard={(billboard) => {
            setSelectedStartup(null);
            setSelectedEvent(null);
            setSelectedBillboard(billboard);
          }}
          onSubmitHoarding={() => setModal("hoarding")}
          onClaimCorridor={(slot: CorridorPulse) => {
            setCorridorName(`${slot.label} · ${slot.name}`);
            setModal("billboard");
          }}
          onOpenDirectory={toggleRails}
          intentMatches={roleMatch.matches}
        />
        )}
      </div>
      <DetailDrawer
        startup={selectedStartup}
        event={selectedEvent}
        bookmarks={bookmarks}
        onToggleBookmark={(id) => setBookmarks(toggleStoredBookmark(id))}
        onClose={() => {
          setSelectedStartup(null);
          setSelectedEvent(null);
        }}
      />
      <BillboardDrawer
        billboard={selectedBillboard}
        onClose={() => setSelectedBillboard(null)}
        onBookVirtual={() => {
          setSelectedBillboard(null);
          setModal("billboard");
        }}
        onSubmitSighting={() => {
          setSelectedBillboard(null);
          setModal("hoarding");
        }}
        onDeletePersonal={(id) => {
          deleteBillboard(id);
          setSelectedBillboard(null);
          refresh();
        }}
      />
      <ActionModal kind={modal} corridorName={corridorName} onClose={() => { setModal(null); setCorridorName(undefined); }} />
    </main>
  );
}
