import { SitesMap } from "../components/SitesMap.jsx";

export function SitesPage() {
  return (
    <section className="page-section">
      <div className="page-heading">
        <div><p className="eyebrow">Site registry</p><h1>Find an available vending site</h1></div>
        <p>Filterable listings will appear here as administrators publish verified sites.</p>
      </div>
      <div className="filter-bar">
        <label>District<select defaultValue=""><option value="">All districts</option></select></label>
        <label>Status<select defaultValue="available"><option value="available">Available</option><option value="">All statuses</option></select></label>
      </div>
      <SitesMap />
      <div className="empty-state"><h2>No sites published yet</h2><p>The registry is ready to display records from the API.</p></div>
    </section>
  );
}

