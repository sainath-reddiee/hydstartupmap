"use client";

import { useState } from "react";
import {
  ArrowUpRight, Bookmark, BriefcaseBusiness, CalendarDays, Check, Clock3, ExternalLink,
  Globe2, Landmark, MapPin, Share2, Users, X,
} from "lucide-react";
import spacesData from "@/data/thirdspaces.json";
import type { Startup, TechEvent, ThirdSpace } from "@/types";
import { distanceKm, nearestMetroLabel } from "@/utils/distance";

const spaces = spacesData as ThirdSpace[];

type Props = {
  startup: Startup | null;
  event: TechEvent | null;
  bookmarks: string[];
  onToggleBookmark: (id: string) => void;
  onClose: () => void;
};

export default function DetailDrawer({ startup, event, bookmarks, onToggleBookmark, onClose }: Props) {
  const open = Boolean(startup || event);
  return (
    <>
      <button className={`drawer-scrim ${open ? "open" : ""}`} aria-label="Close details" onClick={onClose} />
      <section className={`drawer ${open ? "open" : ""}`} aria-hidden={!open}>
        <button className="drawer-close" onClick={onClose}><X size={19} /></button>
        {startup && <CompanyProfile key={startup.id} startup={startup} bookmarked={bookmarks.includes(startup.id)} onToggleBookmark={onToggleBookmark} />}
        {event && <EventProfile event={event} />}
      </section>
    </>
  );
}

