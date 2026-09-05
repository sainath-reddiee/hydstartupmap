"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bookmark, BriefcaseBusiness, Building2, CalendarDays, ChevronRight, Clock3,
  Flame, MapPinned, Moon, Navigation, Newspaper, Search, Sparkles, Wifi, X,
} from "lucide-react";
import type { DirectoryTab, Mode, NewsItem, Startup, StartupCategory, TechEvent, ThirdSpace, ViewMode } from "@/types";
import { AREA_CENTERS, buildAreaInsights, distanceKm, relativeTime } from "@/utils/distance";
import spacesData from "@/data/thirdspaces.json";

const spaces = spacesData as ThirdSpace[];
const categories: Array<StartupCategory | "All"> = [
  "All", "AI & Data", "SaaS & Enterprise", "Fintech", "Healthtech & Bio",
  "Deeptech & Hardware", "Consumer & D2C", "Edtech", "Space & Aerospace",
];
const areaNames = Object.keys(AREA_CENTERS);

type Props = {
  mode: Mode;
  startups: Startup[];
  events: TechEvent[];
  news: NewsItem[];
  bookmarks: string[];
  onToggleBookmark: (id: string) => void;
  onSelectStartup: (startup: Startup) => void;
  onSelectEvent: (event: TechEvent) => void;
  onHover: (id: string | null) => void;
  onCommuteChange: (value: { area: string; radius: number } | null) => void;
  focusedArea: string | null;
  onAreaFocus: (area: string | null) => void;
  query?: string;
  jumpTab?: DirectoryTab | null;
  tabNonce?: number;
  viewMode?: ViewMode;
  onPromoteJob?: () => void;
};

