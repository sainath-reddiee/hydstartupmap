import jobBoardsData from "@/data/jobBoards.json";
import type { JobRole, Startup } from "@/types";
import { loadCms, upsertStartup } from "@/utils/cms";

type FeedJob = {
  title: string;
  department: JobRole["department"];
  type: JobRole["type"];
  workMode?: JobRole["workMode"];
  salaryRange?: string;
  techStack?: string[];
  isFeatured?: boolean;
  description?: string;
};

type BoardConfig = {
  provider: "greenhouse" | "lever" | "ashby" | "careers-feed";
  token?: string;
  careersUrl?: string;
};

const boards = (jobBoardsData as { boards: Record<string, BoardConfig>; feeds: Record<string, FeedJob[]> }).boards;
const feeds = (jobBoardsData as { boards: Record<string, BoardConfig>; feeds: Record<string, FeedJob[]> }).feeds;

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function mapAtsDepartment(raw: string): JobRole["department"] {
  const value = raw.toLowerCase();
  if (value.includes("design")) return "Design";
  if (value.includes("product")) return "Product";
  if (value.includes("data") || value.includes("ml") || value.includes("ai")) return "Data/AI";
  if (value.includes("people") || value.includes("hr")) return "People";
  if (value.includes("sales") || value.includes("account")) return "Sales";
  if (value.includes("growth") || value.includes("marketing")) return "Growth";
  return "Engineering";
}

async function fetchGreenhouse(token: string): Promise<JobRole[]> {
  const response = await fetch(`https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Greenhouse ${response.status}`);
  const payload = await response.json() as {
    jobs: Array<{ id: number; title: string; absolute_url: string; location?: { name?: string }; departments?: Array<{ name?: string }> }>;
  };
  return payload.jobs.map((job) => ({
    id: `gh-${job.id}`,
    title: job.title,
    department: mapAtsDepartment(job.departments?.[0]?.name ?? "Engineering"),
    type: "Full-time" as const,
    workMode: job.location?.name?.toLowerCase().includes("remote") ? "Remote" as const : "Hybrid" as const,
    applyUrl: job.absolute_url,
    isFeatured: false,
    description: job.location?.name,
  }));
}

async function fetchLever(token: string): Promise<JobRole[]> {
  const response = await fetch(`https://api.lever.co/v0/postings/${token}?mode=json`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Lever ${response.status}`);
  const payload = await response.json() as Array<{
    id: string; text: string; hostedUrl: string; categories?: { team?: string; commitment?: string; location?: string };
  }>;
  return payload.map((job) => ({
    id: `lv-${job.id}`,
    title: job.text,
    department: mapAtsDepartment(job.categories?.team ?? "Engineering"),
    type: (job.categories?.commitment?.toLowerCase().includes("intern") ? "Internship" : "Full-time") as JobRole["type"],
    workMode: job.categories?.location?.toLowerCase().includes("remote") ? "Remote" as const : "Hybrid" as const,
    applyUrl: job.hostedUrl,
    isFeatured: false,
  }));
}

async function fetchAshby(token: string): Promise<JobRole[]> {
  const response = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${token}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Ashby ${response.status}`);
  const payload = await response.json() as {
    jobs: Array<{ id: string; title: string; jobUrl: string; department?: string; employmentType?: string; location?: string }>;
  };
  return (payload.jobs ?? []).map((job) => ({
    id: `as-${job.id}`,
    title: job.title,
    department: mapAtsDepartment(job.department ?? "Engineering"),
    type: (job.employmentType?.toLowerCase().includes("intern") ? "Internship" : "Full-time") as JobRole["type"],
    workMode: job.location?.toLowerCase().includes("remote") ? "Remote" as const : "Hybrid" as const,
    applyUrl: job.jobUrl,
    isFeatured: false,
  }));
}

export function jobsFromCareersFeed(companyId: string, careersUrl: string): JobRole[] {
  const feed = feeds[companyId] ?? [];
  return feed.map((job, index) => ({
    id: `${companyId}-${slugify(job.title)}-${index + 1}`,
    title: job.title,
    department: job.department,
    type: job.type,
    workMode: job.workMode,
    salaryRange: job.salaryRange,
    techStack: job.techStack,
    applyUrl: careersUrl,
    isFeatured: job.isFeatured,
    description: job.description,
  }));
}

export async function fetchJobsForCompany(company: Startup): Promise<{ jobs: JobRole[]; source: string }> {
  const config = boards[company.id];
  const careersUrl = config?.careersUrl || company.hiring.careersUrl;

  if (config?.provider === "greenhouse" && config.token) {
    return { jobs: await fetchGreenhouse(config.token), source: "greenhouse" };
  }
  if (config?.provider === "lever" && config.token) {
    return { jobs: await fetchLever(config.token), source: "lever" };
  }
  if (config?.provider === "ashby" && config.token) {
    return { jobs: await fetchAshby(config.token), source: "ashby" };
  }

  return {
    jobs: jobsFromCareersFeed(company.id, careersUrl),
    source: "careers-feed",
  };
}

export function applyJobsToCompany(companyId: string, jobs: JobRole[], source: string) {
  const state = loadCms();
  const company = state.startups.find((item) => item.id === companyId);
  if (!company) throw new Error("Company not found");

  const next: Startup = {
    ...company,
    hiring: {
      ...company.hiring,
      isHiring: jobs.length > 0,
      jobs,
    },
    source: `${company.source ?? "HydTechPulse"} · synced:${source}`,
  };
  return upsertStartup(next);
}

export function listSyncableCompanyIds() {
  return Object.keys(boards);
}
