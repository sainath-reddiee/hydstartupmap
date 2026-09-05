"use client";

import type { CorridorPulse } from "@/types";

type Props = {
  slots: CorridorPulse[];
  onClaim: (slot: CorridorPulse) => void;
  onOpenLive: (slot: CorridorPulse) => void;
};

export default function CorridorDock({ slots, onClaim, onOpenLive }: Props) {
  const live = slots.filter((item) => item.campaign).length;

  return (
    <div className="corridor-dock">
      <div className="corridor-dock-head">
        <div>
          <strong>Corridor pulse</strong>
          <p>One brand per Hyderabad belt. Empty until someone books it.</p>
        </div>
        <small>{live}/{slots.length} live</small>
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
              <em>{liveBoard ? liveBoard.tagline : `${slot.weeklyPrice} / week`}</em>
            </button>
          );
        })}
      </div>
    </div>
  );
}
