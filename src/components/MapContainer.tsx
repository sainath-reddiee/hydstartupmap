"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { FillLayerSpecification, GeoJSONSource, Map as MapLibreMap, Marker, StyleSpecification } from "maplibre-gl";
import { circle, featureCollection, lineString } from "@turf/turf";
import { Search } from "lucide-react";
import thirdspacesData from "@/data/thirdspaces.json";
import lineageData from "@/data/lineage.json";
import landmarksData from "@/data/landmarks.json";
import type { CityLandmark, CorridorPulse, LineageConnection, Mode, NewsItem, RoadBillboard, Startup, TechEvent, ThirdSpace } from "@/types";
import { AREA_CENTERS, buildAreaInsights } from "@/utils/distance";
import { AREA_COUNT_ZOOM, fanLngLat, groupByBuilding, groupForStartup, shortBuilding } from "@/utils/clusters";
import { resolveCorridorSlots } from "@/utils/corridors";
import CorridorDock from "./CorridorDock";
import NewsPeek from "./NewsPeek";

const spaces = thirdspacesData as ThirdSpace[];
const lineage = lineageData as LineageConnection[];
const landmarks = landmarksData as unknown as CityLandmark[];

const DEFAULT_CENTER: [number, number] = [78.43, 17.405];
const DEFAULT_VIEW = { center: DEFAULT_CENTER, zoom: 11.2, pitch: 28, bearing: -10 } as const;
const QUICK_AREAS = [
  "HITEC City", "Madhapur", "Gachibowli", "Financial District",
  "Kondapur", "Jubilee Hills", "Banjara Hills", "Secunderabad", "Old City", "Uppal", "Shamshabad",
];

type Props = {
  mode: Mode;
  startups: Startup[];
  events: TechEvent[];
  billboards: RoadBillboard[];
  news: NewsItem[];
  selectedStartup: Startup | null;
  selectedEvent: TechEvent | null;
  hoveredId: string | null;
  commute: { area: string; radius: number } | null;
  focusedArea: string | null;
  onSelectStartup: (startup: Startup) => void;
  onSelectEvent: (event: TechEvent) => void;
  onFocusArea: (area: string | null) => void;
  onSelectBillboard: (billboard: RoadBillboard) => void;
  onSubmitHoarding: () => void;
  onClaimCorridor: (slot: CorridorPulse) => void;
  railsCollapsed?: boolean;
  onOpenDirectory?: () => void;
  intentMatches?: Startup[];
};

function arcCoordinates(connection: LineageConnection) {
  const [aLng, aLat] = connection.sourceCoords;
  const [bLng, bLat] = connection.targetCoords;
  const bend = Math.max(Math.abs(bLng - aLng), Math.abs(bLat - aLat)) * 0.38;
  return Array.from({ length: 42 }, (_, i) => {
    const t = i / 41;
    const lng = aLng + (bLng - aLng) * t;
    const lat = aLat + (bLat - aLat) * t + Math.sin(Math.PI * t) * bend;
    return [lng, lat];
  });
}

function addStartupPin(
  map: MapLibreMap,
  markers: Marker[],
  startup: Startup,
  coords: [number, number],
  intentIds: Set<string>,
  onSelect: (startup: Startup) => void,
) {
  const element = document.createElement("button");
  const jobs = startup.hiring.jobs.length;
  const hiring = jobs ? `${jobs} roles` : startup.hiring.careersUrl ? "Hiring" : startup.location.area;
  element.className = [
    "map-pin",
    jobs ? "has-jobs" : "",
    startup.isBoosted ? "is-pulse" : "",
    intentIds.has(startup.id) ? "is-match" : "",
  ].filter(Boolean).join(" ");
  element.dataset.id = startup.id;
  element.setAttribute("aria-label", `Open ${startup.name}`);
  element.innerHTML = `<span>${startup.name.slice(0, 2).toUpperCase()}</span>${jobs ? `<em>${jobs}</em>` : ""}<i></i><div class="pin-tip"><b>${startup.name}</b><small>${startup.location.area} · ${hiring}</small></div>`;
  element.addEventListener("click", (event) => {
    event.stopPropagation();
    onSelect(startup);
  });
  markers.push(new maplibregl.Marker({ element, anchor: "bottom" }).setLngLat(coords).addTo(map));
}

