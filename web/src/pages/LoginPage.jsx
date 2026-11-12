export function LoginPage() {
  return (
    <section className="page-section auth-page">
      <form className="auth-card">
        <p className="eyebrow">Welcome back</p>
        <h1>Sign in</h1>
        <label>Email address<input type="email" autoComplete="email" placeholder="name@example.com" /></label>
        <label>Password<input type="password" autoComplete="current-password" placeholder="Your password" /></label>
        <button className="button" type="submit">Sign in</button>
        <p className="form-note">Vendor registration will be enabled with the authentication service.</p>
      </form>
    </section>
  );
}

