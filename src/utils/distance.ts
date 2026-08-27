import { distance, point } from "@turf/turf";

export const AREA_CENTERS: Record<string, [number, number]> = {
  "HITEC City": [78.3772, 17.4483],
  Madhapur: [78.3915, 17.4401],
  Gachibowli: [78.3489, 17.4401],
  "Financial District": [78.3428, 17.4166],
  "Jubilee Hills": [78.4071, 17.4304],
  Kondapur: [78.3634, 17.4698],
  "Banjara Hills": [78.4382, 17.4152],
};

export function distanceKm(from: [number, number], to: [number, number]) {
  return distance(point(from), point(to), { units: "kilometers" });
}

export function nearestMetroLabel(coords: [number, number]) {
  const metros = [
    { name: "Raidurg Metro", coords: [78.3748, 17.442] as [number, number] },
    { name: "Durgam Cheruvu Metro", coords: [78.3873, 17.4375] as [number, number] },
    { name: "HITEC City Metro", coords: [78.3847, 17.448] as [number, number] },
  ];
  const nearest = metros
    .map((metro) => ({ ...metro, km: distanceKm(coords, metro.coords) }))
    .sort((a, b) => a.km - b.km)[0];
  return `${nearest.name} · ${nearest.km.toFixed(1)} km`;
}
