import { Link } from "react-router-dom";

const steps = [
  ["01", "Browse verified sites", "See location, availability, fees and terms before you apply."],
  ["02", "Apply and track your place", "Each application is timestamped so queue order stays visible."],
  ["03", "Check every outcome", "Allocation decisions and their stated reasons remain on the public record."]
];

export function HomePage() {
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">Fair access starts with a visible process</p>
          <h1>Vending space,<br /><em>allocated in the open.</em></h1>
          <p className="hero-copy">Find legal vending sites, follow a transparent application queue, and verify allocation decisions in one shared public record.</p>
          <div className="actions">
            <Link className="button" to="/sites">Explore available sites</Link>
            <Link className="text-link" to="/dashboard">View public outcomes →</Link>
          </div>
        </div>
        <aside className="trust-card" aria-label="Platform commitments">
          <p className="card-label">Public record</p>
          <strong>Every decision.<br />A stated reason.<br />No silent edits.</strong>
          <div className="status-line"><span /> Append-only allocation log</div>
        </aside>
      </section>
      <section className="how-it-works">
        <p className="eyebrow">How it works</p>
        <h2>A clearer path from open site to fair decision.</h2>
        <div className="step-grid">
          {steps.map(([number, title, copy]) => (
            <article key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

