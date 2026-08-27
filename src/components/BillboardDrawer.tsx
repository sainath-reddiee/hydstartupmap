"use client";

import { ArrowUpRight, BarChart3, Building2, Camera, MapPin, Ruler, X } from "lucide-react";
import type { RoadBillboard } from "@/types";

export default function BillboardDrawer({
  billboard,
  onClose,
  onBookVirtual,
  onSubmitSighting,
}: {
  billboard: RoadBillboard | null;
  onClose: () => void;
  onBookVirtual: () => void;
  onSubmitSighting: () => void;
}) {
  if (!billboard) return null;

  const isPhysical = billboard.kind === "physical";
  const isWall = billboard.kind === "wall-of-fame";

  return (
    <>
      <button className="drawer-scrim open" aria-label="Close billboard" onClick={onClose} />
      <section className="billboard-drawer">
        <button className="drawer-close" onClick={onClose}><X size={18} /></button>
        <div className={`billboard-visual ${isPhysical ? "physical" : isWall ? "wall" : "virtual"}`}>
          <div className="ooh-scanline" />
          <span>{isPhysical ? "PHYSICAL OOH INVENTORY" : isWall ? "COMMUNITY WALL OF FAME" : "VIRTUAL MAP SLOT"}</span>
          <strong>{billboard.sponsorName}</strong>
          <p>{billboard.tagline}</p>
        </div>
        <div className="billboard-body">
          <span className={`inventory-status ${billboard.status === "Available" ? "available" : ""}`}>
            {billboard.status ?? "Live campaign"}
          </span>
          <h2>{billboard.junctionName}</h2>
          <p className="inventory-copy">
            {isPhysical
              ? "Prime roadside inventory mapped for tech brands targeting Hyderabad’s highest-value commuter corridor."
              : isWall
                ? "A community-captured startup campaign from Hyderabad’s streets. Add your sighting and reaction."
                : "An exclusive, clickable 3D ad unit rendered beside the road inside HydTechPulse."}
          </p>

          <div className="inventory-metrics">
            <span><BarChart3 size={17} /><small>REACH</small><b>{billboard.dailyImpressions ?? "Live map traffic"}</b></span>
            <span><Ruler size={17} /><small>FORMAT</small><b>{billboard.dimensions ?? "Digital"}</b></span>
            <span><Building2 size={17} /><small>OWNER</small><b>{billboard.mediaOwner ?? "HydTechPulse"}</b></span>
          </div>

          <div className="inventory-location"><MapPin size={17} /><div><small>EXACT PLACEMENT</small><b>{billboard.junctionName}, Hyderabad</b></div></div>

          {isWall ? (
            <button className="inventory-cta" onClick={onSubmitSighting}><Camera size={16} /> Upload your hoarding sighting</button>
          ) : isPhysical ? (
            <a className="inventory-cta" href={billboard.ctaLink}>Inquire to book physical hoarding <ArrowUpRight size={15} /></a>
          ) : (
            <button className="inventory-cta" onClick={onBookVirtual}>
              Book this digital slot · {billboard.weeklyPrice ?? "₹1,999/wk"} <ArrowUpRight size={15} />
            </button>
          )}
          <p className="inventory-disclaimer">
            {isPhysical
              ? "Estimated reach is directional. Final availability and pricing are confirmed by the partner media owner."
              : "Virtual placements are activated after Dodo Payments confirmation and creative review."}
          </p>
        </div>
      </section>
    </>
  );
}
