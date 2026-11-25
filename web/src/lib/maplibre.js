// Configures MapLibre once: the production build only ships its worker file when it is imported with ?url.
import * as maplibregl from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";

maplibregl.setWorkerUrl(workerUrl);

// A MapTiler key is optional: without one the keyless OpenFreeMap style is used.
const OPEN_STYLE = "https://tiles.openfreemap.org/styles/bright";
const key = import.meta.env.VITE_MAPTILER_API_KEY;
export const MAP_STYLE = key ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${key}` : OPEN_STYLE;

const usedFallback = new WeakSet();

// Switches a map to the keyless style once, when the keyed style could not load. Returns true if it switched.
export function fallBackToOpenStyle(map, onReady) {
  if (MAP_STYLE === OPEN_STYLE || usedFallback.has(map)) return false;
  usedFallback.add(map);
  map.setStyle(OPEN_STYLE);
  map.once("idle", () => onReady?.());
  return true;
}

export { maplibregl };
