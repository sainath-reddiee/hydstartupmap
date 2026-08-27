"use client";

import { useState } from "react";
import { ArrowUpRight, Building2, Check, Plus, ShieldCheck, Sparkles, X, Zap } from "lucide-react";

export type ModalKind = "boost" | "billboard" | "submit";

const offers = {
  boost: {
    icon: Zap, kicker: "SPATIAL PROMOTION / 01", title: "Own the skyline.", price: "₹2,499", period: "/ week",
    description: "Turn your company into an XL 3D signal with a persistent sonar beacon across the ecosystem map.",
    features: ["2× map pin scale", "Pulsating sonar beacon", "Priority directory placement", "Weekly visibility report"],
    checkout: process.env.NEXT_PUBLIC_DODO_BOOST_URL ?? "https://checkout.dodopayments.com/buy/pdt_boost_demo",
  },
  billboard: {
    icon: Building2, kicker: "SPATIAL PROMOTION / 02", title: "Rent the intersection.", price: "₹1,499", period: "/ week",
    description: "Place a glowing virtual unipole at one of Hyderabad's highest-signal tech intersections.",
    features: ["3D branded billboard", "Clickable destination", "Premium junction placement", "Creative setup included"],
    checkout: process.env.NEXT_PUBLIC_DODO_BILLBOARD_URL ?? "https://checkout.dodopayments.com/buy/pdt_billboard_demo",
  },
};

export default function ActionModal({ kind, onClose }: { kind: ModalKind | null; onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  if (!kind) return null;
  if (kind === "submit") return (
    <div className="modal-wrap" role="dialog" aria-modal="true">
      <button className="modal-scrim" onClick={onClose} aria-label="Close" />
      <div className="modal">
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        {!submitted ? <>
          <span className="modal-icon"><Plus /></span><span className="eyebrow">COMMUNITY SIGNAL / FREE</span>
          <h2>Put your company<br/>on the grid.</h2><p>Share the basics. We&apos;ll review the signal before it goes live.</p>
          <form onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}>
            <label>COMPANY NAME<input required placeholder="e.g. Acme Labs" /></label>
            <label>WEBSITE<input required type="url" placeholder="https://" /></label>
            <label>ONE-LINE PITCH<textarea required placeholder="What are you building?" /></label>
            <button className="modal-primary" type="submit">Submit for review <ArrowUpRight size={15} /></button>
          </form>
        </> : <div className="success"><span><Check size={28} /></span><h2>Signal received.</h2><p>Your listing is queued for community review. No account needed.</p><button className="modal-primary" onClick={onClose}>Back to the map</button></div>}
      </div>
    </div>
  );

  const offer = offers[kind];
  const Icon = offer.icon;
  return (
    <div className="modal-wrap" role="dialog" aria-modal="true">
      <button className="modal-scrim" onClick={onClose} aria-label="Close" />
      <div className="modal offer-modal">
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        <span className="modal-icon"><Icon /></span><span className="eyebrow">{offer.kicker}</span>
        <h2>{offer.title}</h2><p>{offer.description}</p>
        <div className="offer-price"><strong>{offer.price}</strong><span>{offer.period}</span></div>
        <ul>{offer.features.map((item) => <li key={item}><Check size={14} /> {item}</li>)}</ul>
        <a className="modal-primary" href={offer.checkout} target="_blank" rel="noreferrer">Continue with Dodo Payments <ArrowUpRight size={15} /></a>
        <small className="secure"><ShieldCheck size={13} /> Secure checkout powered by Dodo Payments</small>
        <div className="offer-note"><Sparkles size={14} /> No account or dashboard required. Placement details are collected after checkout.</div>
      </div>
    </div>
  );
}
