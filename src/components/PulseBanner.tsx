"use client";

import { Bell, Building2, MapPinned, X } from "lucide-react";

type Props = {
  hiring: number;
  news: number;
  events: number;
  onAlerts: () => void;
  onJobs: () => void;
  onClaim: () => void;
  onDismiss: () => void;
};

export default function PulseBanner({ hiring, news, events, onAlerts, onJobs, onClaim, onDismiss }: Props) {
  return (
    <section className="pulse-banner" aria-label="HydTechPulse highlights">
      <div className="pulse-banner-copy">
        <span className="eyebrow">HYDERABAD · VERIFIED</span>
        <strong>Careers pages, press links, and pin-point buildings — no invented jobs.</strong>
      </div>
      <div className="pulse-banner-stats">
        <span>{hiring} hiring boards</span>
        <span>{news} sourced stories</span>
        <span>{events} live events</span>
      </div>
      <div className="pulse-banner-actions">
        <button type="button" onClick={onAlerts}><Bell size={13} /> Get job alerts</button>
        <button type="button" onClick={onJobs}><Building2 size={13} /> Open careers</button>
        <button type="button" onClick={onClaim}><MapPinned size={13} /> Claim corridor</button>
      </div>
      <button type="button" className="pulse-banner-close" aria-label="Dismiss banner" onClick={onDismiss}>
        <X size={14} />
      </button>
    </section>
  );
}
