import startupsSeed from "@/data/startups.json";
import eventsSeed from "@/data/events.json";
import newsSeed from "@/data/news.json";
import sponsorsSeed from "@/data/sponsors.json";
import type {
  AdOrder,
  AdProduct,
  CmsState,
  CompanySubmission,
  HoardingSighting,
  NewsItem,
  RoadBillboard,
  Startup,
  TechEvent,
} from "@/types";

const CMS_KEY = "hydtechpulse:cms:v1";
const ADMIN_SESSION_KEY = "hydtechpulse:admin-session";
const DEFAULT_ADMIN_PIN = "hydpulse2026";

const CHECKOUT: Record<AdProduct, { amount: string; url: string }> = {
  boost: {
    amount: "₹2,499",
    url: process.env.NEXT_PUBLIC_DODO_BOOST_URL ?? "https://checkout.dodopayments.com/buy/pdt_boost_demo",
  },
  billboard: {
    amount: "₹1,999",
    url: process.env.NEXT_PUBLIC_DODO_BILLBOARD_URL ?? "https://checkout.dodopayments.com/buy/pdt_billboard_demo",
  },
  "job-spotlight": {
    amount: "₹499",
    url: process.env.NEXT_PUBLIC_DODO_JOB_URL ?? "https://checkout.dodopayments.com/buy/pdt_job_demo",
  },
  "event-beacon": {
    amount: "₹499",
    url: process.env.NEXT_PUBLIC_DODO_EVENT_URL ?? "https://checkout.dodopayments.com/buy/pdt_event_demo",
  },
};

function seedState(): CmsState {
  return {
    startups: (startupsSeed as Startup[]).map((item) => ({ ...item, isPublished: item.isPublished ?? true })),
    events: eventsSeed as TechEvent[],
    news: newsSeed as NewsItem[],
    billboards: sponsorsSeed.billboards as RoadBillboard[],
    hoardings: [],
    submissions: [],
    adOrders: [],
    updatedAt: new Date().toISOString(),
  };
}

function canUseStorage() {
  return typeof window !== "undefined";
}

export function getAdminPin() {
  return process.env.NEXT_PUBLIC_ADMIN_PIN ?? DEFAULT_ADMIN_PIN;
}

export function isAdminAuthed() {
  if (!canUseStorage()) return false;
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "1";
}

export function loginAdmin(pin: string) {
  if (pin !== getAdminPin()) return false;
  sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
  return true;
}

export function logoutAdmin() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

