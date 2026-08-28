export type StartupCategory =
  | "AI & Data"
  | "SaaS & Enterprise"
  | "Fintech"
  | "Healthtech & Bio"
  | "Deeptech & Hardware"
  | "Consumer & D2C"
  | "Edtech"
  | "Space & Aerospace";

export type AreaName =
  | "HITEC City"
  | "Madhapur"
  | "Gachibowli"
  | "Financial District"
  | "Jubilee Hills"
  | "Kondapur"
  | "Banjara Hills"
  | "Raidurg"
  | "Nanakramguda"
  | "Kokapet"
  | "Kukatpally"
  | "Miyapur"
  | "Ameerpet"
  | "Begumpet"
  | "Secunderabad"
  | "Old City"
  | "Uppal"
  | "Pocharam"
  | "Shamshabad"
  | "Kompally";

export type WorkMode = "On-site" | "Hybrid" | "Remote";
export type Mode = "day" | "night";
export type DirectoryTab = "startups" | "jobs" | "events" | "news" | "night";
export type SubmissionStatus = "pending" | "approved" | "rejected";
export type AdProduct = "boost" | "billboard" | "job-spotlight" | "event-beacon";

export interface JobRole {
  id: string;
  title: string;
  department: "Engineering" | "Data/AI" | "Product" | "Design" | "Growth" | "People" | "Sales";
  type: "Full-time" | "Internship" | "Contract";
  workMode?: WorkMode;
  salaryRange?: string;
  techStack?: string[];
  applyUrl: string;
  isFeatured?: boolean;
  description?: string;
}

export interface FundingRound {
  stage: "Pre-Seed" | "Seed" | "Series A" | "Series B+" | "Bootstrapped" | "Public" | "Unicorn";
  amount?: string;
  date?: string;
  leadInvestors?: string[];
  valuation?: string;
}

export interface Founder {
  name: string;
  role: string;
  linkedin?: string;
  previous?: string;
}

export interface Startup {
  id: string;
  name: string;
  tagline: string;
  description: string;
  logoUrl?: string;
  website: string;
  foundedYear: number;
  teamSize: string;
  category: StartupCategory;
  stage: "Bootstrapped" | "Seed" | "Series A" | "Series B+" | "Public" | "Unicorn";
  techStack: string[];
  funding: FundingRound[];
  founders?: Founder[];
  benefits?: string[];
  investors?: string[];
  socials?: {
    linkedin?: string;
    x?: string;
  };
  origin: {
    type: "Ex-BigTech" | "IIIT-H Alumni" | "T-Hub Cohort" | "Independent" | "Local Unicorn";
    anchorCompany?: string;
  };
  location: {
    area: AreaName;
    building: string;
    coordinates: [number, number];
  };
  hiring: {
    isHiring: boolean;
    careersUrl: string;
    jobs: JobRole[];
  };
  vibes: string[];
  isBoosted?: boolean;
  isPublished?: boolean;
  source?: string;
}

export interface TechEvent {
  id: string;
  title: string;
  organizer: string;
  eventType: "Meetup" | "Hackathon" | "Demo Day" | "Conference";
  date: string;
  time: string;
  isFree: boolean;
  price?: string;
  rsvpUrl: string;
  venue: { name: string; area: AreaName; coordinates: [number, number] };
  tags: string[];
  isFeatured?: boolean;
}

export interface ThirdSpace {
  id: string;
  name: string;
  type: "Late-Night Cafe" | "Coworking Day-Pass" | "Street Food Hub" | "24/7 Hack Spot";
  timings: string;
  wifiSpeed?: string;
  openLate: boolean;
  location: { area: AreaName; coordinates: [number, number] };
  tags: string[];
}

export interface LineageConnection {
  id: string;
  sourceName: string;
  sourceCoords: [number, number];
  targetName: string;
  targetCoords: [number, number];
  relation: "Alumni Mafia" | "Investor Portfolio" | "Incubated At";
  color: string;
}

export interface RoadBillboard {
  id: string;
  junctionName: string;
  coordinates: [number, number];
  sponsorName: string;
  tagline: string;
  ctaLink: string;
  isLive: boolean;
  kind?: "virtual" | "physical" | "wall-of-fame";
  status?: "Available" | "Booked" | "Live campaign";
  dailyImpressions?: string;
  weeklyPrice?: string;
  dimensions?: string;
  mediaOwner?: string;
  imageUrl?: string;
  startsAt?: string;
  endsAt?: string;
}

export interface HoardingSighting {
  id: string;
  createdAt: string;
  status: SubmissionStatus;
  brandName: string;
  junctionName: string;
  caption: string;
  submittedBy: string;
  imageDataUrl?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  tags: string[];
  companyId?: string;
  summary: string;
  isFeatured?: boolean;
}

export interface CompanySubmission {
  id: string;
  createdAt: string;
  status: SubmissionStatus;
  companyName: string;
  website: string;
  pitch: string;
  area: AreaName;
  category: StartupCategory;
  contactEmail: string;
  careersUrl?: string;
  notes?: string;
}

export interface AdOrder {
  id: string;
  product: AdProduct;
  companyName: string;
  contactEmail: string;
  amount: string;
  createdAt: string;
  status: "awaiting-payment" | "paid" | "live" | "expired";
  checkoutUrl: string;
  notes?: string;
}

export interface CmsState {
  startups: Startup[];
  events: TechEvent[];
  news: NewsItem[];
  billboards: RoadBillboard[];
  hoardings: HoardingSighting[];
  submissions: CompanySubmission[];
  adOrders: AdOrder[];
  updatedAt: string;
}
