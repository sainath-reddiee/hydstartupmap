"use client";

import { useMemo, useState } from "react";
import { Bookmark, BriefcaseBusiness, Building2, CalendarDays, ChevronRight, Clock3, MapPin, Moon, Navigation, Search, SlidersHorizontal, Sparkles, Wifi, Zap } from "lucide-react";
import startupsData from "@/data/startups.json";
import eventsData from "@/data/events.json";
import spacesData from "@/data/thirdspaces.json";
import type { DirectoryTab, Mode, Startup, StartupCategory, TechEvent, ThirdSpace } from "@/types";
import { AREA_CENTERS, distanceKm } from "@/utils/distance";

const startups = startupsData as Startup[];
const events = eventsData as TechEvent[];
const spaces = spacesData as ThirdSpace[];
const categories: Array<StartupCategory | "All"> = ["All", "AI & Data", "SaaS & Enterprise", "Fintech", "Healthtech & Bio", "Deeptech & Hardware", "Consumer & D2C"];
const areaNames = Object.keys(AREA_CENTERS);

type Props = {
  mode: Mode;
  bookmarks: string[];
  onToggleBookmark: (id: string) => void;
  onSelectStartup: (startup: Startup) => void;
  onSelectEvent: (event: TechEvent) => void;
  onHover: (id: string | null) => void;
  onCommuteChange: (value: { area: string; radius: number } | null) => void;
};

