"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Header from "./Header";
import DirectoryPanel from "./DirectoryPanel";
import DetailDrawer from "./DetailDrawer";
import ActionModal, { ModalKind } from "./ActionModal";
import type { Mode, NewsItem, RoadBillboard, Startup, TechEvent } from "@/types";
import { getPublishedStartups, loadCms, subscribeCms } from "@/utils/cms";
import { getBookmarks, getStoredMode, setStoredMode, toggleStoredBookmark } from "@/utils/storage";

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
    refresh();
    return subscribeCms(refresh);
  }, []);

  const stats = useMemo(() => ({
    startups: startups.length,
    jobs: startups.reduce((sum, item) => sum + item.hiring.jobs.length, 0),
    events: events.length,
    news: news.length,
  }), [startups, events, news]);

  const changeMode = (next: Mode) => {
    setMode(next);
    setStoredMode(next);
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
    <main className={`app ${mode}`}>
      <Header mode={mode} stats={stats} onModeChange={changeMode} onOpenModal={setModal} />
      <div className="workspace">
        <DirectoryPanel
          mode={mode}
          startups={startups}
          events={events}
          news={news}
          bookmarks={bookmarks}
          onToggleBookmark={(id) => setBookmarks(toggleStoredBookmark(id))}
          onSelectStartup={selectStartup}
          onSelectEvent={selectEvent}
          onHover={setHoveredId}
          onCommuteChange={setCommute}
        />
        <MapContainer
          mode={mode}
          startups={startups}
          events={events}
          billboards={billboards}
          selectedStartup={selectedStartup}
          selectedEvent={selectedEvent}
          hoveredId={hoveredId}
          commute={commute}
          onSelectStartup={selectStartup}
          onSelectEvent={selectEvent}
        />
      </div>
      <DetailDrawer
        startup={selectedStartup}
        event={selectedEvent}
        onClose={() => {
          setSelectedStartup(null);
          setSelectedEvent(null);
        }}
      />
      <ActionModal kind={modal} onClose={() => setModal(null)} />
    </main>
  );
}
