import type { Startup } from "@/types";

/** Below this zoom the map shows area counts; at or above it, company pins. */
export const AREA_COUNT_ZOOM = 13.15;

export type BuildingGroup = {
  key: string;
  building: string;
  area: string;
  coordinates: [number, number];
  startups: Startup[];
};

export function geoKey(coords: [number, number]) {
  return `${coords[0].toFixed(4)}|${coords[1].toFixed(4)}`;
}

function canMergeBuildingName(name: string) {
  const n = name.trim().toLowerCase();
  if (n.length < 16) return false;
  if (n.includes("not published")) return false;
  if (n.includes("operations")) return false;
  if (n.includes("clinic network")) return false;
  return true;
}

/**
 * Companies that share a pin or the same building become one stack.
 * Same ~11 m grid (4 decimal degrees) always merge; identical building
 * names merge even when floors were geocoded a few metres apart.
 */
export function groupByBuilding(startups: Startup[]): BuildingGroup[] {
  const byGeo = new Map<string, BuildingGroup>();
  startups.forEach((startup) => {
    const key = geoKey(startup.location.coordinates);
    const existing = byGeo.get(key);
    if (existing) {
      existing.startups.push(startup);
      return;
    }
    byGeo.set(key, {
      key,
      building: startup.location.building,
      area: startup.location.area,
      coordinates: startup.location.coordinates,
      startups: [startup],
    });
  });

  const merged = new Map<string, BuildingGroup>();
  for (const group of byGeo.values()) {
    const name = group.building.trim().toLowerCase();
    const mergeKey = canMergeBuildingName(name) ? `b:${name}` : `g:${group.key}`;
    const existing = merged.get(mergeKey);
    if (existing) {
      existing.startups.push(...group.startups);
      continue;
    }
    merged.set(mergeKey, { ...group, key: mergeKey, startups: [...group.startups] });
  }
  return Array.from(merged.values());
}

export function groupForStartup(startup: Startup, groups: BuildingGroup[]) {
  return groups.find((group) => group.startups.some((item) => item.id === startup.id)) ?? null;
}

export function shortBuilding(name: string) {
  const first = name
    .split(",")[0]
    .replace(/^\d+(st|nd|rd|th)?\s*(?:&\s*\d+(st|nd|rd|th)?\s*)?(?:\/\s*\d+(st|nd|rd|th)?\s*)?(Floor|floor),?\s*/i, "")
    .trim();
  return first.length > 26 ? `${first.slice(0, 24)}…` : first;
}

/** Spread stacked companies around the building so every pin is tappable. */
export function fanLngLat(center: [number, number], index: number, total: number): [number, number] {
  if (total <= 1) return center;
  const angle = ((Math.PI * 2) * index) / total - Math.PI / 2;
  const meters = 28 + Math.min(total, 8) * 6;
  const dLat = (meters / 111_320) * Math.cos(angle);
  const dLng = (meters / (111_320 * Math.cos((center[1] * Math.PI) / 180))) * Math.sin(angle);
  return [center[0] + dLng, center[1] + dLat];
}
