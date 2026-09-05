"use client";

import { Bell, BriefcaseBusiness, LayoutGrid, Map, Maximize2, Minimize2, Moon, Plus, Radio, Sun } from "lucide-react";
import type { Mode, ViewMode } from "@/types";

type Props = {
  mode: Mode;
  viewMode: ViewMode;
  railsCollapsed: boolean;
  stats: { startups: number; jobs: number; jobsLabel: string; events: number; news: number };
  search: string;
  onSearch: (value: string) => void;
  onModeChange: (mode: Mode) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onToggleRails: () => void;
  onOpenJobs: () => void;
  onOpenAlerts: () => void;
  onOpenModal: (modal: "billboard" | "submit" | "job" | "event") => void;
};

export default function Header({
  mode, viewMode, railsCollapsed, stats, search, onSearch, onModeChange, onViewModeChange,
  onToggleRails, onOpenJobs, onOpenAlerts, onOpenModal,
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
          {viewMode === "map" && (
            <button
              className={`rail-toggle ${railsCollapsed ? "is-full" : ""}`}
              onClick={onToggleRails}
              aria-pressed={railsCollapsed}
              title={railsCollapsed ? "Show directory" : "Full-screen map"}
            >
              {railsCollapsed ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              <span>{railsCollapsed ? "Directory" : "Full map"}</span>
            </button>
          )}
          <div className="view-toggle" aria-label="Map or grid">
            <button className={viewMode === "map" ? "active" : ""} onClick={() => onViewModeChange("map")}><Map size={14} /> Map</button>
            <button className={viewMode === "grid" ? "active" : ""} onClick={() => onViewModeChange("grid")}><LayoutGrid size={14} /> Grid</button>
          </div>
          <div className="mode-toggle" aria-label="Day or night">
            <button className={mode === "day" ? "active" : ""} onClick={() => onModeChange("day")}><Sun size={14} /></button>
            <button className={mode === "night" ? "active" : ""} onClick={() => onModeChange("night")}><Moon size={14} /></button>
          </div>
          <button className="alerts-chip" onClick={onOpenAlerts}>
            <Bell size={14} /> Alerts
          </button>
          <button className="jobs-chip" onClick={onOpenJobs}>
            <BriefcaseBusiness size={14} /> {stats.jobs} {stats.jobsLabel}
          </button>
          <button className="action-btn action-btn--desktop" onClick={() => onOpenModal("billboard")}>Claim corridor</button>
          <button className="action-btn action-btn--submit" onClick={() => onOpenModal("submit")}><Plus size={15} /> Add company</button>
        </div>
      </nav>
    </header>
  );
}