function CompanyProfile({ startup, bookmarked, onToggleBookmark }: { startup: Startup; bookmarked: boolean; onToggleBookmark: (id: string) => void }) {
  const [tab, setTab] = useState<"overview" | "jobs" | "funding">("overview");
  const nearestCafe = spaces
    .map((space) => ({ ...space, km: distanceKm(startup.location.coordinates, space.location.coordinates) }))
    .sort((a, b) => a.km - b.km)[0];
  return (
    <>
      <div className="drawer-hero">
        <div className="drawer-grid" />
        <div className="drawer-logo">{startup.name.slice(0, 2).toUpperCase()}</div>
        <div className="hero-badges">
          <span>{startup.category}</span>
          <span>{startup.stage}</span>
        </div>
        <h2>{startup.name}</h2>
        <p>{startup.tagline}</p>
        <div className="drawer-links">
          <a href={startup.website} target="_blank" rel="noreferrer"><Globe2 size={14} /> Website <ArrowUpRight size={12} /></a>
          <a href={startup.socials?.linkedin ?? `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(startup.name)}`} target="_blank" rel="noreferrer"><Share2 size={14} /> LinkedIn</a>
          <button className={bookmarked ? "active" : ""} onClick={() => onToggleBookmark(startup.id)}><Bookmark size={14} fill="currentColor" /> {bookmarked ? "Saved" : "Save"}</button>
        </div>
      </div>

      <div className="drawer-body">
        <div className="company-facts">
          <span><Users size={15} /><small>TEAM</small><b>{startup.teamSize}</b></span>
          <span><CalendarDays size={15} /><small>FOUNDED</small><b>{startup.foundedYear}</b></span>
          <span><MapPin size={15} /><small>BASE</small><b>{startup.location.area}</b></span>
        </div>

        <div className="profile-tabs">
          <button className={tab === "overview" ? "active" : ""} onClick={() => setTab("overview")}><Globe2 size={14} /> Overview</button>
          <button className={tab === "jobs" ? "active" : ""} onClick={() => setTab("jobs")}><BriefcaseBusiness size={14} /> Jobs <span>{startup.hiring.jobs.length}</span></button>
          <button className={tab === "funding" ? "active" : ""} onClick={() => setTab("funding")}><Landmark size={14} /> Funding</button>
        </div>

        {tab === "overview" && <>
        <section>
          <div className="section-label">01 / MISSION</div>
          {startup.description.split("\n\n").map((text) => <p className="mission" key={text}>{text}</p>)}
        </section>

        {startup.founders && startup.founders.length > 0 && (
          <section>
            <div className="section-label">02 / FOUNDERS</div>
            <div className="founder-grid">
              {startup.founders.map((founder) => (
                <div className="founder-card" key={`${founder.name}-${founder.role}`}>
                  <div className="founder-avatar">{founder.name.slice(0, 1)}</div>
                  <div>
                    <b>{founder.name}</b>
                    <p>{founder.role}</p>
                    {founder.previous && <small>{founder.previous}</small>}
                  </div>
                  {founder.linkedin && (
                    <a href={founder.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn"><ExternalLink size={14} /></a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="section-label">03 / TECH STACK</div>
          <div className="tech-cloud categorized">{startup.techStack.map((tech, index) => <span data-kind={index % 4} key={tech}>{tech}</span>)}</div>
        </section>

        {(startup.benefits?.length || 0) > 0 && (
          <section>
            <div className="section-label">04 / BENEFITS</div>
            <div className="vibes large">{startup.benefits!.map((benefit) => <span key={benefit}><Check size={12} /> {benefit}</span>)}</div>
          </section>
        )}
        </>}

        {tab === "jobs" && <section className="profile-tab-panel">
          <div className="section-heading">
            <div className="section-label">ACTIVE JOB OPENINGS</div>
            <b>{startup.hiring.jobs.length ? `${startup.hiring.jobs.length} LIVE` : startup.hiring.careersUrl ? "LISTED" : "NONE"}</b>
          </div>
          {startup.hiring.jobs.length ? startup.hiring.jobs.map((job) => (
            <div className={`drawer-job ${job.isFeatured ? "featured" : ""}`} key={job.id}>
              <div>
                <h4>{job.title}</h4>
                <p>{job.department} · {job.type}{job.workMode ? ` · ${job.workMode}` : ""}</p>
                {job.salaryRange && <strong>{job.salaryRange}</strong>}
                {job.description && <small className="job-desc">{job.description}</small>}
              </div>
              <a href={job.applyUrl} target="_blank" rel="noreferrer">Apply <ArrowUpRight size={13} /></a>
            </div>
          )) : startup.hiring.careersUrl ? (
            <div className="drawer-job">
              <div>
                <h4>Roles are listed off-map</h4>
                <p>Open their careers page, LinkedIn, or Wellfound. When the role closes, that link stops being wrong on its own.</p>
              </div>
              <a href={startup.hiring.careersUrl} target="_blank" rel="noreferrer">View listings <ArrowUpRight size={13} /></a>
            </div>
          ) : <p className="muted">Not hiring right now. Bookmark this company to check back.</p>}
        </section>}

        {tab === "funding" && <section className="profile-tab-panel">
          <div className="section-label">FUNDING & INVESTOR TIMELINE</div>
          <div className="timeline">
            {startup.funding.map((round, index) => (
              <div key={`${round.stage}-${index}`}>
                <i />
                <span>
                  <b>{round.stage}</b>
                  <small>{round.date ?? "Founder funded"}</small>
                </span>
                <strong>{round.amount ?? round.valuation ?? "Bootstrapped"}</strong>
                <p>{round.leadInvestors?.join(" · ") || startup.investors?.join(" · ")}</p>
              </div>
            ))}
          </div>
          {startup.investors?.length ? <div className="investor-cloud">{startup.investors.map((investor) => <span key={investor}>{investor}</span>)}</div> : null}
        </section>}

        <section>
          <div className="section-label">HYPER-LOCAL INTEL</div>
          <div className="local-card">
            <MapPin size={17} />
            <div>
              <b>{startup.location.building}</b>
              <p>{nearestMetroLabel(startup.location.coordinates)}</p>
              <p>Nearest café/work spot: {nearestCafe.name} · {nearestCafe.km.toFixed(1)} km</p>
              {startup.source && <p>Source: {startup.source}</p>}
            </div>
          </div>
          <div className="vibes large">{startup.vibes.map((vibe) => <span key={vibe}><Check size={12} /> {vibe}</span>)}</div>
        </section>
      </div>
    </>
  );
}

function EventProfile({ event }: { event: TechEvent }) {
  const date = new Date(`${event.date}T12:00:00`);
  return (
    <>
      <div className="drawer-hero event-hero">
        <span className="event-type">{event.eventType}</span>
        <h2>{event.title}</h2>
        <p>Hosted by {event.organizer}</p>
      </div>
      <div className="drawer-body event-detail">
        <div className="event-date-large">
          <strong>{date.getDate()}</strong>
          <span>{date.toLocaleString("en", { month: "long" })} {date.getFullYear()}</span>
        </div>
        <div className="detail-row"><Clock3 size={18} /><div><small>STARTS AT</small><b>{event.time}</b></div></div>
        <div className="detail-row"><MapPin size={18} /><div><small>VENUE</small><b>{event.venue.name}</b><p>{event.venue.area}, Hyderabad</p></div></div>
        <div className="tech-cloud">{event.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        <a className="rsvp" href={event.rsvpUrl} target="_blank" rel="noreferrer">
          {event.isFree ? "Reserve a free spot" : `Get ticket · ${event.price}`} <ExternalLink size={15} />
        </a>
      </div>
    </>
  );
}
