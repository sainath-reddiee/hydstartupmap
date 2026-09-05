import type { JobAlertPref } from "@/types";

const KEYS = {
  bookmarks: "hydtechpulse:bookmarks",
  mode: "hydtechpulse:mode",
  rails: "hydtechpulse:rails-collapsed",
  banner: "hydtechpulse:banner-dismissed",
  alerts: "hydtechpulse:job-alerts",
};

export function getBookmarks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEYS.bookmarks) ?? "[]");
  } catch {
    return [];
  }
}

export function toggleStoredBookmark(id: string): string[] {
  const current = getBookmarks();
  const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
  localStorage.setItem(KEYS.bookmarks, JSON.stringify(next));
  return next;
}

export function getStoredMode(): "day" | "night" | null {
  if (typeof window === "undefined") return null;
  const mode = localStorage.getItem(KEYS.mode);
  return mode === "day" || mode === "night" ? mode : null;
}

export function setStoredMode(mode: "day" | "night") {
  localStorage.setItem(KEYS.mode, mode);
}

export function getRailsCollapsed() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEYS.rails) === "1";
}

export function setRailsCollapsed(value: boolean) {
  localStorage.setItem(KEYS.rails, value ? "1" : "0");
}

export function getBannerDismissed() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEYS.banner) === "1";
}

export function setBannerDismissed() {
  localStorage.setItem(KEYS.banner, "1");
}

export function getJobAlert(): JobAlertPref | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEYS.alerts);
    return raw ? JSON.parse(raw) as JobAlertPref : null;
  } catch {
    return null;
  }
}

export function saveJobAlert(pref: Omit<JobAlertPref, "createdAt">) {
  const next: JobAlertPref = { ...pref, createdAt: new Date().toISOString() };
  localStorage.setItem(KEYS.alerts, JSON.stringify(next));
  return next;
}
