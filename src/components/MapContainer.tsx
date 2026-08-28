"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { FillLayerSpecification, GeoJSONSource, Map as MapLibreMap, Marker, StyleSpecification } from "maplibre-gl";
import { circle, featureCollection, lineString } from "@turf/turf";
import thirdspacesData from "@/data/thirdspaces.json";
import lineageData from "@/data/lineage.json";
import type { LineageConnection, Mode, RoadBillboard, Startup, TechEvent, ThirdSpace } from "@/types";
import { AREA_CENTERS } from "@/utils/distance";

const spaces = thirdspacesData as ThirdSpace[];
const lineage = lineageData as LineageConnection[];

type Props = {
  mode: Mode;
  startups: Startup[];
  events: TechEvent[];
  billboards: RoadBillboard[];
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

export default function MapContainer({
  mode, startups, events, billboards, selectedStartup, selectedEvent, hoveredId, commute, focusedArea,
  onSelectStartup, onSelectEvent, onFocusArea, onSelectBillboard, onSubmitHoarding,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [showAreas, setShowAreas] = useState(true);
  const [showBillboards, setShowBillboards] = useState(true);
  const callbacksRef = useRef({ onSelectStartup, onSelectEvent, onFocusArea, onSelectBillboard });
  const dataRef = useRef({ startups, events, billboards });
  callbacksRef.current = { onSelectStartup, onSelectEvent, onFocusArea, onSelectBillboard };
  dataRef.current = { startups, events, billboards };

  const clearMarkers = () => {
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
  };

  const renderMarkers = (map: MapLibreMap) => {
    clearMarkers();
    const { startups: nextStartups, events: nextEvents, billboards: nextBillboards } = dataRef.current;

    nextStartups.forEach((startup) => {
      const element = document.createElement("button");
      element.className = `map-pin ${startup.isBoosted ? "map-pin--boosted" : ""}`;
      element.dataset.id = startup.id;
      element.setAttribute("aria-label", `Open ${startup.name}`);
      element.innerHTML = `<span>${startup.name.slice(0, 2).toUpperCase()}</span><i></i>`;
      element.addEventListener("click", () => callbacksRef.current.onSelectStartup(startup));
      markersRef.current.push(new maplibregl.Marker({ element, anchor: "bottom" }).setLngLat(startup.location.coordinates).addTo(map));
    });

    nextEvents.forEach((event) => {
      const element = document.createElement("button");
      element.className = `event-beacon ${event.isFeatured ? "event-beacon--featured" : ""}`;
      element.setAttribute("aria-label", event.title);
      element.innerHTML = "<span></span>";
      element.addEventListener("click", () => callbacksRef.current.onSelectEvent(event));
      markersRef.current.push(new maplibregl.Marker({ element, anchor: "center" }).setLngLat(event.venue.coordinates).addTo(map));
    });

    if (showBillboards) nextBillboards.forEach((billboard) => {
      const element = document.createElement("button");
      element.className = "road-billboard";
      element.dataset.kind = billboard.kind ?? "virtual";
      element.innerHTML = `<span>${billboard.sponsorName}</span><small>${billboard.tagline}</small>`;
      element.addEventListener("click", () => callbacksRef.current.onSelectBillboard(billboard));
      markersRef.current.push(new maplibregl.Marker({ element, anchor: "bottom" }).setLngLat(billboard.coordinates).addTo(map));
    });

    if (showAreas) {
      const counts = nextStartups.reduce<Record<string, number>>((result, startup) => {
        result[startup.location.area] = (result[startup.location.area] ?? 0) + 1;
        return result;
      }, {});
      Object.entries(counts).forEach(([area, count]) => {
        const coordinates = AREA_CENTERS[area];
        if (!coordinates) return;
        const element = document.createElement("button");
        element.className = `area-cluster ${focusedArea === area ? "active" : ""}`;
        element.innerHTML = `<b>${count}</b><span>${area}</span>`;
        element.addEventListener("click", () => {
          map.flyTo({ center: coordinates, zoom: 15.6, pitch: 58, bearing: -18, duration: 1500 });
          callbacksRef.current.onFocusArea(area);
        });
        markersRef.current.push(new maplibregl.Marker({ element, anchor: "center" }).setLngLat(coordinates).addTo(map));
      });
    }

    spaces.forEach((space) => {
      const element = document.createElement("div");
      element.className = "night-marker";
      element.dataset.nightMarker = "true";
      element.title = space.name;
      element.textContent = "✦";
      element.style.display = mode === "night" ? "grid" : "none";
      markersRef.current.push(new maplibregl.Marker({ element }).setLngLat(space.location.coordinates).addTo(map));
    });
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    maplibregl.setWorkerUrl("https://cdn.jsdelivr.net/npm/maplibre-gl@6.6.0/dist/maplibre-gl-worker.mjs");
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [78.38, 17.4485],
      zoom: 14.35,
      pitch: 55,
      bearing: -20,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");

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

      map.addSource("area-focus", { type: "geojson", data: featureCollection([]) });
      map.addLayer({
        id: "area-focus-fill", type: "fill", source: "area-focus",
        paint: { "fill-color": "#5eead4", "fill-opacity": 0.12 },
      });
      map.addLayer({
        id: "area-focus-line", type: "line", source: "area-focus",
        paint: { "line-color": "#0f766e", "line-width": 3, "line-opacity": 0.72 },
      });

      renderMarkers(map);
    });

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
  }, [startups, events, billboards, mode, showAreas, showBillboards, focusedArea]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const applyMode = () => {
      containerRef.current?.classList.toggle("map-night", mode === "night");
      document.querySelectorAll<HTMLElement>("[data-night-marker]").forEach((el) => {
        el.style.display = mode === "night" ? "grid" : "none";
      });
      if (map.getLayer("hyd-3d-buildings")) {
        map.setPaintProperty(
          "hyd-3d-buildings",
          "fill-extrusion-color",
          mode === "night"
            ? ["interpolate", ["linear"], ["get", "render_height"], 0, "#12243b", 80, "#164e63", 200, "#8b5cf6"]
            : ["interpolate", ["linear"], ["get", "render_height"], 0, "#b9c7d0", 80, "#8399a7", 200, "#657f8f"],
        );
        map.setPaintProperty("hyd-3d-buildings", "fill-extrusion-opacity", mode === "night" ? 0.9 : 0.72);
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
    map.flyTo({ center: selectedStartup.location.coordinates, zoom: 15.7, pitch: 62, bearing: -28, duration: 1400 });
    const connections = lineage.filter((item) => item.targetName === selectedStartup.name);
    const data = featureCollection(connections.map((item) => lineString(arcCoordinates(item), {
      color: item.color, relation: item.relation, source: item.sourceName,
    })));
    const update = () => (map.getSource("lineage-arcs") as GeoJSONSource | undefined)?.setData(data);
    map.loaded() ? update() : map.once("load", update);
  }, [selectedStartup]);

  useEffect(() => {
    const map = mapRef.current;
    if (map && selectedEvent) map.flyTo({ center: selectedEvent.venue.coordinates, zoom: 16, pitch: 55, duration: 1300 });
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

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const update = () => {
      const source = map.getSource("area-focus") as GeoJSONSource | undefined;
      if (source) {
        source.setData(focusedArea && AREA_CENTERS[focusedArea]
          ? circle(AREA_CENTERS[focusedArea], 1.1, { steps: 64, units: "kilometers" })
          : featureCollection([]));
      }
      if (focusedArea && AREA_CENTERS[focusedArea]) {
        map.flyTo({ center: AREA_CENTERS[focusedArea], zoom: 15.6, pitch: 58, duration: 1400 });
      }
    };
    map.loaded() ? update() : map.once("load", update);
  }, [focusedArea]);

  return (
    <div className="map-shell">
      <div ref={containerRef} className="map-canvas" />
      <div className="map-gradient" />
      <div className="map-status">
        <span className="status-dot" /> HYDERABAD WEST GRID
        <b>{mode === "night" ? "NIGHT PULSE" : "DAY SCAN"}</b>
      </div>
      <div className="map-layer-switcher">
        <button className={showAreas ? "active" : ""} onClick={() => setShowAreas((value) => !value)}>
          <i className="layer-area" /> Area signals
        </button>
        <button className={showBillboards ? "active" : ""} onClick={() => setShowBillboards((value) => !value)}>
          <i className="layer-ooh" /> Roadside OOH
        </button>
        <button onClick={onSubmitHoarding}>+ Spotted a hoarding?</button>
      </div>
      {showBillboards && (
        <div className="map-ooh-tray">
          <div className="map-ooh-heading"><span>PRIME OOH INVENTORY</span><b>{billboards.length} SLOTS</b></div>
          {billboards.slice(0, 4).map((billboard) => (
            <button key={billboard.id} onClick={() => onSelectBillboard(billboard)}>
              <i data-kind={billboard.kind ?? "virtual"} />
              <span><b>{billboard.junctionName}</b><small>{billboard.kind === "physical" ? billboard.dailyImpressions : billboard.weeklyPrice ?? "Digital slot"}</small></span>
              <em>{billboard.status === "Available" ? "BOOK" : "VIEW"}</em>
            </button>
          ))}
        </div>
      )}
      <div className="map-legend">
        <span><i className="legend-startup" /> Startups</span>
        <span><i className="legend-event" /> Events</span>
        <span><i className="legend-lineage" /> Lineage</span>
      </div>
    </div>
  );
}