export default function MapContainer({
  mode, startups, events, billboards, news, selectedStartup, selectedEvent, hoveredId, commute, focusedArea,
  onSelectStartup, onSelectEvent, onFocusArea, onSelectBillboard, onSubmitHoarding, onClaimCorridor,
  railsCollapsed, onOpenDirectory, intentMatches = [],
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const zoomRef = useRef<number>(DEFAULT_VIEW.zoom);
  const [showBillboards, setShowBillboards] = useState(true);
  const [newsOpen, setNewsOpen] = useState(false);
  const [dockOpen, setDockOpen] = useState(true);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [expandedStack, setExpandedStack] = useState<string | null>(null);
  const corridorSlots = useMemo(() => resolveCorridorSlots(billboards), [billboards]);
  const [areaJump, setAreaJump] = useState("");
  const [areaMenuOpen, setAreaMenuOpen] = useState(false);
  const intentIds = useMemo(() => new Set(intentMatches.map((item) => item.id)), [intentMatches]);
  const insights = useMemo(() => buildAreaInsights(startups), [startups]);
  const callbacksRef = useRef({ onSelectStartup, onSelectEvent, onFocusArea, onSelectBillboard, setExpandedStack });
  const dataRef = useRef({
    startups, events, billboards, focusedArea, showBillboards, mode, corridorSlots, showLandmarks, expandedStack, intentIds, insights,
  });
  callbacksRef.current = { onSelectStartup, onSelectEvent, onFocusArea, onSelectBillboard, setExpandedStack };
  dataRef.current = {
    startups, events, billboards, focusedArea, showBillboards, mode, corridorSlots, showLandmarks, expandedStack, intentIds, insights,
  };

  const areaMatches = useMemo(() => {
    const q = areaJump.trim().toLowerCase();
    const names = Object.keys(AREA_CENTERS);
    if (!q) return QUICK_AREAS.filter((name) => names.includes(name));
    return names.filter((name) => name.toLowerCase().includes(q)).slice(0, 8);
  }, [areaJump]);

  const clearMarkers = () => {
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
  };

  const renderMarkers = (map: MapLibreMap) => {
    clearMarkers();
    const {
      startups: nextStartups,
      events: nextEvents,
      billboards: nextBillboards,
      showBillboards: boardsOn,
      mode: currentMode,
      corridorSlots: nextCorridors,
      showLandmarks: landmarksOn,
      expandedStack: openStack,
      intentIds: matches,
      insights: areaCounts,
    } = dataRef.current;
    const zoom = map.getZoom();
    const cityView = zoom < AREA_COUNT_ZOOM;

    if (cityView) {
      areaCounts
        .filter((item) => item.count > 0 && AREA_CENTERS[item.name])
        .forEach((item) => {
          const element = document.createElement("button");
          const size = 40 + Math.min(item.count, 10) * 3;
          element.className = "area-count";
          element.style.setProperty("--size", `${size}px`);
          element.setAttribute("aria-label", `${item.count} companies in ${item.name}. Zoom in`);
          element.innerHTML = `<b>${item.count}</b><small>${item.name}</small>`;
          element.addEventListener("click", (event) => {
            event.stopPropagation();
            flyToArea(item.name);
          });
          markersRef.current.push(
            new maplibregl.Marker({ element, anchor: "center" }).setLngLat(AREA_CENTERS[item.name]).addTo(map),
          );
        });
      return;
    }

    const groups = groupByBuilding(nextStartups);
    groups.forEach((group) => {
      const stacked = group.startups.length > 1;
      if (!stacked || openStack === group.key) {
        group.startups.forEach((startup, index) => {
          const coords = stacked ? fanLngLat(group.coordinates, index, group.startups.length) : group.coordinates;
          addStartupPin(map, markersRef.current, startup, coords, matches, (next) => {
            callbacksRef.current.onSelectStartup(next);
          });
        });
        return;
      }

      const element = document.createElement("button");
      element.className = "building-stack";
      element.setAttribute("aria-label", `${group.startups.length} companies at ${group.building}. Expand`);
      element.innerHTML = `<b>${group.startups.length}</b><small>${shortBuilding(group.building)}</small>`;
      element.addEventListener("click", (event) => {
        event.stopPropagation();
        const expand = () => callbacksRef.current.setExpandedStack(group.key);
        if (map.getZoom() < 15.2) {
          map.flyTo({ center: group.coordinates, zoom: 16.4, pitch: 56, bearing: -18, duration: 900 });
          map.once("moveend", expand);
        } else {
          expand();
        }
      });
      markersRef.current.push(new maplibregl.Marker({ element, anchor: "bottom" }).setLngLat(group.coordinates).addTo(map));
    });

    nextEvents.forEach((event) => {
      const element = document.createElement("button");
      element.className = `event-beacon ${event.isFeatured ? "event-beacon--featured" : ""}`;
      element.setAttribute("aria-label", event.title);
      element.innerHTML = "<span></span>";
      element.addEventListener("click", (clickEvent) => {
        clickEvent.stopPropagation();
        callbacksRef.current.onSelectEvent(event);
      });
      markersRef.current.push(new maplibregl.Marker({ element, anchor: "center" }).setLngLat(event.venue.coordinates).addTo(map));
    });

    if (boardsOn) {
      nextCorridors.forEach((slot) => {
        if (!slot.campaign) return;
        const element = document.createElement("button");
        element.className = "corridor-beacon";
        element.innerHTML = `<small>PULSE</small><strong>${slot.campaign.sponsorName}</strong><span>${slot.label}</span>`;
        element.addEventListener("click", (clickEvent) => {
          clickEvent.stopPropagation();
          if (slot.campaign) callbacksRef.current.onSelectBillboard(slot.campaign);
        });
        markersRef.current.push(new maplibregl.Marker({ element, anchor: "bottom" }).setLngLat(slot.coordinates).addTo(map));
      });

      nextBillboards.filter((item) => !item.corridorId).forEach((billboard) => {
        const element = document.createElement("button");
        const personal = billboard.mediaOwner === "Personal";
        element.className = `road-billboard board-card ${personal ? "is-personal" : ""}`;
        element.dataset.kind = billboard.kind ?? "virtual";
        element.innerHTML = `
          <div class="board-chip">${personal ? "YOURS" : (billboard.kind === "physical" ? "OOH" : billboard.kind === "wall-of-fame" ? "SPOTTED" : "AD")}</div>
          <div class="board-face">
            <strong>${billboard.sponsorName}</strong>
            <small>${billboard.junctionName}</small>
            <span>${billboard.weeklyPrice ?? "Map slot"}</span>
          </div>
          <i class="board-pole"></i>
          <i class="board-base"></i>
        `;
        element.addEventListener("click", (clickEvent) => {
          clickEvent.stopPropagation();
          callbacksRef.current.onSelectBillboard(billboard);
        });
        markersRef.current.push(
          new maplibregl.Marker({ element, anchor: "bottom" })
            .setLngLat(billboard.coordinates)
            .addTo(map),
        );
      });
    }

    if (landmarksOn) {
      landmarks.forEach((landmark) => {
        const element = document.createElement("div");
        element.className = `landmark-label kind-${landmark.kind}`;
        element.innerHTML = `<i></i><span>${landmark.name}</span>`;
        element.title = landmark.building;
        markersRef.current.push(new maplibregl.Marker({ element, anchor: "left" }).setLngLat(landmark.coordinates).addTo(map));
      });
    }

    if (currentMode === "night") {
      spaces.forEach((space) => {
        const element = document.createElement("div");
        element.className = "night-marker";
        element.title = space.name;
        element.textContent = "✦";
        element.style.display = "grid";
        markersRef.current.push(new maplibregl.Marker({ element }).setLngLat(space.location.coordinates).addTo(map));
      });
    }
  };

  const flyToArea = (name: string) => {
    const coords = AREA_CENTERS[name];
    const map = mapRef.current;
    if (!coords || !map) return;
    setExpandedStack(null);
    map.flyTo({ center: coords, zoom: 14.6, pitch: 50, bearing: -14, duration: 1200 });
    callbacksRef.current.onFocusArea(name);
    setAreaJump("");
    setAreaMenuOpen(false);
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    maplibregl.setWorkerUrl("https://cdn.jsdelivr.net/npm/maplibre-gl@6.6.0/dist/maplibre-gl-worker.mjs");
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: DEFAULT_VIEW.center,
      zoom: DEFAULT_VIEW.zoom,
      pitch: DEFAULT_VIEW.pitch,
      bearing: DEFAULT_VIEW.bearing,
      minZoom: 2,
      maxZoom: 18,
      pixelRatio: Math.max(window.devicePixelRatio || 1, 2),
      canvasContextAttributes: { antialias: true, powerPreference: "high-performance" },
      fadeDuration: 80,
      renderWorldCopies: false,
      cooperativeGestures: false,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 100 }), "bottom-left");

    map.on("load", () => {
      const layers = map.getStyle().layers as StyleSpecification["layers"];
      const labelLayer = layers.find((layer) => layer.type === "symbol" && layer.layout?.["text-field"]);
      const buildingLayer = layers.find((layer) => layer.type === "fill" && "source-layer" in layer && layer["source-layer"] === "building") as FillLayerSpecification | undefined;
      if (buildingLayer && !map.getLayer("hyd-3d-buildings")) {
        map.addLayer({
          id: "hyd-3d-buildings",
          source: buildingLayer.source,
          "source-layer": "building",
          type: "fill-extrusion",
          minzoom: 13,
          paint: {
            "fill-extrusion-color": ["interpolate", ["linear"], ["get", "render_height"], 0, "#b9c7d0", 80, "#8399a7", 200, "#657f8f"],
            "fill-extrusion-height": ["coalesce", ["get", "render_height"], ["get", "height"], 8],
            "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
            "fill-extrusion-opacity": 0.72,
            "fill-extrusion-vertical-gradient": true,
          },
        }, labelLayer?.id);
      }

      map.addSource("lineage-arcs", { type: "geojson", data: featureCollection([]) });
      map.addLayer({
        id: "lineage-glow", type: "line", source: "lineage-arcs",
        paint: { "line-color": ["get", "color"], "line-width": 8, "line-opacity": 0.16, "line-blur": 5 },
      });
      map.addLayer({
        id: "lineage-lines", type: "line", source: "lineage-arcs",
        paint: { "line-color": ["get", "color"], "line-width": 2.5, "line-opacity": 0.95, "line-dasharray": [2, 2] },
      });

      map.addSource("commute-radius", { type: "geojson", data: featureCollection([]) });
      map.addLayer({
        id: "commute-fill", type: "fill", source: "commute-radius",
        paint: { "fill-color": "#0f766e", "fill-opacity": 0.08 },
      });
      map.addLayer({
        id: "commute-line", type: "line", source: "commute-radius",
        paint: { "line-color": "#0f766e", "line-width": 2, "line-dasharray": [3, 2], "line-opacity": 0.8 },
      });

      renderMarkers(map);
    });

    const onZoomEnd = () => {
      const next = map.getZoom();
      const wasCity = zoomRef.current < AREA_COUNT_ZOOM;
      const isCity = next < AREA_COUNT_ZOOM;
      zoomRef.current = next;
      if (wasCity === isCity) return;
      if (isCity) setExpandedStack(null);
      renderMarkers(map);
    };
    const onMapClick = () => {
      if (dataRef.current.expandedStack) setExpandedStack(null);
    };
    map.on("zoomend", onZoomEnd);
    map.on("click", onMapClick);

    const dashFrames = [[0, 4, 3], [1, 4, 2], [2, 4, 1], [3, 4, 0]];
    let frame = 0;
    const dashTimer = window.setInterval(() => {
      if (map.loaded() && map.getLayer("lineage-lines")) {
        map.setPaintProperty("lineage-lines", "line-dasharray", dashFrames[frame % dashFrames.length]);
        frame += 1;
      }
    }, 220);

    return () => {
      window.clearInterval(dashTimer);
      map.off("zoomend", onZoomEnd);
      map.off("click", onMapClick);
      clearMarkers();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const update = () => renderMarkers(map);
    map.loaded() ? update() : map.once("load", update);
  }, [startups, events, billboards, mode, showBillboards, corridorSlots, showLandmarks, expandedStack, intentIds]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const applyMode = () => {
      containerRef.current?.classList.toggle("map-night", mode === "night");
      if (map.getLayer("hyd-3d-buildings")) {
        map.setPaintProperty(
          "hyd-3d-buildings",
          "fill-extrusion-color",
          mode === "night"
            ? ["interpolate", ["linear"], ["get", "render_height"], 0, "#4b5d75", 80, "#3d5168", 200, "#6d5b9a"]
            : ["interpolate", ["linear"], ["get", "render_height"], 0, "#b9c7d0", 80, "#8399a7", 200, "#657f8f"],
        );
      }
    };
    map.loaded() ? applyMode() : map.once("load", applyMode);
  }, [mode]);

  useEffect(() => {
    document.querySelectorAll(".map-pin").forEach((element) => {
      element.classList.toggle("is-hovered", (element as HTMLElement).dataset.id === hoveredId);
    });
  }, [hoveredId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedStartup) return;
    const groups = groupByBuilding(dataRef.current.startups);
    const group = groupForStartup(selectedStartup, groups);
    if (group && group.startups.length > 1) setExpandedStack(group.key);
    const index = group ? group.startups.findIndex((item) => item.id === selectedStartup.id) : 0;
    const center = group && group.startups.length > 1
      ? fanLngLat(group.coordinates, Math.max(index, 0), group.startups.length)
      : selectedStartup.location.coordinates;
    map.flyTo({ center, zoom: 15.4, pitch: 55, bearing: -22, duration: 1300 });
    const connections = lineage.filter((item) => item.targetName === selectedStartup.name);
    const data = featureCollection(connections.map((item) => lineString(arcCoordinates(item), {
      color: item.color, relation: item.relation, source: item.sourceName,
    })));
    const update = () => (map.getSource("lineage-arcs") as GeoJSONSource | undefined)?.setData(data);
    map.loaded() ? update() : map.once("load", update);
  }, [selectedStartup]);

  useEffect(() => {
    const map = mapRef.current;
    if (map && selectedEvent) map.flyTo({ center: selectedEvent.venue.coordinates, zoom: 15.6, pitch: 50, duration: 1200 });
  }, [selectedEvent]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const update = () => {
      const source = map.getSource("commute-radius") as GeoJSONSource | undefined;
      if (!source) return;
      source.setData(commute ? circle(AREA_CENTERS[commute.area], commute.radius, { steps: 72, units: "kilometers" }) : featureCollection([]));
    };
    map.loaded() ? update() : map.once("load", update);
  }, [commute]);

  return (
    <div className="map-shell">
      <div ref={containerRef} className="map-canvas" />
      <div className="map-gradient" />

      <div className="map-area-jump">
        <Search size={14} />
        <input
          value={areaJump}
          onChange={(e) => {
            setAreaJump(e.target.value);
            setAreaMenuOpen(true);
          }}
          onFocus={() => setAreaMenuOpen(true)}
          onBlur={() => window.setTimeout(() => setAreaMenuOpen(false), 160)}
          placeholder="Search Hyderabad area..."
          aria-label="Search Hyderabad area"
        />
        {areaMenuOpen && (
          <div className="map-area-jump-list">
            {!areaJump.trim() && <div className="map-area-jump-label">Popular corridors</div>}
            {areaMatches.map((name) => {
              const insight = insights.find((item) => item.name === name);
              return (
                <button
                  key={name}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    flyToArea(name);
                  }}
                >
                  <strong>{name}</strong>
                  <span>{insight ? `${insight.count} cos · ${insight.openJobs} jobs` : "Jump"}</span>
                </button>
              );
            })}
            {areaMatches.length === 0 && <div className="map-area-jump-empty">No Hyderabad area match</div>}
          </div>
        )}
      </div>

      <div className="map-layer-switcher">
        <button className={showBillboards ? "active" : ""} onClick={() => setShowBillboards((value) => !value)}>
          <i className="layer-ooh" /> Pulse
        </button>
        <button className={showLandmarks ? "active" : ""} onClick={() => setShowLandmarks((value) => !value)}>
          Buildings
        </button>
        <button onClick={onSubmitHoarding}>+ Spotted</button>
        <button onClick={() => {
          setExpandedStack(null);
          onFocusArea(null);
          mapRef.current?.flyTo({ ...DEFAULT_VIEW, duration: 1100 });
        }}>Reset</button>
      </div>

      <NewsPeek news={news} open={newsOpen} onToggle={() => setNewsOpen((value) => !value)} />

      <div className="map-legend">
        <span><i className="legend-count" /> Area counts · tap to zoom</span>
        <span><i className="legend-startup" /> Startups</span>
        <span><i className="legend-stack" /> Shared building</span>
        <span><i className="legend-jobs" /> Open roles</span>
        <span><i className="legend-ooh" /> Corridor pulse</span>
        <span><i className="legend-landmark" /> Buildings</span>
        {intentMatches.length > 0 && <span><i className="legend-intent" /> Role match</span>}
      </div>
      {railsCollapsed && onOpenDirectory && (
        <button type="button" className="map-reopen-rail" onClick={onOpenDirectory}>
          Show directory
        </button>
      )}
      <CorridorDock
        slots={corridorSlots}
        collapsed={!dockOpen}
        onToggle={() => setDockOpen((value) => !value)}
        onClaim={(slot) => {
          flyToArea(slot.name);
          onClaimCorridor(slot);
        }}
        onOpenLive={(slot) => {
          flyToArea(slot.name);
          if (slot.campaign) onSelectBillboard(slot.campaign);
        }}
      />
    </div>
  );
}
