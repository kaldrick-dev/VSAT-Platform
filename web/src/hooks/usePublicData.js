import { useEffect, useState } from "react";
import { api } from "../lib/api.js";

const NAMES = ["spaces", "activity", "flags"];

// Loads the open datasets and the accountability summary from the API.
export function usePublicData() {
  const [state, setState] = useState({ spaces: [], activity: [], flags: [], summary: null, loading: true, error: "" });

  useEffect(() => {
    Promise.all([...NAMES, "summary"].map((name) => api.publicData(name)))
      .then(([spaces, activity, flags, summary]) => setState({ spaces: spaces.data, activity: activity.data, flags: flags.data, summary: summary.data, loading: false, error: "" }))
      .catch((err) => setState((old) => ({ ...old, loading: false, error: err.message })));
  }, []);

  return state;
}

export const shortId = (prefix, id) => `${prefix}-${id.slice(0, 6).toUpperCase()}`;
