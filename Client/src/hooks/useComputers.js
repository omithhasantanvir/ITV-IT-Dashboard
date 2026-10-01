import { useCallback, useEffect, useRef, useState } from 'react';
import api, { getErrorMessage } from '@/lib/api';

// Loads the computer asset register and lets callers add to and edit it.
//
// Mirrors useExtensionDirectory / useDashboardSummary: `refresh` re-reads the
// list (optionally "silent", i.e. without flipping the full-page loading state),
// `createComputer` wraps POST /computers and `updateComputer` wraps
// PUT /computers/:id. Both patch the local list so the table updates immediately
// without a second round trip.
export function useComputers() {
  const [computers, setComputers] = useState([]);
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
      const data = await api.get('/computers');
      if (!mounted.current) return data;
      setComputers(Array.isArray(data) ? data : []);
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

  const createComputer = useCallback(async (payload) => {
    const created = await api.post('/computers', payload);
    if (mounted.current) {
      if (created && typeof created === 'object') {
        setComputers((previous) => [created, ...previous]);
      }
      setLastUpdated(new Date());
      setError(null);
    }
    return created;
  }, []);

  const updateComputer = useCallback(async (id, payload) => {
    const updated = await api.put(`/computers/${id}`, payload);
    if (mounted.current && updated && typeof updated === 'object') {
      const key = (item) => item._id || item.assetId;
      setComputers((previous) => previous.map((item) => (key(item) === key(updated) ? updated : item)));
      setLastUpdated(new Date());
      setError(null);
    }
    return updated;
  }, []);

  const deleteComputer = useCallback(async (id) => {
    const removed = await api.delete(`/computers/${id}`);
    if (mounted.current) {
      setComputers((previous) => previous.filter((item) => (item._id || item.assetId) !== id));
      setLastUpdated(new Date());
      setError(null);
    }
    return removed;
  }, []);

  useEffect(() => {
    refresh({ silent: false });
  }, [refresh]);

  return { computers, loading, refreshing, error, lastUpdated, refresh, createComputer, updateComputer, deleteComputer };
}

export default useComputers;
