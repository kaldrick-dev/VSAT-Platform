import { useCallback, useEffect, useState } from "react";

// Runs an API call on mount and exposes the result, loading flag, error and a reload function.
export function useApi(call, initial = null) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(() => {
    setLoading(true);
    return call()
      .then((result) => { setData(result); setError(""); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [call]);

  useEffect(() => { reload(); }, [reload]);

  return { data, loading, error, reload };
}
