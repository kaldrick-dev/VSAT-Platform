import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api.js";

// Loads the public site list from the API.
export function useSites() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(() => {
    setLoading(true);
    return api.listSites()
      .then(({ data }) => { setSites(data); setError(""); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { sites, loading, error, reload };
}
