"use client";

import { FormEvent, useState } from "react";
import { ArrowUpRight, Building2, Check, Plus, ShieldCheck, Sparkles, X } from "lucide-react";
import type { AreaName, StartupCategory } from "@/types";
import { checkoutFor, createAdOrder, submitCompany, submitHoarding } from "@/utils/cms";

export type ModalKind = "billboard" | "submit" | "job" | "event" | "hoarding";

const offers = {
  billboard: {
    icon: Building2,
    kicker: "ROADSIDE BILLBOARD",
    title: "Virtual Tech Billboard",
    price: "₹1,999",
    period: "/ week",
    description: "Book a glowing roadside digital unipole at Cyber Towers, Mindspace Circle or Gachibowli Flyover — placed on the road, not on rooftops.",
    features: ["Roadside unipole", "Clickable CTA", "Prime junction", "Bottom strip option"],
    product: "billboard" as const,
  },
  job: {
    icon: Sparkles,
    kicker: "JOB SPOTLIGHT",
    title: "Featured Job Spotlight",
    price: "₹499",
    period: "/ week",
    description: "Pin your role with a golden featured card at the top of Hyderabad's jobs board.",
    features: ["Pinned job card", "Gold highlight", "Map company pulse", "Direct apply CTA"],
    product: "job-spotlight" as const,
  },
  event: {
    icon: Sparkles,
    kicker: "EVENT BEACON",
    title: "Featured Event Beacon",
    price: "₹499",
    period: "/ event",
    description: "Highlight your meetup, hackathon or demo day with a glowing calendar beacon.",
    features: ["Featured badge", "Map beacon", "Directory boost", "RSVP spotlight"],
    product: "event-beacon" as const,
  },
};

const areas: AreaName[] = ["HITEC City", "Madhapur", "Gachibowli", "Financial District", "Jubilee Hills", "Kondapur", "Banjara Hills", "Raidurg", "Nanakramguda"];
const categories: StartupCategory[] = ["AI & Data", "SaaS & Enterprise", "Fintech", "Healthtech & Bio", "Deeptech & Hardware", "Consumer & D2C", "Edtech", "Space & Aerospace"];

