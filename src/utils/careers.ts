const GOOGLE_FORM = /(?:^|\.)(?:docs\.google\.com|forms\.gle)$/i;

export function isGoogleFormUrl(value: string) {
  const url = value.trim();
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "forms.gle") return true;
    return host === "docs.google.com" && parsed.pathname.toLowerCase().includes("/forms");
  } catch {
    return GOOGLE_FORM.test(url) || /docs\.google\.com\/forms/i.test(url);
  }
}

export function careersUrlFromInput(value: string) {
  return value.trim();
}

export const CAREERS_HINT =
  "Link to where the roles are actually listed — your careers page, LinkedIn, Wellfound. Please don't send a Google Form: a real listing comes down when you close the role, so the link stops being wrong on its own.";
