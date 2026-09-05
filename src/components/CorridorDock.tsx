"use client";

import { ChevronDown } from "lucide-react";
import type { CorridorPulse } from "@/types";

type Props = {
  slots: CorridorPulse[];
  collapsed: boolean;
  onToggle: () => void;
  onClaim: (slot: CorridorPulse) => void;
  onOpenLive: (slot: CorridorPulse) => void;
};

export default function CorridorDock({ slots, collapsed, onToggle, onClaim, onOpenLive }: Props) {
  const live = slots.filter((item) => item.campaign).length;

  return (
    <div className={`corridor-dock ${collapsed ? "is-collapsed" : ""}`}>
      <div className="corridor-dock-head">
        <div>
          <strong>Corridor pulse</strong>
          {!collapsed && <p>One brand per Hyderabad belt. Empty until someone books it.</p>}
        </div>
        <small>{live}/{slots.length} live</small>
        <button type="button" className="dock-collapse" onClick={onToggle} aria-expanded={!collapsed}>
          <ChevronDown size={14} />
        </button>
      </div>
      <div className="corridor-dock-track">
        {slots.map((slot) => {
          const liveBoard = slot.campaign;
          return (
            <button
              key={slot.id}
              type="button"
              className={`corridor-card ${liveBoard ? "is-live" : "is-open"}`}
              onClick={() => (liveBoard ? onOpenLive(slot) : onClaim(slot))}
            >
              <span>{liveBoard ? "LIVE" : "OPEN"}</span>
              <strong>{liveBoard ? liveBoard.sponsorName : slot.label}</strong>
              <small>{slot.name}</small>
              <em>{liveBoard ? liveBoard.tagline : `Claim · ${slot.weeklyPrice}/wk`}</em>
            </button>
          );
        })}
      </div>
    </div>
  );
}
