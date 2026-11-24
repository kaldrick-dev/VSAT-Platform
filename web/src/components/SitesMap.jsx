import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { Icon } from "./ui.jsx";

export const KIGALI_CENTER = [30.0725, -1.9606];

// OpenFreeMap "Bright": keyless vector basemap with 3D buildings once you zoom in and tilt.
export const MAP_STYLE = "https://tiles.openfreemap.org/styles/bright";
const HOME = { center: KIGALI_CENTER, zoom: 11.6, pitch: 50, bearing: -12 };

/* Hexagon markers — one visual language per status:
   available  solid outline + stall glyph
   allocated  dashed blue outline + check
   inactive   dashed, hatched, muted
   selected   filled, with a pulse                                              */
const HEX = "22,2 41,13 41,37 22,48 3,37 3,13";
const GLYPHS = {
  available: '<path d="M4 9.5 5.5 4h13L20 9.5"/><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/><path d="M5 12.5V20h14v-7.5"/>',
  allocated: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  inactive: '<path d="M6 12h12"/>'
};

function hexSvg(site, isSelected) {
  const { status, id } = site;
  let fill = "fill-surface";
  let fillAttr = "";
  let stroke = "stroke-ink";
  let dash = "";
  let glyphColor = "text-ink";

  if (status === "allocated") { stroke = "stroke-info"; dash = 'stroke-dasharray="3 3"'; glyphColor = "text-info"; }
  if (status === "inactive") { fill = ""; fillAttr = `fill="url(#hatch-${id})"`; stroke = "stroke-idle"; dash = 'stroke-dasharray="3 3"'; glyphColor = "text-idle"; }
  if (isSelected) {
    fillAttr = "";
    fill = status === "available" ? "fill-accent" : "fill-ink";
    stroke = status === "available" ? "stroke-accent" : "stroke-ink";
    dash = "";
    glyphColor = status === "available" ? "text-white" : "text-surface";
  }

  return `
    <svg viewBox="0 0 44 50" class="relative size-full overflow-visible drop-shadow-[0_6px_8px_rgb(16_24_40/0.25)]" aria-hidden="true">
      <defs>
        <pattern id="hatch-${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="6" class="fill-surface"/><rect width="2.5" height="6" class="fill-idle/25"/>
        </pattern>
      </defs>
      <polygon points="${HEX}" ${fillAttr} class="${fill} ${stroke}" stroke-width="1.6" stroke-linejoin="round" ${dash}/>
      <g transform="translate(13 15.5) scale(.75)" class="${glyphColor}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${GLYPHS[status]}</g>
    </svg>`;
}

// MapLibre positions the outer element with its own transform, so all visual
// state (hover, selection) lives on the inner wrapper.
function createMarkerElement(site, isSelected) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `group block size-[44px] cursor-pointer border-0 bg-transparent p-0 ${isSelected ? "z-10" : ""}`;
  button.setAttribute("aria-label", `${site.name}, ${site.status}`);

  const inner = document.createElement("span");
  inner.className = `relative block size-full transition-transform duration-150 group-hover:scale-110 ${isSelected ? "scale-[1.18]" : ""}`;
  inner.innerHTML =
    (isSelected && site.status === "available"
      ? '<span class="hex-pulse absolute inset-0 rounded-full bg-accent/40"></span>'
      : "") + hexSvg(site, isSelected);

  button.append(inner);
  return button;
}

export function SitesMap({ sites, selectedSite, onSelectSite, padding, shiftControls }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const onSelectRef = useRef(onSelectSite);
  const [status, setStatus] = useState("loading");

  useEffect(() => { onSelectRef.current = onSelectSite; }, [onSelectSite]);

  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      ...HOME,
      minZoom: 9,
      maxPitch: 70,
      attributionControl: false
    });
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    // The Bright sprite lacks a few POI icons; ignore them instead of logging a warning per icon.
    map.on("styleimagemissing", () => {});
    map.once("load", () => setStatus("ready"));
    map.on("error", (event) => {
      // Single tile failures are expected on weak connections; only a failed style is fatal.
      if (!event.sourceId && !event.tile) setStatus("error");
      console.warn("[map]", event.error?.message);
    });
    mapRef.current = map;

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = sites.map((site) => {
      const element = createMarkerElement(site, selectedSite?.id === site.id);
      element.addEventListener("click", () => onSelectRef.current(site));
      return new maplibregl.Marker({ element, anchor: "center" }).setLngLat([site.longitude, site.latitude]).addTo(map);
    });
  }, [sites, selectedSite?.id]);

  useEffect(() => {
    if (!selectedSite || !mapRef.current) return;
    mapRef.current.easeTo({
      center: [selectedSite.longitude, selectedSite.latitude],
      zoom: Math.max(mapRef.current.getZoom(), 15.2),
      pitch: Math.max(mapRef.current.getPitch(), 55),
      padding,
      duration: 700
    });
    // Re-centre only when the selection changes, not when padding does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSite?.id]);

  function locateUser() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      mapRef.current?.easeTo({ center: [coords.longitude, coords.latitude], zoom: 15 });
    });
  }

  function resetView() {
    mapRef.current?.easeTo({ ...HOME, padding, duration: 700 });
  }

  const controlClass = "grid size-10 place-items-center text-ink transition hover:bg-sunken active:bg-line";

  return (
    <div className="absolute inset-0 overflow-hidden bg-sunken">
      <div ref={containerRef} className="size-full" role="region" aria-label="Map of vending sites in Kigali" />

      {status === "loading" && (
        <div role="status" aria-label="Loading map" className="absolute inset-0 bg-sunken motion-safe:animate-pulse">
          <span className="sr-only">Loading map</span>
        </div>
      )}
      {status === "error" && (
        <div role="alert" className="absolute left-1/2 top-1/2 w-[min(90%,22rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-surface p-5 text-center shadow-float">
          <strong className="text-sm font-medium">Map unavailable</strong>
          <p className="mt-1 text-[13px] text-mute">The basemap could not be loaded. Check your connection and refresh.</p>
        </div>
      )}

      <div className={`absolute bottom-12 right-3 z-10 grid divide-y divide-line overflow-hidden rounded-2xl bg-surface shadow-float ${shiftControls ? "sm:right-[360px]" : ""}`}>
        <button type="button" className={controlClass} aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn()}><Icon name="plus" className="size-[18px]" /></button>
        <button type="button" className={controlClass} aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut()}><Icon name="minus" className="size-[18px]" /></button>
        <button type="button" className={controlClass} aria-label="Reset view" onClick={resetView}><Icon name="layers" className="size-[18px]" /></button>
        <button type="button" className={controlClass} aria-label="Find my location" onClick={locateUser}><Icon name="locate" className="size-[18px]" /></button>
      </div>
    </div>
  );
}
