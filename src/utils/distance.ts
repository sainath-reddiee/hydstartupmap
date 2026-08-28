import { distance, point } from "@turf/turf";
import type { Startup } from "@/types";

export const AREA_CENTERS: Record<string, [number, number]> = {
  "HITEC City": [78.3772, 17.4483],
  Madhapur: [78.3915, 17.4401],
  Gachibowli: [78.3489, 17.4401],
  "Financial District": [78.3428, 17.4166],
  "Jubilee Hills": [78.4071, 17.4304],
  Kondapur: [78.3634, 17.4698],
  "Banjara Hills": [78.4382, 17.4152],
  Raidurg: [78.3748, 17.442],
  Nanakramguda: [78.3445, 17.4188],
  Kokapet: [78.3345, 17.3965],
  Kukatpally: [78.3985, 17.4948],
  Miyapur: [78.3578, 17.4969],
  Ameerpet: [78.4483, 17.4375],
  Begumpet: [78.4632, 17.4435],
  Secunderabad: [78.4983, 17.4399],
  "Old City": [78.4747, 17.3616],
  Uppal: [78.5584, 17.3984],
  Pocharam: [78.6128, 17.4582],
  Shamshabad: [78.4298, 17.2403],
  Kompally: [78.4795, 17.5462],
};

export function distanceKm(from: [number, number], to: [number, number]) {
  return distance(point(from), point(to), { units: "kilometers" });
}

export function nearestMetroLabel(coords: [number, number]) {
  const metros = [
    { name: "Raidurg Metro", coords: [78.3748, 17.442] as [number, number] },
    { name: "Durgam Cheruvu Metro", coords: [78.3873, 17.4375] as [number, number] },
    { name: "HITEC City Metro", coords: [78.3847, 17.448] as [number, number] },
    { name: "Ameerpet Metro", coords: [78.4483, 17.4375] as [number, number] },
    { name: "Secunderabad East Metro", coords: [78.5088, 17.4344] as [number, number] },
    { name: "MG Bus Station Metro", coords: [78.4806, 17.3850] as [number, number] },
    { name: "Uppal Metro", coords: [78.5584, 17.3984] as [number, number] },
    { name: "Miyapur Metro", coords: [78.3578, 17.4969] as [number, number] },
    { name: "Kukatpally Metro", coords: [78.3985, 17.4948] as [number, number] },
    { name: "Begumpet Metro", coords: [78.4632, 17.4435] as [number, number] },
  ];
  const nearest = metros
    .map((metro) => ({ ...metro, km: distanceKm(coords, metro.coords) }))
    .sort((a, b) => a.km - b.km)[0];
  return `${nearest.name} · ${nearest.km.toFixed(1)} km`;
}

export function relativeTime(date: string) {
  const diff = Date.now() - new Date(`${date}T12:00:00`).getTime();
  const days = Math.max(0, Math.round(diff / 86400000));
  if (days === 0) return "today";
  if (days === 1) return "1d";
  if (days < 30) return `${days}d`;
  return `${Math.round(days / 30)}mo`;
}

export type AreaInsight = {
  name: string;
  count: number;
  openJobs: number;
  topCategory: string;
  heat: "hot" | "warm" | "calm";
  signal: string;
};

/** Unique area pulse: density + hiring heat + dominant category. */
export function buildAreaInsights(startups: Startup[]): AreaInsight[] {
  const buckets = new Map<string, Startup[]>();
  startups.forEach((startup) => {
    const list = buckets.get(startup.location.area) ?? [];
    list.push(startup);
    buckets.set(startup.location.area, list);
  });

  return Array.from(buckets.entries())
    .map(([name, items]) => {
      const openJobs = items.reduce((sum, item) => sum + item.hiring.jobs.length, 0);
      const categoryVotes = items.reduce<Record<string, number>>((votes, item) => {
        votes[item.category] = (votes[item.category] ?? 0) + 1;
        return votes;
      }, {});
      const topCategory = Object.entries(categoryVotes).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Mixed";
      const heat: AreaInsight["heat"] = openJobs >= 6 || items.length >= 4 ? "hot" : openJobs >= 2 ? "warm" : "calm";
      const signal = heat === "hot"
        ? `${openJobs} open roles · dense`
        : heat === "warm"
          ? `${topCategory.split(" ")[0]} pulse`
          : "Quiet corridor";
      return { name, count: items.length, openJobs, topCategory, heat, signal };
    })
    .sort((a, b) => b.openJobs - a.openJobs || b.count - a.count);
}

export function nearestAreaName(coords: [number, number]) {
  return Object.entries(AREA_CENTERS)
    .map(([name, center]) => ({ name, km: distanceKm(coords, center) }))
    .sort((a, b) => a.km - b.km)[0]?.name ?? "HITEC City";
}
