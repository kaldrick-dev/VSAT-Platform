import { useEffect, useRef } from "react";
import { MAP_STYLE, fallBackToOpenStyle, maplibregl } from "../lib/maplibre.js";

/** Click the map to choose a site's coordinates (FR 1.3). value/onChange: { latitude, longitude }. */
export default function LocationPicker({ value, onChange }) {
  const box = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const change = useRef(onChange);
  change.current = onChange;

  useEffect(() => {
    const instance = new maplibregl.Map({ container: box.current, style: MAP_STYLE, center: [30.0619, -1.9441], zoom: 11.2, attributionControl: { compact: true } });
    instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    instance.on("error", (event) => { if (!event.sourceId && !event.tile) fallBackToOpenStyle(instance); });
    instance.getCanvas().style.cursor = "crosshair";
    instance.on("click", (e) => change.current({ latitude: +e.lngLat.lat.toFixed(6), longitude: +e.lngLat.lng.toFixed(6) }));
    map.current = instance;
    return () => { instance.remove(); marker.current = null; };
  }, []);

  useEffect(() => {
    if (!value || !map.current) return;
    marker.current ??= new maplibregl.Marker({ color: "#16a34a" });
    marker.current.setLngLat([value.longitude, value.latitude]).addTo(map.current);
  }, [value]);

  return <div ref={box} className="h-[260px] w-full overflow-hidden rounded-2xl" role="application" aria-label="Map: click to set the site location" />;
}