export default function DirectoryPanel(props: Props) {
  const [tab, setTab] = useState<DirectoryTab>(props.mode === "night" ? "night" : "startups");
  const [query, setQuery] = useState(props.query ?? "");
  const [category, setCategory] = useState<StartupCategory | "All">("All");
  const [stage, setStage] = useState<"All" | Startup["stage"]>("All");
  const [area, setArea] = useState("All");
  const [sortBy, setSortBy] = useState<"signal" | "hiring" | "newest">("signal");
  const [commuteEnabled, setCommuteEnabled] = useState(false);
  const [homeArea, setHomeArea] = useState("HITEC City");
  const [radius, setRadius] = useState(8);

  useEffect(() => {
    setArea(props.focusedArea ?? "All");
  }, [props.focusedArea]);

  useEffect(() => {
    if (props.query !== undefined) setQuery(props.query);
  }, [props.query]);

  useEffect(() => {
    if (props.jumpTab) setTab(props.jumpTab);
  }, [props.jumpTab, props.tabNonce]);

  const areaInsights = useMemo(() => buildAreaInsights(props.startups), [props.startups]);

  const chooseArea = (nextArea: string) => {
    setArea(nextArea);
    props.onAreaFocus(nextArea === "All" ? null : nextArea);
  };

  const setCommute = (enabled: boolean, nextArea = homeArea, nextRadius = radius) => {
    setCommuteEnabled(enabled);
    props.onCommuteChange(enabled ? { area: nextArea, radius: nextRadius } : null);
  };

  const searchSuggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [] as Array<{ type: "area" | "startup" | "category"; label: string; meta: string }>;
    const areas = areaInsights
      .filter((item) => item.name.toLowerCase().includes(q) || item.topCategory.toLowerCase().includes(q))
      .slice(0, 4)
      .map((item) => ({ type: "area" as const, label: item.name, meta: `${item.count} cos · ${item.signal}` }));
    const cats = categories
      .filter((item) => item !== "All" && item.toLowerCase().includes(q))
      .slice(0, 3)
      .map((item) => ({ type: "category" as const, label: item, meta: "Category filter" }));
    const cos = props.startups
      .filter((item) => `${item.name} ${item.tagline}`.toLowerCase().includes(q))
      .slice(0, 4)
      .map((item) => ({ type: "startup" as const, label: item.name, meta: item.location.area }));
    return [...areas, ...cats, ...cos].slice(0, 8);
  }, [query, areaInsights, props.startups]);

  const filteredStartups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = props.startups.filter((startup) => {
      const hay = `${startup.name} ${startup.tagline} ${startup.category} ${startup.location.area} ${startup.techStack.join(" ")} ${startup.vibes.join(" ")}`.toLowerCase();
      const matchesText = !q || hay.includes(q);
      const matchesCategory = category === "All" || startup.category === category;
      const matchesStage = stage === "All" || startup.stage === stage;
      const matchesArea = area === "All" || startup.location.area === area;
      const matchesRadius = !commuteEnabled || distanceKm(AREA_CENTERS[homeArea], startup.location.coordinates) <= radius;
      return matchesText && matchesCategory && matchesStage && matchesArea && matchesRadius;
    });
    return list.sort((a, b) => {
      if (sortBy === "hiring") return b.hiring.jobs.length - a.hiring.jobs.length;
      if (sortBy === "newest") return b.foundedYear - a.foundedYear;
      return Number(Boolean(b.isBoosted)) - Number(Boolean(a.isBoosted)) || b.hiring.jobs.length - a.hiring.jobs.length;
    });
  }, [props.startups, query, category, stage, area, commuteEnabled, homeArea, radius, sortBy]);

  const allJobs = useMemo(() => props.startups
    .flatMap((startup) => startup.hiring.jobs.map((job) => ({ ...job, startup })))
    .filter(({ title, startup, techStack }) => `${title} ${startup.name} ${(techStack ?? []).join(" ")}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured))), [props.startups, query]);

  const hiringBoards = useMemo(() => props.startups.filter((startup) => {
    if (!startup.hiring.careersUrl || startup.hiring.jobs.length > 0) return false;
    return `${startup.name} ${startup.hiring.careersUrl}`.toLowerCase().includes(query.toLowerCase());
  }), [props.startups, query]);

  const filteredNews = useMemo(() => props.news
    .filter((item) => `${item.title} ${item.source} ${item.summary}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)) || b.publishedAt.localeCompare(a.publishedAt)), [props.news, query]);

  const tabs: Array<{ id: DirectoryTab; label: string; icon: typeof Building2; count: number }> = [
    { id: "startups", label: "Startups", icon: Building2, count: props.startups.length },
    { id: "jobs", label: "Jobs", icon: BriefcaseBusiness, count: allJobs.length + hiringBoards.length },
    { id: "news", label: "News", icon: Newspaper, count: props.news.length },
    { id: "events", label: "Events", icon: CalendarDays, count: props.events.length },
    { id: "night", label: "Night", icon: Moon, count: spaces.length },
  ];

  const applySuggestion = (item: { type: "area" | "startup" | "category"; label: string }) => {
    if (item.type === "area") {
      chooseArea(item.label);
      setQuery("");
      setTab("startups");
      return;
    }
    if (item.type === "category") {
      setCategory(item.label as StartupCategory);
      setQuery("");
      setTab("startups");
      return;
    }
    const startup = props.startups.find((entry) => entry.name === item.label);
    if (startup) {
      props.onSelectStartup(startup);
      setQuery("");
    }
  };

  return (
    <aside className="directory">
      <div className="directory-heading compact">
        <div>
          <span className="eyebrow"><span className="status-dot" /> HYDERABAD</span>
          <h1>{filteredStartups.length} companies <em>on the map</em></h1>
        </div>
        <p>Filter by corridor, stage, or sector. Jobs stay linked to a live careers page.</p>
      </div>

      <div className="tabs">
        {tabs.map(({ id, label, icon: Icon, count }) => (
          <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
            <Icon size={15} /><span>{label}</span><small>{count}</small>
          </button>
        ))}
      </div>

      <div className="directory-tools">
        <div className="search-wrap">
          <label className="search">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tab === "startups" ? "Search company, area, stack..." : `Search ${tab}...`}
            />
            {query ? (
              <button type="button" className="search-clear" aria-label="Clear search" onClick={() => setQuery("")}>
                <X size={14} />
              </button>
            ) : (
              <kbd>⌘K</kbd>
            )}
          </label>
          {tab === "startups" && searchSuggestions.length > 0 && (
            <div className="search-suggest">
              {searchSuggestions.map((item) => (
                <button key={`${item.type}-${item.label}`} type="button" onClick={() => applySuggestion(item)}>
                  <small>{item.type}</small>
                  <strong>{item.label}</strong>
                  <span>{item.meta}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {tab === "startups" && (
          <>
            <div className="filter-scroll">
              {categories.map((item) => (
                <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>
              ))}
            </div>
            <div className="filter-scroll stage-scroll">
              {(["All", "Bootstrapped", "Seed", "Series A", "Series B+", "Public", "Unicorn"] as const).map((item) => (
                <button key={item} className={stage === item ? "active" : ""} onClick={() => setStage(item)}>
                  {item === "All" ? "All stages" : item}
                </button>
              ))}
            </div>

            <div className="area-row">
              <MapPinned size={14} />
              <strong>EXPLORE BY AREA</strong>
              <span>{filteredStartups.length} signals</span>
            </div>
            <div className="area-sort">
              <button className={sortBy === "signal" ? "active" : ""} onClick={() => setSortBy("signal")}>Signal</button>
              <button className={sortBy === "hiring" ? "active" : ""} onClick={() => setSortBy("hiring")}>Hiring heat</button>
              <button className={sortBy === "newest" ? "active" : ""} onClick={() => setSortBy("newest")}>Newest</button>
            </div>
            <div className="area-signals">
              <button className={area === "All" ? "active" : ""} onClick={() => chooseArea("All")}>
                <b>{props.startups.length}</b>
                <span>All Hyderabad<small>Full grid</small></span>
              </button>
              {areaInsights.map((insight) => (
                <button
                  key={insight.name}
                  className={`area-pulse heat-${insight.heat} ${area === insight.name || props.focusedArea === insight.name ? "active" : ""}`}
                  onClick={() => chooseArea(insight.name)}
                >
                  <b>{insight.count}</b>
                  <span>
                    {insight.name}
                    <small>
                      {insight.heat === "hot" && <Flame size={10} />}
                      {insight.signal}
                    </small>
                  </span>
                </button>
              ))}
            </div>

            <div className={`commute ${commuteEnabled ? "active" : ""}`}>
              <div className="commute-title">
                <span><Navigation size={15} /> Commute radar</span>
                <button onClick={() => setCommute(!commuteEnabled)}>{commuteEnabled ? "ON" : "OFF"}</button>
              </div>
              {commuteEnabled && (
                <>
                  <div className="commute-controls">
                    <select value={homeArea} onChange={(e) => { setHomeArea(e.target.value); setCommute(true, e.target.value, radius); }}>
                      {areaNames.map((name) => <option key={name}>{name}</option>)}
                    </select>
                    <strong>{radius} km</strong>
                  </div>
                  <input className="range" type="range" min="3" max="15" value={radius} onChange={(e) => {
                    const value = Number(e.target.value);
                    setRadius(value);
                    setCommute(true, homeArea, value);
                  }} />
                </>
              )}
            </div>
          </>
        )}
      </div>

      <div className="list">
        {tab === "startups" && filteredStartups.map((startup, index) => (
          <article
            key={startup.id}
            className={`startup-card ${startup.isBoosted ? "boosted" : ""}`}
            style={{ animationDelay: `${index * 40}ms` }}
            onMouseEnter={() => props.onHover(startup.id)}
            onMouseLeave={() => props.onHover(null)}
            onClick={() => props.onSelectStartup(startup)}
          >
            <div className="startup-logo">{startup.name.slice(0, 2).toUpperCase()}</div>
            <div className="startup-info">
              <div className="card-title">
                <h3>{startup.name}</h3>
                <span>{startup.stage}</span>
              </div>
              <p>{startup.tagline}</p>
              <div className="meta">
                <span><MapPinned size={12} /> {startup.location.area}</span>
                <span>{startup.category}</span>
                {startup.hiring.jobs.length > 0 ? (
                  <span className="hiring">{startup.hiring.jobs.length} OPEN</span>
                ) : startup.hiring.careersUrl ? (
                  <span className="hiring">HIRING</span>
                ) : null}
              </div>
              <div className="vibes">{startup.vibes.slice(0, 2).map((vibe) => <span key={vibe}>{vibe}</span>)}</div>
            </div>
            <button
              className={`bookmark ${props.bookmarks.includes(startup.id) ? "active" : ""}`}
              aria-label="Bookmark"
              onClick={(event) => { event.stopPropagation(); props.onToggleBookmark(startup.id); }}
            >
              <Bookmark size={16} fill="currentColor" />
            </button>
            <ChevronRight className="card-arrow" size={18} />
          </article>
        ))}

        {tab === "jobs" && (
          <div className="featured-roles">
            <div className="featured-roles-head">
              <strong>Featured roles</strong>
              <button type="button" onClick={props.onPromoteJob}>Promote a role</button>
            </div>
            {allJobs.filter((item) => item.isFeatured).length === 0 && (
              <p>No paid spotlights yet. Companies can pin a real listing here — not a Google Form.</p>
            )}
          </div>
        )}

        {tab === "jobs" && hiringBoards.map((startup, index) => (
          <article
            key={`${startup.id}-careers`}
            className="job-card"
            style={{ animationDelay: `${(allJobs.length + index) * 35}ms` }}
            onClick={() => props.onSelectStartup(startup)}
          >
            <div className="job-top">
              <div className="startup-logo small">{startup.name.slice(0, 2).toUpperCase()}</div>
              <div>
                <h3>Open roles at {startup.name}</h3>
                <p>{startup.location.area} · listed on their careers page</p>
              </div>
            </div>
            <a href={startup.hiring.careersUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
              View listings
            </a>
          </article>
        ))}

        {tab === "jobs" && allJobs.map(({ startup, ...job }, index) => (
          <article
            key={job.id}
            className={`job-card ${job.isFeatured ? "featured" : ""}`}
            style={{ animationDelay: `${index * 35}ms` }}
            onClick={() => props.onSelectStartup(startup)}
          >
            {job.isFeatured && <span className="featured-label"><Sparkles size={11} /> FEATURED ROLE</span>}
            <div className="job-top">
              <div className="startup-logo small">{startup.name.slice(0, 2).toUpperCase()}</div>
              <div>
                <h3>{job.title}</h3>
                <p>{startup.name} · {startup.location.area}{job.workMode ? ` · ${job.workMode}` : ""}</p>
              </div>
            </div>
            <div className="job-meta">
              <span>{job.department}</span>
              <span>{job.type}</span>
              {job.salaryRange && <b>{job.salaryRange}</b>}
            </div>
            <div className="stack">{job.techStack?.map((item) => <span key={item}>{item}</span>)}</div>
          </article>
        ))}

        {tab === "news" && filteredNews.map((item, index) => {
          const company = props.startups.find((startup) => startup.id === item.companyId);
          return (
            <article
              key={item.id}
              className={`news-card ${item.isFeatured ? "featured" : ""}`}
              style={{ animationDelay: `${index * 35}ms` }}
              onClick={() => company && props.onSelectStartup(company)}
            >
              <div className="news-top">
                <span>{item.source}</span>
                <small>{relativeTime(item.publishedAt)}</small>
              </div>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
              <div className="stack">
                {item.tags.map((tag) => <span key={tag}>{tag}</span>)}
                {company && <span className="hiring">{company.name}</span>}
              </div>
              <a href={item.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>Read source</a>
            </article>
          );
        })}

        {tab === "events" && props.events.map((event, index) => (
          <article
            key={event.id}
            className={`event-card ${event.isFeatured ? "featured" : ""}`}
            style={{ animationDelay: `${index * 35}ms` }}
            onClick={() => props.onSelectEvent(event)}
          >
            <div className="date-block">
              <strong>{new Date(`${event.date}T12:00:00`).getDate()}</strong>
              <span>{new Date(`${event.date}T12:00:00`).toLocaleString("en", { month: "short" }).toUpperCase()}</span>
            </div>
            <div>
              <span className="event-type">{event.eventType}</span>
              <h3>{event.title}</h3>
              <p><Clock3 size={12} /> {event.time} · {event.venue.name}</p>
              <div className="stack">{event.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            </div>
            <ChevronRight size={18} />
          </article>
        ))}

        {tab === "night" && (
          <>
            <div className="night-intro">
              <Moon size={20} />
              <div>
                <b>AFTER DARK / HYDERABAD</b>
                <p>Late-night work spots, fuel stops and always-on communities.</p>
              </div>
            </div>
            {spaces.map((space, index) => (
              <article key={space.id} className="space-card" style={{ animationDelay: `${index * 35}ms` }}>
                <span className="space-rank">0{index + 1}</span>
                <div>
                  <span className="event-type">{space.type}</span>
                  <h3>{space.name}</h3>
                  <p><Clock3 size={12} /> {space.timings} · {space.location.area}</p>
                  {space.wifiSpeed && <p className="wifi"><Wifi size={12} /> {space.wifiSpeed}</p>}
                  <div className="stack">{space.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}</div>
                </div>
              </article>
            ))}
          </>
        )}

        {tab === "startups" && filteredStartups.length === 0 && (
          <div className="empty"><Search size={28} /><h3>No signals in range</h3><p>Try another area, clear search, or widen commute radar.</p></div>
        )}
      </div>
    </aside>
  );
}
