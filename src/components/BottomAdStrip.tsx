"use client";

import { Megaphone, X } from "lucide-react";
import { useState } from "react";
import sponsorsData from "@/data/sponsors.json";
import type { RoadBillboard } from "@/types";

type Slot = {
  id: string;
  type: "live" | "open";
  brand: string;
  tagline: string;
  priceLabel: string;
  cta: string;
};

const slots = (sponsorsData as { promoteSlots: Slot[] }).promoteSlots;

export default function BottomAdStrip({
  onPromote,
  billboards = [],
  onSelectBillboard,
}: {
  onPromote: () => void;
  billboards?: RoadBillboard[];
  onSelectBillboard?: (billboard: RoadBillboard) => void;
}) {
  const [hidden, setHidden] = useState(false);
  const liveBoards = billboards.filter((item) => item.isLive).slice(0, 2);

  if (hidden) {
    return (
      <button className="bottom-ads-reopen" onClick={() => setHidden(false)}>
        <Megaphone size={14} /> Promote
      </button>
    );
  }

  return (
    <div className="bottom-ads">
      <button className="bottom-ads-close" aria-label="Hide promote strip" onClick={() => setHidden(true)}>
        <X size={14} />
      </button>
      <div className="bottom-ads-kicker">
        <Megaphone size={13} />
        <span>Hyderabad spotlight</span>
        <small>{liveBoards.length} live boards</small>
      </div>
      <div className="bottom-ads-track">
        {liveBoards.map((board) => (
          <button
            key={board.id}
            type="button"
            className="promo-slot live board-promo"
            onClick={() => onSelectBillboard?.(board)}
          >
            <span className="promo-badge">{board.mediaOwner === "Personal" ? "YOU" : "LIVE"}</span>
            <div className="promo-logo">{board.sponsorName.slice(0, 2).toUpperCase()}</div>
            <div>
              <strong>{board.sponsorName}</strong>
              <small>{board.junctionName}</small>
            </div>
          </button>
        ))}
        {slots.filter((slot) => slot.type === "open").slice(0, 2).map((slot) => (
          <button key={slot.id} className="promo-slot open" onClick={onPromote}>
            <span className="promo-price">{slot.priceLabel}</span>
            <strong>{slot.brand}</strong>
            <small>{slot.tagline}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
