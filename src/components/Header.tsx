"use client";

import { Building2, Moon, Plus, Radio, Sun, Zap } from "lucide-react";
import sponsorsData from "@/data/sponsors.json";
import type { Mode } from "@/types";

type Props = {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  onOpenModal: (modal: "boost" | "billboard" | "submit") => void;
};

export default function Header({ mode, onModeChange, onOpenModal }: Props) {
  return (
    <header className="top">
      <nav className="navbar">
        <div className="brand">
          <div className="brand-mark"><Radio size={19} /></div>
          <div><strong>HYDTECH<span>PULSE</span></strong><small>3D ECOSYSTEM GRID</small></div>
        </div>
        <div className="live-stats">
          <span><b>85+</b> STARTUPS</span><span><b>120+</b> ACTIVE ROLES</span><span><b>14+</b> EVENTS</span>
        </div>
        <div className="nav-actions">
          <div className="mode-toggle" aria-label="Map mode">
            <button className={mode === "day" ? "active" : ""} onClick={() => onModeChange("day")}><Sun size={14} /> Day</button>
            <button className={mode === "night" ? "active" : ""} onClick={() => onModeChange("night")}><Moon size={14} /> Night</button>
          </div>
          <button className="action-btn action-btn--boost" onClick={() => onOpenModal("boost")}><Zap size={15} /> Boost pin <small>₹2,499</small></button>
          <button className="action-btn action-btn--desktop" onClick={() => onOpenModal("billboard")}><Building2 size={15} /> 3D Billboard</button>
          <button className="action-btn action-btn--submit" onClick={() => onOpenModal("submit")}><Plus size={15} /> Add company</button>
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