export function loadCms(): CmsState {
  if (!canUseStorage()) return seedState();
  try {
    const raw = localStorage.getItem(CMS_KEY);
    if (!raw) {
      const seeded = seedState();
      localStorage.setItem(CMS_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as CmsState;
    return {
      ...seedState(),
      ...parsed,
      startups: parsed.startups?.length ? parsed.startups : seedState().startups,
      events: parsed.events?.length ? parsed.events : seedState().events,
      news: parsed.news?.length ? parsed.news : seedState().news,
      billboards: (() => {
        const seeded = seedState().billboards;
        const saved = parsed.billboards ?? [];
        const seedIds = new Set(seeded.map((item) => item.id));
        // Prefer curated seed placement for known inventory so road coordinates stay correct.
        const custom = saved.filter((item) => !seedIds.has(item.id));
        return [...seeded, ...custom];
      })(),
      hoardings: parsed.hoardings ?? [],
      submissions: parsed.submissions ?? [],
      adOrders: parsed.adOrders ?? [],
    };
  } catch {
    return seedState();
  }
}

export function saveCms(state: CmsState) {
  const next = { ...state, updatedAt: new Date().toISOString() };
  localStorage.setItem(CMS_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("hydtechpulse:cms"));
  return next;
}

export function subscribeCms(callback: () => void) {
  const handler = () => callback();
  window.addEventListener("storage", handler);
  window.addEventListener("hydtechpulse:cms", handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("hydtechpulse:cms", handler);
  };
}

export function getPublishedStartups(state = loadCms()) {
  return state.startups.filter((item) => item.isPublished !== false);
}

export function submitCompany(input: Omit<CompanySubmission, "id" | "createdAt" | "status">) {
  const state = loadCms();
  const submission: CompanySubmission = {
    ...input,
    id: `sub-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: "pending",
  };
  return saveCms({ ...state, submissions: [submission, ...state.submissions] });
}

export function submitHoarding(input: Omit<HoardingSighting, "id" | "createdAt" | "status">) {
  const state = loadCms();
  const sighting: HoardingSighting = {
    ...input,
    id: `hoarding-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: "pending",
  };
  return saveCms({ ...state, hoardings: [sighting, ...state.hoardings] });
}

export function moderateHoarding(id: string, status: "approved" | "rejected") {
  const state = loadCms();
  return saveCms({
    ...state,
    hoardings: state.hoardings.map((item) => item.id === id ? { ...item, status } : item),
  });
}

export function approveSubmission(id: string, edits?: Partial<Startup>) {
  const state = loadCms();
  const submission = state.submissions.find((item) => item.id === id);
  if (!submission) return state;

  const startup: Startup = {
    id: `startup-${Date.now()}`,
    name: edits?.name ?? submission.companyName,
    tagline: edits?.tagline ?? submission.pitch.slice(0, 80),
    description: edits?.description ?? `${submission.pitch}\n\nSubmitted via HydTechPulse community listing flow.`,
    website: edits?.website ?? submission.website,
    foundedYear: edits?.foundedYear ?? new Date().getFullYear(),
    teamSize: edits?.teamSize ?? "1–10",
    category: edits?.category ?? submission.category,
    stage: edits?.stage ?? "Seed",
    techStack: edits?.techStack ?? ["TypeScript"],
    funding: edits?.funding ?? [{ stage: "Seed" }],
    founders: edits?.founders ?? [],
    benefits: edits?.benefits ?? [],
    investors: edits?.investors ?? [],
    origin: edits?.origin ?? { type: "Independent" },
    location: edits?.location ?? {
      area: submission.area,
      building: "Hyderabad",
      coordinates: [78.38, 17.4485],
    },
    hiring: edits?.hiring ?? {
      isHiring: Boolean(submission.careersUrl),
      careersUrl: submission.careersUrl ?? submission.website,
      jobs: [],
    },
    vibes: edits?.vibes ?? ["🆕 Newly listed"],
    isBoosted: false,
    isPublished: true,
    source: "Community submission",
  };

  return saveCms({
    ...state,
    startups: [startup, ...state.startups],
    submissions: state.submissions.map((item) =>
      item.id === id ? { ...item, status: "approved", notes: "Approved and published" } : item,
    ),
  });
}

export function rejectSubmission(id: string, notes?: string) {
  const state = loadCms();
  return saveCms({
    ...state,
    submissions: state.submissions.map((item) =>
      item.id === id ? { ...item, status: "rejected", notes: notes ?? "Rejected by admin" } : item,
    ),
  });
}

export function upsertStartup(startup: Startup) {
  const state = loadCms();
  const exists = state.startups.some((item) => item.id === startup.id);
  return saveCms({
    ...state,
    startups: exists
      ? state.startups.map((item) => (item.id === startup.id ? startup : item))
      : [startup, ...state.startups],
  });
}

export function deleteStartup(id: string) {
  const state = loadCms();
  return saveCms({ ...state, startups: state.startups.filter((item) => item.id !== id) });
}

export function upsertEvent(event: TechEvent) {
  const state = loadCms();
  const exists = state.events.some((item) => item.id === event.id);
  return saveCms({
    ...state,
    events: exists ? state.events.map((item) => (item.id === event.id ? event : item)) : [event, ...state.events],
  });
}

export function upsertNews(item: NewsItem) {
  const state = loadCms();
  const exists = state.news.some((news) => news.id === item.id);
  return saveCms({
    ...state,
    news: exists ? state.news.map((news) => (news.id === item.id ? item : news)) : [item, ...state.news],
  });
}

export function upsertBillboard(item: RoadBillboard) {
  const state = loadCms();
  const exists = state.billboards.some((billboard) => billboard.id === item.id);
  return saveCms({
    ...state,
    billboards: exists
      ? state.billboards.map((billboard) => (billboard.id === item.id ? item : billboard))
      : [item, ...state.billboards],
  });
}

/** Owner/personal tool: drop a live board at any map coordinate (stored in local CMS). */
export function placeBillboard(input: {
  sponsorName: string;
  tagline: string;
  junctionName: string;
  coordinates: [number, number];
  kind?: RoadBillboard["kind"];
  ctaLink?: string;
}) {
  const item: RoadBillboard = {
    id: `place-${Date.now()}`,
    junctionName: input.junctionName,
    coordinates: input.coordinates,
    sponsorName: input.sponsorName,
    tagline: input.tagline,
    ctaLink: input.ctaLink || "https://example.com",
    isLive: true,
    kind: input.kind ?? "virtual",
    status: "Live campaign",
    dailyImpressions: "Manual pin",
    weeklyPrice: "Owner placed",
    dimensions: "Dynamic roadside board",
    mediaOwner: "Personal",
  };
  return upsertBillboard(item);
}

export function deleteBillboard(id: string) {
  const state = loadCms();
  return saveCms({
    ...state,
    billboards: state.billboards.filter((item) => item.id !== id),
  });
}

export function createAdOrder(input: {
  product: AdProduct;
  companyName: string;
  contactEmail: string;
  notes?: string;
}) {
  const offer = CHECKOUT[input.product];
  const state = loadCms();
  const order: AdOrder = {
    id: `ad-${Date.now()}`,
    product: input.product,
    companyName: input.companyName,
    contactEmail: input.contactEmail,
    amount: offer.amount,
    createdAt: new Date().toISOString(),
    status: "awaiting-payment",
    checkoutUrl: offer.url,
    notes: input.notes,
  };
  saveCms({ ...state, adOrders: [order, ...state.adOrders] });
  return order;
}

export function markAdOrder(id: string, status: AdOrder["status"]) {
  const state = loadCms();
  let next = {
    ...state,
    adOrders: state.adOrders.map((item) => (item.id === id ? { ...item, status } : item)),
  };

  const order = next.adOrders.find((item) => item.id === id);
  if (order && status === "live" && order.product === "boost") {
    next = {
      ...next,
      startups: next.startups.map((startup) =>
        startup.name.toLowerCase() === order.companyName.toLowerCase()
          ? { ...startup, isBoosted: true }
          : startup,
      ),
    };
  }

  if (order && status === "live" && order.product === "billboard") {
    const billboard: RoadBillboard = {
      id: `bill-${Date.now()}`,
      junctionName: "Cyber Towers",
      coordinates: [78.3773, 17.4504],
      sponsorName: order.companyName,
      tagline: order.notes || "FEATURED ON HYDTECHPULSE",
      ctaLink: order.checkoutUrl,
      isLive: true,
    };
    next = { ...next, billboards: [billboard, ...next.billboards] };
  }

  return saveCms(next);
}

export function exportCms() {
  return JSON.stringify(loadCms(), null, 2);
}

export function importCms(raw: string) {
  const parsed = JSON.parse(raw) as CmsState;
  return saveCms(parsed);
}

export function resetCms() {
  return saveCms(seedState());
}

export function checkoutFor(product: AdProduct) {
  return CHECKOUT[product];
}
