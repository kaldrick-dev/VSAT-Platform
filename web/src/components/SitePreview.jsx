import { useEffect, useRef } from "react";
import { maplibregl } from "../lib/maplibre.js";
import { MAP_STYLE } from "./SitesMap.jsx";

/** A tilted, non-interactive close-up of a site, clipped to a hexagon like the reference card. */
export function SitePreview({ site }) {
  const ref = useRef(null);

  useEffect(() => {
    const map = new maplibregl.Map({
      container: ref.current,
      style: MAP_STYLE,
      center: [site.longitude, site.latitude],
      zoom: 16.4,
      pitch: 55,
      bearing: -20,
      interactive: false,
      attributionControl: false,
      fadeDuration: 0
    });
    map.on("styleimagemissing", () => {});
    return () => map.remove();
  }, [site.id, site.longitude, site.latitude]);

  // MapLibre forces `position: relative` on its container, so sizing and the
  // hexagon clip live on a wrapper rather than on the map element itself.
  return (
    <div className="relative mx-auto h-[150px] w-[174px]">
      <div className="absolute inset-0 bg-sunken [clip-path:polygon(25%_4%,75%_4%,100%_50%,75%_96%,25%_96%,0_50%)]">
        <div ref={ref} className="size-full" role="img" aria-label={`Close-up map of ${site.name}`} />
      </div>
      <span className="pointer-events-none absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent ring-4 ring-surface" />
    </div>
  );
}
