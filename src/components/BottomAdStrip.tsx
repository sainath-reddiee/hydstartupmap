"use client";

import { Megaphone, X } from "lucide-react";
import { useState } from "react";
import sponsorsData from "@/data/sponsors.json";

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
}: {
  onPromote: () => void;
}) {
  const [hidden, setHidden] = useState(false);
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
      <div className="bottom-ads-track">
        {slots.map((slot) => {
          if (slot.type === "open") {
            return (
              <button key={slot.id} className="promo-slot open" onClick={onPromote}>
                <span className="promo-price">{slot.priceLabel}</span>
                <strong>{slot.brand}</strong>
                <small>{slot.tagline}</small>
              </button>
            );
          }
          return (
            <a key={slot.id} className="promo-slot live" href={slot.cta} target="_blank" rel="noreferrer">
              <span className="promo-badge">AD</span>
              <div className="promo-logo">{slot.brand.slice(0, 2).toUpperCase()}</div>
              <div>
                <strong>{slot.brand}</strong>
                <small>{slot.tagline}</small>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
