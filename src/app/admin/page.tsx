"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Check, Download, Eye, EyeOff, LogOut, Megaphone, Newspaper,
  RefreshCcw, Shield, Trash2, Upload, X,
} from "lucide-react";
import type { AdOrder, CmsState, CompanySubmission, Startup } from "@/types";
import {
  approveSubmission, deleteStartup, exportCms, importCms, isAdminAuthed,
  loadCms, loginAdmin, logoutAdmin, markAdOrder, moderateHoarding, rejectSubmission, resetCms,
  subscribeCms, upsertStartup,
} from "@/utils/cms";

type AdminTab = "queue" | "companies" | "ads" | "news" | "export";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [cms, setCms] = useState<CmsState | null>(null);
  const [tab, setTab] = useState<AdminTab>("queue");
  const [editing, setEditing] = useState<Startup | null>(null);
  const [showPin, setShowPin] = useState(false);

  const refresh = () => setCms(loadCms());

  useEffect(() => {
    setAuthed(isAdminAuthed());
    refresh();
    return subscribeCms(refresh);
  }, []);

  const pending = useMemo(
    () => cms?.submissions.filter((item) => item.status === "pending") ?? [],
    [cms],
  );

  if (!authed) {
    return (
      <main className="admin-login">
        <form
          className="admin-card animate-pop"
          onSubmit={(event) => {
            event.preventDefault();
            if (loginAdmin(pin)) {
              setAuthed(true);
              setError("");
              refresh();
            } else {
              setError("Incorrect admin PIN");
            }
          }}
        >
          <div className="admin-badge"><Shield size={18} /> OWNER PORTAL</div>
          <h1>HydTechPulse Admin</h1>
          <p>Approve listings, edit companies/jobs, and activate paid placements. Data stays in this browser — export JSON to back it up or commit it.</p>
          <label>
            ADMIN PIN
            <div className="pin-row">
              <input
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter admin PIN"
                required
              />
              <button type="button" onClick={() => setShowPin((value) => !value)} aria-label="Toggle PIN visibility">
                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>
          {error && <p className="admin-error">{error}</p>}
          <button className="modal-primary" type="submit">Enter admin</button>
          <Link href="/" className="admin-back"><ArrowLeft size={14} /> Back to public map</Link>
        </form>
      </main>
    );
  }

  if (!cms) return null;

  return (
    <main className="admin-shell">
      <aside className="admin-side">
        <div className="admin-side-head">
          <b>HydTechPulse</b>
          <small>Owner control</small>
        </div>
        <nav>
          {([
            ["queue", `Approvals (${pending.length})`],
            ["companies", `Companies (${cms.startups.length})`],
            ["ads", `Ads (${cms.adOrders.length})`],
            ["news", `News (${cms.news.length})`],
            ["export", "Export / Import"],
          ] as Array<[AdminTab, string]>).map(([id, label]) => (
            <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}</button>
          ))}
        </nav>
        <div className="admin-side-actions">
          <Link href="/">View public site</Link>
          <button onClick={() => { logoutAdmin(); setAuthed(false); }}><LogOut size={14} /> Sign out</button>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-main-head">
          <div>
            <h1>{tab === "queue" ? "Listing approvals" : tab === "companies" ? "Companies & jobs" : tab === "ads" ? "Paid placements" : tab === "news" ? "News feed" : "Backup"}</h1>
            <p>Updated {new Date(cms.updatedAt).toLocaleString()}</p>
          </div>
          <button className="ghost-btn" onClick={refresh}><RefreshCcw size={14} /> Refresh</button>
        </header>

        {tab === "queue" && (
          <div className="admin-grid">
            {pending.length === 0 && <div className="empty-admin">No pending company submissions.</div>}
            {pending.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                onApprove={() => { approveSubmission(submission.id); refresh(); }}
                onReject={() => { rejectSubmission(submission.id); refresh(); }}
              />
            ))}
            {cms.submissions.filter((item) => item.status !== "pending").slice(0, 8).map((submission) => (
              <article key={submission.id} className="admin-item muted-card">
                <span className={`status-pill ${submission.status}`}>{submission.status}</span>
                <h3>{submission.companyName}</h3>
                <p>{submission.pitch}</p>
              </article>
            ))}
          </div>
        )}

        {tab === "companies" && (
          <div className="admin-grid">
            {cms.startups.map((startup) => (
              <article key={startup.id} className="admin-item">
                <div className="admin-item-top">
                  <div className="startup-logo small">{startup.name.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <h3>{startup.name}</h3>
                    <p>{startup.location.area} · {startup.hiring.jobs.length} jobs · {startup.isPublished === false ? "Hidden" : "Live"}</p>
                  </div>
                </div>
                <div className="admin-item-actions">
                  <button onClick={() => setEditing(startup)}>Edit</button>
                  <button onClick={() => {
                    upsertStartup({ ...startup, isBoosted: !startup.isBoosted });
                    refresh();
                  }}>{startup.isBoosted ? "Unboost" : "Boost"}</button>
                  <button onClick={() => {
                    upsertStartup({ ...startup, isPublished: startup.isPublished === false });
                    refresh();
                  }}>{startup.isPublished === false ? "Publish" : "Hide"}</button>
                  <button className="danger" onClick={() => { deleteStartup(startup.id); refresh(); }}><Trash2 size={14} /></button>
                </div>
              </article>
            ))}
          </div>
        )}

        {tab === "ads" && (
          <div className="admin-grid">
            {cms.adOrders.length === 0 && <div className="empty-admin">No ad orders yet. Public boost/billboard/job/event checkouts will appear here.</div>}
            {cms.adOrders.map((order) => (
              <AdCard key={order.id} order={order} onStatus={(status) => { markAdOrder(order.id, status); refresh(); }} />
            ))}
            <div className="admin-item">
              <h3><Megaphone size={16} /> Live billboards</h3>
              {cms.billboards.map((billboard) => (
                <p key={billboard.id}>{billboard.sponsorName} · {billboard.junctionName} · {billboard.isLive ? "LIVE" : "OFF"}</p>
              ))}
            </div>
            {cms.hoardings.map((sighting) => (
              <article className="admin-item" key={sighting.id}>
                <span className={`status-pill ${sighting.status}`}>{sighting.status} sighting</span>
                {sighting.imageDataUrl && <img className="admin-hoarding-photo" src={sighting.imageDataUrl} alt={sighting.caption} />}
                <h3>{sighting.brandName}</h3>
                <p>{sighting.junctionName} · {sighting.caption}</p>
                <small>{sighting.submittedBy}</small>
                <div className="admin-item-actions">
                  <button className="approve" onClick={() => { moderateHoarding(sighting.id, "approved"); refresh(); }}>Approve</button>
                  <button className="danger" onClick={() => { moderateHoarding(sighting.id, "rejected"); refresh(); }}>Reject</button>
                </div>
              </article>
            ))}
          </div>
        )}

        {tab === "news" && (
          <div className="admin-grid">
            {cms.news.map((item) => (
              <article key={item.id} className="admin-item">
                <span className="status-pill approved">{item.source}</span>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                <small>{item.publishedAt} · {item.tags.join(", ")}</small>
              </article>
            ))}
          </div>
        )}

        {tab === "export" && (
          <div className="admin-grid">
            <article className="admin-item">
              <h3><Download size={16} /> Export CMS JSON</h3>
              <p>Download the full company, jobs, news, ads and approvals state. Commit it into `src/data` when you want the public site to ship your edits.</p>
              <button className="modal-primary" onClick={() => {
                const blob = new Blob([exportCms()], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.download = `hydtechpulse-cms-${Date.now()}.json`;
                anchor.click();
                URL.revokeObjectURL(url);
              }}>Download backup</button>
            </article>
            <article className="admin-item">
              <h3><Upload size={16} /> Import CMS JSON</h3>
              <p>Restore a previous export on this browser.</p>
              <input type="file" accept="application/json" onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                importCms(await file.text());
                refresh();
              }} />
            </article>
            <article className="admin-item">
              <h3><RefreshCcw size={16} /> Reset to seed data</h3>
              <p>Clears local admin overrides and restores the curated Hyderabad seed dataset.</p>
              <button className="danger-btn" onClick={() => { resetCms(); refresh(); }}>Reset CMS</button>
            </article>
          </div>
        )}
      </section>

      {editing && (
        <EditStartupModal
          startup={editing}
          onClose={() => setEditing(null)}
          onSave={(next) => {
            upsertStartup(next);
            setEditing(null);
            refresh();
          }}
        />
      )}
    </main>
  );
}