export default function DirectoryPanel(props: Props) {
  const [tab, setTab] = useState<DirectoryTab>(props.mode === "night" ? "night" : "startups");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<StartupCategory | "All">("All");
  const [area, setArea] = useState("All");
  const [commuteEnabled, setCommuteEnabled] = useState(false);
  const [homeArea, setHomeArea] = useState("HITEC City");
  const [radius, setRadius] = useState(8);

  const setCommute = (enabled: boolean, nextArea = homeArea, nextRadius = radius) => {
    setCommuteEnabled(enabled);
    props.onCommuteChange(enabled ? { area: nextArea, radius: nextRadius } : null);
  };

  const filteredStartups = useMemo(() => startups.filter((startup) => {
    const matchesText = `${startup.name} ${startup.tagline} ${startup.techStack.join(" ")}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "All" || startup.category === category;
    const matchesArea = area === "All" || startup.location.area === area;
    const matchesRadius = !commuteEnabled || distanceKm(AREA_CENTERS[homeArea], startup.location.coordinates) <= radius;
    return matchesText && matchesCategory && matchesArea && matchesRadius;
  }), [query, category, area, commuteEnabled, homeArea, radius]);

  const allJobs = useMemo(() => startups.flatMap((startup) => startup.hiring.jobs.map((job) => ({ ...job, startup })))
    .filter(({ title, startup, techStack }) => `${title} ${startup.name} ${(techStack ?? []).join(" ")}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured))), [query]);

  const tabs: Array<{ id: DirectoryTab; label: string; icon: typeof Building2; count: number }> = [
    { id: "startups", label: "Startups", icon: Building2, count: startups.length },
    { id: "jobs", label: "Jobs", icon: BriefcaseBusiness, count: allJobs.length },
    { id: "events", label: "Events", icon: CalendarDays, count: events.length },
    { id: "night", label: "Night", icon: Moon, count: spaces.length },
  ];

  return (
    <aside className="directory">
      <div className="directory-heading">
        <div><span className="eyebrow"><span className="status-dot" /> LIVE DIRECTORY</span><h1>Hyderabad&apos;s tech<br/><em>signal layer.</em></h1></div>
        <p>Discover the teams, roles, events and after-hours spaces moving the city forward.</p>
      </div>

      <div className="tabs">
        {tabs.map(({ id, label, icon: Icon, count }) => (
          <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
            <Icon size={16} /><span>{label}</span><small>{count}</small>
          </button>
        ))}
      </div>

      <div className="directory-tools">
        <label className="search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${tab}...`} /><kbd>⌘ K</kbd></label>
        {tab === "startups" && (
          <>
            <div className="filter-scroll">
              {categories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}
            </div>
            <div className="area-row">
              <SlidersHorizontal size={14} />
              <select value={area} onChange={(e) => setArea(e.target.value)}><option>All</option>{areaNames.map((name) => <option key={name}>{name}</option>)}</select>
              <span>{filteredStartups.length} signals</span>
            </div>
            <div className={`commute ${commuteEnabled ? "active" : ""}`}>
              <div className="commute-title"><span><Navigation size={15} /> Commute radar</span><button onClick={() => setCommute(!commuteEnabled)}>{commuteEnabled ? "ON" : "OFF"}</button></div>
              {commuteEnabled && <>
                <div className="commute-controls">
                  <select value={homeArea} onChange={(e) => { setHomeArea(e.target.value); setCommute(true, e.target.value, radius); }}>{areaNames.map((name) => <option key={name}>{name}</option>)}</select>
                  <strong>{radius} km</strong>
                </div>
                <input className="range" type="range" min="3" max="15" value={radius} onChange={(e) => { const value = Number(e.target.value); setRadius(value); setCommute(true, homeArea, value); }} />
              </>}
            </div>
          </>
        )}
      </div>

      <div className="list">
        {tab === "startups" && filteredStartups.map((startup) => (
          <article key={startup.id} className={`startup-card ${startup.isBoosted ? "boosted" : ""}`} onMouseEnter={() => props.onHover(startup.id)} onMouseLeave={() => props.onHover(null)} onClick={() => props.onSelectStartup(startup)}>
            {startup.isBoosted && <span className="boost-label"><Zap size={11} /> XL BOOST</span>}
            <div className="startup-logo">{startup.name.slice(0, 2).toUpperCase()}</div>
            <div className="startup-info">
              <div className="card-title"><h3>{startup.name}</h3><span>{startup.stage}</span></div>
              <p>{startup.tagline}</p>
              <div className="meta"><span><MapPin size={12} /> {startup.location.area}</span><span>{startup.category}</span>{startup.hiring.isHiring && <span className="hiring">{startup.hiring.jobs.length} OPEN</span>}</div>
              <div className="vibes">{startup.vibes.slice(0, 2).map((vibe) => <span key={vibe}>{vibe}</span>)}</div>
            </div>
            <button className={`bookmark ${props.bookmarks.includes(startup.id) ? "active" : ""}`} aria-label="Bookmark" onClick={(event) => { event.stopPropagation(); props.onToggleBookmark(startup.id); }}><Bookmark size={16} fill="currentColor" /></button>
            <ChevronRight className="card-arrow" size={18} />
          </article>
        ))}

        {tab === "jobs" && allJobs.map(({ startup, ...job }) => (
          <article key={job.id} className={`job-card ${job.isFeatured ? "featured" : ""}`} onClick={() => props.onSelectStartup(startup)}>
            {job.isFeatured && <span className="featured-label"><Sparkles size={11} /> FEATURED ROLE</span>}
            <div className="job-top"><div className="startup-logo small">{startup.name.slice(0, 2).toUpperCase()}</div><div><h3>{job.title}</h3><p>{startup.name} · {startup.location.area}</p></div></div>
            <div className="job-meta"><span>{job.department}</span><span>{job.type}</span>{job.salaryRange && <b>{job.salaryRange}</b>}</div>
            <div className="stack">{job.techStack?.map((item) => <span key={item}>{item}</span>)}</div>
          </article>
        ))}

        {tab === "events" && events.map((event) => (
          <article key={event.id} className={`event-card ${event.isFeatured ? "featured" : ""}`} onClick={() => props.onSelectEvent(event)}>
            <div className="date-block"><strong>{new Date(`${event.date}T12:00:00`).getDate()}</strong><span>{new Date(`${event.date}T12:00:00`).toLocaleString("en", { month: "short" }).toUpperCase()}</span></div>
            <div><span className="event-type">{event.eventType}</span><h3>{event.title}</h3><p><Clock3 size={12} /> {event.time} · {event.venue.name}</p><div className="stack">{event.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div>
            <ChevronRight size={18} />
          </article>
        ))}

        {tab === "night" && <>
          <div className="night-intro"><Moon size={20} /><div><b>AFTER DARK / HYDERABAD</b><p>Late-night work spots, fuel stops and always-on communities.</p></div></div>
          {spaces.map((space, index) => (
            <article key={space.id} className="space-card">
              <span className="space-rank">0{index + 1}</span>
              <div><span className="event-type">{space.type}</span><h3>{space.name}</h3><p><Clock3 size={12} /> {space.timings} · {space.location.area}</p>{space.wifiSpeed && <p className="wifi"><Wifi size={12} /> {space.wifiSpeed}</p>}<div className="stack">{space.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}</div></div>
            </article>
          ))}
        </>}

        {tab === "startups" && filteredStartups.length === 0 && <div className="empty"><Search size={28} /><h3>No signals in range</h3><p>Try widening your commute radar or clearing a filter.</p></div>}
      </div>
    </aside>
  );
}
