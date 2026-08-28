"use client";

import Link from "next/link";
import { Building2, Moon, Newspaper, Plus, Radio, Sparkles, Sun } from "lucide-react";
import sponsorsData from "@/data/sponsors.json";
import type { Mode } from "@/types";

type Props = {
  mode: Mode;
  stats: { startups: number; jobs: number; events: number; news: number };
  onModeChange: (mode: Mode) => void;
  onOpenModal: (modal: "billboard" | "submit" | "job" | "event") => void;
};

export default function Header({ mode, stats, onModeChange, onOpenModal }: Props) {
  return (
    <header className="top">
      <nav className="navbar">
        <div className="brand">
          <div className="brand-mark"><Radio size={18} /></div>
          <div>
            <strong>HYDTECH<span>PULSE</span></strong>
            <small>HYDERABAD STARTUP MAP</small>
          </div>
        </div>

        <div className="live-stats">
          <span><b>{stats.startups}+</b> startups</span>
          <span><b>{stats.jobs}+</b> jobs</span>
          <span><b>{stats.events}+</b> events</span>
          <span><b>{stats.news}+</b> news</span>
        </div>

        <div className="nav-actions">
          <div className="mode-toggle" aria-label="Map mode">
            <button className={mode === "day" ? "active" : ""} onClick={() => onModeChange("day")}><Sun size={14} /> Day</button>
            <button className={mode === "night" ? "active" : ""} onClick={() => onModeChange("night")}><Moon size={14} /> Night</button>
          </div>
          <button className="action-btn action-btn--desktop" onClick={() => onOpenModal("billboard")}><Building2 size={15} /> Billboard</button>
          <button className="action-btn action-btn--desktop" onClick={() => onOpenModal("job")}><Sparkles size={15} /> Job ad</button>
          <button className="action-btn action-btn--submit" onClick={() => onOpenModal("submit")}><Plus size={15} /> Add company</button>
          <Link href="/admin" className="admin-link" title="Admin portal"><Newspaper size={15} /></Link>
        </div>
      </nav>

      <div className="marquee">
        <div className="marquee-track">
          {[...sponsorsData.marquee, ...sponsorsData.marquee].map((item, index) => (
            <span key={`${item.label}-${index}`}><b>{item.label}</b> {item.message}<i>◆</i></span>
          ))}
        </div>
      </div>
    </header>
  );
}
