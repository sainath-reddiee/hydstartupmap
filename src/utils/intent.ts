import type { Startup } from "@/types";
import { isActivelyHiring } from "@/utils/hiring";

export type RoleIntent = {
  id: string;
  headline: string;
  hint: string;
};

const INTENTS: Array<RoleIntent & { labels: string[]; categories?: string[]; stacks?: string[]; names?: string[] }> = [
  {
    id: "data",
    headline: "Data / analytics fit",
    hint: "Finance ops, HCM platforms, and circularity data teams in Hyd.",
    labels: ["data engineer", "data", "analytics", "sql", "warehouse", "etl", "dbt", "ml", "ai"],
    categories: ["AI & Data", "Fintech", "SaaS & Enterprise"],
    stacks: ["python", "sql", "dbt", "aws"],
    names: ["highradius", "bluecopa", "darwinbox", "recykal"],
  },
  {
    id: "people",
    headline: "HR / people platforms",
    hint: "Hyderabad’s two home-grown HCM companies.",
    labels: ["hr", "payroll", "people", "hcm", "recruiter"],
    names: ["darwinbox", "keka"],
  },
  {
    id: "space",
    headline: "Space & hardware",
    hint: "Infinity Campus and Begumpet satellite engineering.",
    labels: ["space", "rocket", "aerospace", "satellite", "propulsion", "avionics"],
    categories: ["Space & Aerospace"],
    names: ["skyroot", "dhruva"],
  },
  {
    id: "energy",
    headline: "Climate & energy",
    hint: "C&I renewables and circular economy.",
    labels: ["solar", "energy", "climate", "renewable"],
    names: ["fourthpartner", "recykal"],
  },
  {
    id: "edtech",
    headline: "Edtech builders",
    hint: "CCBP, math, and K-12 product teams.",
    labels: ["teacher", "curriculum", "edtech", "math"],
    categories: ["Edtech"],
  },
  {
    id: "frontend",
    headline: "Product / frontend",
    hint: "React and product orgs on the Cyber Corridor.",
    labels: ["frontend", "react", "product designer", "ui"],
    stacks: ["react", "next.js", "figma"],
  },
];

export function detectIntent(query: string): (RoleIntent & { labels: string[]; categories?: string[]; stacks?: string[]; names?: string[] }) | null {
  const q = query.trim().toLowerCase();
  if (q.length < 3) return null;
  return INTENTS.find((intent) => intent.labels.some((label) => q.includes(label))) ?? null;
}

export function matchRoleIntent(query: string, startups: Startup[]) {
  const intent = detectIntent(query);
  if (!intent) return { intent: null, matches: [] as Startup[] };

  const scored = startups.map((startup) => {
    let score = 0;
    if (intent.names?.includes(startup.id)) score += 5;
    if (intent.categories?.includes(startup.category)) score += 3;
    const stack = startup.techStack.join(" ").toLowerCase();
    if (intent.stacks?.some((item) => stack.includes(item))) score += 2;
    if (isActivelyHiring(startup)) score += 2;
    if (startup.isBoosted) score += 3;
    return { startup, score };
  }).filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || Number(Boolean(b.startup.isBoosted)) - Number(Boolean(a.startup.isBoosted)));

  return { intent, matches: scored.slice(0, 6).map((item) => item.startup) };
}
