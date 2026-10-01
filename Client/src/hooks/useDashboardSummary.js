import { useCallback, useEffect, useRef, useState } from 'react';
import api, { getErrorMessage } from '@/lib/api';

// Loads /dashboard/summary and keeps it fresh. Exposes loading / error / empty
// state separately so the UI can tell "still fetching" apart from "no data yet".
export function useDashboardSummary({ intervalMs = 30000 } = {}) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async ({ silent } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await api.get('/dashboard/summary');
      if (!mounted.current) return data;
      setSummary(data);
      setError(null);
      setLastUpdated(new Date());
      return data;
    } catch (requestError) {
      if (mounted.current) setError(getErrorMessage(requestError));
      return null;
    } finally {
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    refresh({ silent: false });
    if (!intervalMs) return undefined;
    const timer = setInterval(() => refresh({ silent: true }), intervalMs);
    return () => clearInterval(timer);
  }, [refresh, intervalMs]);

  return { summary, stats: summary?.stats ?? null, loading, refreshing, error, lastUpdated, refresh };
}

export default useDashboardSummary;
