export type StartupCategory = "AI & Data" | "SaaS & Enterprise" | "Fintech" | "Healthtech & Bio" | "Deeptech & Hardware" | "Consumer & D2C";
export type AreaName = "HITEC City" | "Madhapur" | "Gachibowli" | "Financial District" | "Jubilee Hills" | "Kondapur" | "Banjara Hills";

export interface JobRole {
  id: string;
  title: string;
  department: "Engineering" | "Data/AI" | "Product" | "Design" | "Growth";
  type: "Full-time" | "Internship" | "Contract";
  salaryRange?: string;
  techStack?: string[];
  applyUrl: string;
  isFeatured?: boolean;
}

export interface FundingRound {
  stage: "Pre-Seed" | "Seed" | "Series A" | "Series B+" | "Bootstrapped";
  amount?: string;
  date?: string;
  leadInvestors?: string[];
}

export interface Startup {
  id: string; name: string; tagline: string; description: string; logoUrl?: string;
  website: string; foundedYear: number; teamSize: string; category: StartupCategory;
  stage: "Bootstrapped" | "Seed" | "Series A" | "Series B+" | "Public";
  techStack: string[]; funding: FundingRound[];
  origin: { type: "Ex-BigTech" | "IIIT-H Alumni" | "T-Hub Cohort" | "Independent"; anchorCompany?: string };
  location: { area: AreaName; building: string; coordinates: [number, number] };
  hiring: { isHiring: boolean; careersUrl: string; jobs: JobRole[] };
  vibes: string[]; isBoosted?: boolean;
}

export interface TechEvent {
  id: string; title: string; organizer: string;
  eventType: "Meetup" | "Hackathon" | "Demo Day" | "Conference";
  date: string; time: string; isFree: boolean; price?: string; rsvpUrl: string;
  venue: { name: string; area: AreaName; coordinates: [number, number] };
  tags: string[]; isFeatured?: boolean;
}

export interface ThirdSpace {
  id: string; name: string;
  type: "Late-Night Cafe" | "Coworking Day-Pass" | "Street Food Hub" | "24/7 Hack Spot";
  timings: string; wifiSpeed?: string; openLate: boolean;
  location: { area: AreaName; coordinates: [number, number] };
  tags: string[];
}

export interface LineageConnection {
  id: string; sourceName: string; sourceCoords: [number, number];
  targetName: string; targetCoords: [number, number];
  relation: "Alumni Mafia" | "Investor Portfolio" | "Incubated At"; color: string;
}

export interface RoadBillboard {
  id: string; junctionName: string; coordinates: [number, number];
  sponsorName: string; tagline: string; ctaLink: string; isLive: boolean;
}

export type Mode = "day" | "night";
export type DirectoryTab = "startups" | "jobs" | "events" | "night";