export default function ActionModal({ kind, onClose }: { kind: ModalKind | null; onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  if (!kind) return null;

  if (kind === "hoarding") {
    const submitSighting = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const file = data.get("photo");
      let imageDataUrl: string | undefined;
      if (file instanceof File && file.size > 0) {
        if (file.size > 750_000) {
          alert("Please upload a photo smaller than 750 KB for browser storage.");
          return;
        }
        imageDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });
      }
      submitHoarding({
        brandName: String(data.get("brandName") || ""),
        junctionName: String(data.get("junctionName") || ""),
        caption: String(data.get("caption") || ""),
        submittedBy: String(data.get("email") || ""),
        imageDataUrl,
      });
      setSubmitted(true);
    };

    return (
      <div className="modal-wrap" role="dialog" aria-modal="true">
        <button className="modal-scrim" onClick={onClose} aria-label="Close" />
        <div className="modal animate-pop">
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
          {!submitted ? (
            <>
              <span className="modal-icon">📸</span>
              <span className="eyebrow">HOARDING WALL OF FAME</span>
              <h2>Spotted a great startup billboard?</h2>
              <p>Share the campaign, location and your reaction. Approved sightings appear on Hyderabad&apos;s OOH pulse.</p>
              <form onSubmit={submitSighting}>
                <label>BRAND / CAMPAIGN<input name="brandName" required placeholder="e.g. CRED vs. Zepto" /></label>
                <label>JUNCTION / ROAD<input name="junctionName" required placeholder="e.g. Durgam Cheruvu" /></label>
                <label>YOUR EMAIL<input name="email" required type="email" placeholder="you@email.com" /></label>
                <label>PHOTO<input name="photo" required type="file" accept="image/*" /></label>
                <label>CAPTION / REACTION<textarea name="caption" required placeholder="What made this hoarding worth spotting?" /></label>
                <button className="modal-primary" type="submit">Send to the wall <ArrowUpRight size={15} /></button>
              </form>
            </>
          ) : (
            <div className="success">
              <span><Check size={28} /></span>
              <h2>Sighting received</h2>
              <p>The owner can approve it from the admin OOH queue before it appears publicly.</p>
              <button className="modal-primary" onClick={onClose}>Back to the map</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (kind === "submit") {
    const onSubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      submitCompany({
        companyName: String(data.get("companyName") || ""),
        website: String(data.get("website") || ""),
        pitch: String(data.get("pitch") || ""),
        area: String(data.get("area") || "HITEC City") as AreaName,
        category: String(data.get("category") || "SaaS & Enterprise") as StartupCategory,
        contactEmail: String(data.get("email") || ""),
        careersUrl: String(data.get("careersUrl") || ""),
      });
      setSubmitted(true);
    };

    return (
      <div className="modal-wrap" role="dialog" aria-modal="true">
        <button className="modal-scrim" onClick={onClose} aria-label="Close" />
        <div className="modal animate-pop">
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
          {!submitted ? (
            <>
              <span className="modal-icon"><Plus /></span>
              <span className="eyebrow">FREE LISTING · ADMIN REVIEW</span>
              <h2>List your Hyderabad company</h2>
              <p>Submit once. The owner reviews, edits if needed, then publishes to the map.</p>
              <form onSubmit={onSubmit}>
                <label>COMPANY NAME<input name="companyName" required placeholder="e.g. Darwinbox" /></label>
                <label>WEBSITE<input name="website" required type="url" placeholder="https://" /></label>
                <label>CONTACT EMAIL<input name="email" required type="email" placeholder="you@company.com" /></label>
                <div className="form-grid">
                  <label>AREA<select name="area">{areas.map((area) => <option key={area}>{area}</option>)}</select></label>
                  <label>CATEGORY<select name="category">{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
                </div>
                <label>CAREERS URL<input name="careersUrl" type="url" placeholder="https://..." /></label>
                <label>ONE-LINE PITCH<textarea name="pitch" required placeholder="What are you building in Hyderabad?" /></label>
                <button className="modal-primary" type="submit">Send for approval <ArrowUpRight size={15} /></button>
              </form>
            </>
          ) : (
            <div className="success">
              <span><Check size={28} /></span>
              <h2>Submitted for review</h2>
              <p>Your listing is in the admin approval queue. It appears publicly only after approval.</p>
              <button className="modal-primary" onClick={onClose}>Back to the map</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const offer = offers[kind];
  const Icon = offer.icon;

  const startCheckout = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const order = createAdOrder({
      product: offer.product,
      companyName: String(data.get("companyName") || ""),
      contactEmail: String(data.get("email") || ""),
      notes: String(data.get("notes") || ""),
    });
    setCheckoutUrl(order.checkoutUrl);
    window.open(order.checkoutUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="modal-wrap" role="dialog" aria-modal="true">
      <button className="modal-scrim" onClick={onClose} aria-label="Close" />
      <div className="modal offer-modal animate-pop">
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        <span className="modal-icon"><Icon /></span>
        <span className="eyebrow">{offer.kicker}</span>
        <h2>{offer.title}</h2>
        <p>{offer.description}</p>
        <div className="offer-price"><strong>{offer.price}</strong><span>{offer.period}</span></div>
        <ul>{offer.features.map((item) => <li key={item}><Check size={14} /> {item}</li>)}</ul>
        {!checkoutUrl ? (
          <form onSubmit={startCheckout}>
            <label>COMPANY / BRAND<input name="companyName" required placeholder="Company name" /></label>
            <label>BILLING EMAIL<input name="email" required type="email" placeholder="finance@company.com" /></label>
            <label>NOTES<textarea name="notes" placeholder="Junction preference, job title, campaign dates..." /></label>
            <button className="modal-primary" type="submit">Pay with Dodo Payments <ArrowUpRight size={15} /></button>
          </form>
        ) : (
          <div className="success">
            <span><Check size={28} /></span>
            <h2>Checkout opened</h2>
            <p>Complete Dodo Payments in the new tab. Admin can mark this campaign live after payment.</p>
            <a className="modal-primary" href={checkoutUrl} target="_blank" rel="noreferrer">Reopen checkout <ArrowUpRight size={15} /></a>
          </div>
        )}
        <small className="secure"><ShieldCheck size={13} /> Secure checkout powered by Dodo Payments · {checkoutFor(offer.product).amount}</small>
      </div>
    </div>
  );
}
