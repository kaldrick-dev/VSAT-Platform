// Configures MapLibre once: the production build only ships its worker file when it is imported with ?url.
import * as maplibregl from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";

maplibregl.setWorkerUrl(workerUrl);

export { maplibregl };
