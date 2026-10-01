import { useCallback, useEffect, useRef, useState } from 'react';
import api, { getErrorMessage } from '@/lib/api';

const EMPTY_SUMMARY = {
  keyPersons: 0,
  sections: 0,
  bureauContacts: 0,
  commonLines: 0,
  personLines: 0,
  sharedLines: 0,
  pabxLines: 0,
  registeredExtensions: null,
  source: '',
};

// Loads /extensions/directory — the office PABX plan from backend/config/keyPersons.js.
// The directory is static configuration, so a single fetch is enough; `refresh`
// re-reads it so an edit on the server shows up without a page reload.
export function useExtensionDirectory() {
  const [directory, setDirectory] = useState(null);
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
      const data = await api.get('/extensions/directory');
      if (!mounted.current) return data;
      setDirectory(data ?? null);
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
  }, [refresh]);

  return {
    directory,
    summary: { ...EMPTY_SUMMARY, ...(directory?.summary ?? {}) },
    loading,
    refreshing,
    error,
    lastUpdated,
    refresh,
  };
}

export default useExtensionDirectory;
