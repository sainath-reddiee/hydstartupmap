"use client";

import { BriefcaseBusiness, LayoutGrid, Map, Moon, Plus, Radio, Sun } from "lucide-react";
import type { Mode, ViewMode } from "@/types";

type Props = {
  mode: Mode;
  viewMode: ViewMode;
  stats: { startups: number; jobs: number; events: number; news: number };
  search: string;
  onSearch: (value: string) => void;
  onModeChange: (mode: Mode) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenJobs: () => void;
  onOpenModal: (modal: "billboard" | "submit" | "job" | "event") => void;
};

export default function Header({
  mode, viewMode, stats, search, onSearch, onModeChange, onViewModeChange, onOpenJobs, onOpenModal,
}: Props) {
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

        <label className="header-search">
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search startups, corridors, founders..."
            aria-label="Search the map"
          />
        </label>

        <div className="nav-actions">
          <div className="view-toggle" aria-label="Map or grid">
            <button className={viewMode === "map" ? "active" : ""} onClick={() => onViewModeChange("map")}><Map size={14} /> Map</button>
            <button className={viewMode === "grid" ? "active" : ""} onClick={() => onViewModeChange("grid")}><LayoutGrid size={14} /> Grid</button>
          </div>
          <div className="mode-toggle" aria-label="Day or night">
            <button className={mode === "day" ? "active" : ""} onClick={() => onModeChange("day")}><Sun size={14} /></button>
            <button className={mode === "night" ? "active" : ""} onClick={() => onModeChange("night")}><Moon size={14} /></button>
          </div>
          <button className="jobs-chip" onClick={onOpenJobs}>
            <BriefcaseBusiness size={14} /> {stats.jobs} jobs
          </button>
          <button className="action-btn action-btn--desktop" onClick={() => onOpenModal("billboard")}>Claim corridor</button>
          <button className="action-btn action-btn--submit" onClick={() => onOpenModal("submit")}><Plus size={15} /> Add company</button>
        </div>
      </nav>
    </header>
  );
}
