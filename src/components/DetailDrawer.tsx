"use client";

import {
  ArrowUpRight, CalendarDays, Check, Clock3, ExternalLink,
  MapPin, Users, X,
} from "lucide-react";
import type { Startup, TechEvent } from "@/types";
import { nearestMetroLabel } from "@/utils/distance";

type Props = {
  startup: Startup | null;
  event: TechEvent | null;
  onClose: () => void;
};

export default function DetailDrawer({ startup, event, onClose }: Props) {
  const open = Boolean(startup || event);
  return (
    <>
      <button className={`drawer-scrim ${open ? "open" : ""}`} aria-label="Close details" onClick={onClose} />
      <section className={`drawer ${open ? "open" : ""}`} aria-hidden={!open}>
        <button className="drawer-close" onClick={onClose}><X size={19} /></button>
        {startup && <CompanyProfile startup={startup} />}
        {event && <EventProfile event={event} />}
      </section>
    </>
  );
}

function CompanyProfile({ startup }: { startup: Startup }) {
  return (
    <>
      <div className="drawer-hero">
        <div className="drawer-grid" />
        <div className="drawer-logo">{startup.name.slice(0, 2).toUpperCase()}</div>
        <div className="hero-badges">
          <span>{startup.category}</span>
          <span>{startup.stage}</span>
          {startup.isBoosted && <span className="boost-chip">XL BOOST</span>}
        </div>
        <h2>{startup.name}</h2>
        <p>{startup.tagline}</p>
        <a href={startup.website} target="_blank" rel="noreferrer">Visit website <ArrowUpRight size={14} /></a>
      </div>

      <div className="drawer-body">
        <div className="company-facts">
          <span><Users size={15} /><small>TEAM</small><b>{startup.teamSize}</b></span>
          <span><CalendarDays size={15} /><small>FOUNDED</small><b>{startup.foundedYear}</b></span>
          <span><MapPin size={15} /><small>BASE</small><b>{startup.location.area}</b></span>
        </div>

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
          <div className="tech-cloud">{startup.techStack.map((tech) => <span key={tech}>{tech}</span>)}</div>
        </section>

        {(startup.benefits?.length || 0) > 0 && (
          <section>
            <div className="section-label">04 / BENEFITS</div>
            <div className="vibes large">{startup.benefits!.map((benefit) => <span key={benefit}><Check size={12} /> {benefit}</span>)}</div>
          </section>
        )}

        <section>
          <div className="section-heading">
            <div className="section-label">05 / OPEN ROLES</div>
            <b>{startup.hiring.jobs.length} LIVE</b>
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
          )) : <p className="muted">No open roles right now. Bookmark this company to check back.</p>}
        </section>

        <section>
          <div className="section-label">06 / FUNDING SIGNAL</div>
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
        </section>

        <section>
          <div className="section-label">07 / LOCAL INTEL</div>
          <div className="local-card">
            <MapPin size={17} />
            <div>
              <b>{startup.location.building}</b>
              <p>{nearestMetroLabel(startup.location.coordinates)}</p>
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
