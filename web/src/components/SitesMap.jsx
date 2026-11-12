import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";

const fallbackCenter = [-1.9441, 30.0619];

export function SitesMap({ sites = [] }) {
  return (
    <MapContainer className="map" center={fallbackCenter} zoom={12} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {sites.map((site) => (
        <CircleMarker key={site.id} center={[site.latitude, site.longitude]} radius={9}>
          <Popup>
            <strong>{site.name}</strong><br />
            {site.district} · {site.status}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}

