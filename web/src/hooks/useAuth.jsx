import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, auth } from "../lib/api.js";
import { ROLES } from "../lib/access.js";

const USER_KEY = "vsat.user";
const AuthContext = createContext(null);

function readUser() {
  try {
    // A user record without a token is stale; treat as signed out.
    if (!auth.get()) return null;
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

function writeUser(user) {
  try {
    user ? localStorage.setItem(USER_KEY, JSON.stringify(user)) : localStorage.removeItem(USER_KEY);
  } catch { /* storage unavailable */ }
}

/** The UI only trusts this for display and routing. The API re-checks the JWT on every request. */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser);

  const signIn = useCallback(({ token, user: nextUser }) => {
    auth.set(token);
    writeUser(nextUser);
    setUser(nextUser);
  }, []);

  const signOut = useCallback(() => {
    auth.set(null);
    writeUser(null);
    setUser(null);
  }, []);

  // Refresh the stored user from the API so a role change or deleted account shows up on reload.
  useEffect(() => {
    if (!auth.get()) return;
    api.me().then(({ user: fresh }) => {
      const next = { ...fresh, name: fresh.fullName };
      writeUser(next);
      setUser(next);
    }).catch(() => {});
  }, []);

  // The API rejected our token (expired/invalid): drop the session.
  useEffect(() => {
    const onUnauthorized = () => { writeUser(null); setUser(null); };
    window.addEventListener("vsat:unauthorized", onUnauthorized);
    return () => window.removeEventListener("vsat:unauthorized", onUnauthorized);
  }, []);

  const value = useMemo(
    () => ({ user, role: user?.role ?? ROLES.PUBLIC, isSignedIn: Boolean(user), signIn, signOut }),
    [user, signIn, signOut]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
