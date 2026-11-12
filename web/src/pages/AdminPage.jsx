export function AdminPage() {
  return (
    <section className="page-section narrow">
      <p className="eyebrow">Role-restricted</p>
      <h1>Administration</h1>
      <p className="lead">Authorized administrators can publish sites, review applications, and append allocation decisions with stated reasons.</p>
      <div className="empty-state"><h2>Admin sign-in required</h2><p>Management tools are protected by role-based access.</p></div>
    </section>
  );
}

