# HydTechPulse 3D

Hyderabad’s hyper-local startup map — companies, jobs, news, events, night spots, 3D lineage arcs, and paid placements.

## Stack

- Next.js App Router + TypeScript + Tailwind CSS
- MapLibre GL JS + OpenFreeMap (3D buildings)
- Turf.js commute radar
- LocalStorage CMS admin portal (no Supabase)
- Dodo Payments checkout links

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Admin portal: [http://localhost:3000/admin](http://localhost:3000/admin)

Default admin PIN: `hydpulse2026` (override with `NEXT_PUBLIC_ADMIN_PIN`)

## Admin model (no Supabase)

- Public users submit company listings → stored as **pending** in localStorage
- Owner logs into `/admin`, approves/edits/rejects
- Paid boosts, billboards, job spotlights and event beacons create ad orders
- Owner marks payments live after Dodo checkout
- Export JSON from admin to back up or commit into `src/data`

This keeps infrastructure at $0. Persistence is browser-local unless you export/import JSON.

## Scripts

- `npm run dev` — local development
- `npm run build` — production build
- `npm run lint` — TypeScript check
