const KEYS = {
  bookmarks: "hydtechpulse:bookmarks",
  mode: "hydtechpulse:mode",
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