function SubmissionCard({
  submission, onApprove, onReject,
}: {
  submission: CompanySubmission;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <article className="admin-item">
      <span className="status-pill pending">pending</span>
      <h3>{submission.companyName}</h3>
      <p>{submission.pitch}</p>
      <small>{submission.website} · {submission.area} · {submission.category}</small>
      <small>{submission.contactEmail}</small>
      <div className="admin-item-actions">
        <button className="approve" onClick={onApprove}><Check size={14} /> Approve & publish</button>
        <button className="danger" onClick={onReject}><X size={14} /> Reject</button>
      </div>
    </article>
  );
}

function AdCard({
  order, onStatus,
}: {
  order: AdOrder;
  onStatus: (status: AdOrder["status"]) => void;
}) {
  return (
    <article className="admin-item">
      <span className={`status-pill ${order.status}`}>{order.status}</span>
      <h3>{order.companyName}</h3>
      <p>{order.product} · {order.amount}</p>
      <small>{order.contactEmail}</small>
      {order.notes && <small>{order.notes}</small>}
      <div className="admin-item-actions">
        <a href={order.checkoutUrl} target="_blank" rel="noreferrer">Checkout</a>
        <button onClick={() => onStatus("paid")}>Mark paid</button>
        <button className="approve" onClick={() => onStatus("live")}>Make live</button>
        <button onClick={() => onStatus("expired")}>Expire</button>
      </div>
    </article>
  );
}

