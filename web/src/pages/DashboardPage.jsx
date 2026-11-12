export function DashboardPage() {
  return (
    <section className="page-section">
      <div className="page-heading">
        <div><p className="eyebrow">No login required</p><h1>Public allocation outcomes</h1></div>
        <p>An anonymized record of decisions by site and district, without exposing vendor personal data.</p>
      </div>
      <div className="metric-grid">
        <article><span>Total decisions</span><strong>—</strong></article>
        <article><span>Open sites</span><strong>—</strong></article>
        <article><span>Flags awaiting review</span><strong>—</strong></article>
      </div>
      <div className="empty-state"><h2>The public record is ready</h2><p>Allocation outcomes will appear in sequence when administrators record them.</p></div>
    </section>
  );
}