function EditStartupModal({
  startup, onClose, onSave,
}: {
  startup: Startup;
  onClose: () => void;
  onSave: (startup: Startup) => void;
}) {
  const [draft, setDraft] = useState(startup);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSave(draft);
  };

  return (
    <div className="modal-wrap">
      <button className="modal-scrim" onClick={onClose} aria-label="Close" />
      <form className="modal animate-pop" onSubmit={onSubmit}>
        <button type="button" className="modal-close" onClick={onClose}><X size={18} /></button>
        <span className="eyebrow">EDIT COMPANY</span>
        <h2>{startup.name}</h2>
        <label>NAME<input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
        <label>TAGLINE<input value={draft.tagline} onChange={(e) => setDraft({ ...draft, tagline: e.target.value })} /></label>
        <label>WEBSITE<input value={draft.website} onChange={(e) => setDraft({ ...draft, website: e.target.value })} /></label>
        <label>DESCRIPTION<textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label>
        <label>CAREERS URL<input value={draft.hiring.careersUrl} onChange={(e) => setDraft({
          ...draft,
          hiring: { ...draft.hiring, careersUrl: e.target.value },
        })} /></label>
        <label>
          OPEN JOBS JSON
          <textarea
            value={JSON.stringify(draft.hiring.jobs, null, 2)}
            onChange={(e) => {
              try {
                const jobs = JSON.parse(e.target.value);
                setDraft({ ...draft, hiring: { ...draft.hiring, jobs, isHiring: jobs.length > 0 } });
              } catch {
                // keep typing until JSON is valid
              }
            }}
          />
        </label>
        <button className="modal-primary" type="submit">Save company</button>
      </form>
    </div>
  );
}
