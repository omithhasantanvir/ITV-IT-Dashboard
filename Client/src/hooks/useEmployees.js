import { useCallback, useEffect, useRef, useState } from 'react';
import api, { getErrorMessage } from '@/lib/api';

// Loads the employee register (GET /employees) and the IT desk team
// (GET /employees/it-team), mirroring useComputers / useExtensionDirectory.
// createEmployee / updateEmployee / deleteEmployee wrap POST / PUT / DELETE
// and patch the local lists so the tables update immediately.
export function useEmployees() {
  const [employees, setEmployees] = useState([]);
  const [itTeam, setItTeam] = useState([]);
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
      const [list, team] = await Promise.all([api.get('/employees'), api.get('/employees/it-team')]);
      if (!mounted.current) return list;
      setEmployees(Array.isArray(list) ? list : []);
      setItTeam(Array.isArray(team) ? team : []);
      setError(null);
      setLastUpdated(new Date());
      return list;
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

  const keyOf = (item) => item._id || item.employeeId;

  const applySaved = useCallback((saved) => {
    if (!mounted.current || !saved || typeof saved !== 'object') return saved;
    const savedKey = keyOf(saved);
    const matches = (item) => keyOf(item) === savedKey;
    setEmployees((previous) => {
      const exists = previous.some(matches);
      if (!exists) return [saved, ...previous];
      return previous.map((item) => (matches(item) ? saved : item));
    });
    setItTeam((previous) => {
      if (!saved.isITTeam) return previous.filter((item) => !matches(item));
      const exists = previous.some(matches);
      if (!exists) return [...previous, saved];
      return previous.map((item) => (matches(item) ? saved : item));
    });
    setLastUpdated(new Date());
    setError(null);
    return saved;
  }, []);

  const createEmployee = useCallback(
    async (payload) => applySaved(await api.post('/employees', payload)),
    [applySaved]
  );

  const updateEmployee = useCallback(
    async (id, payload) => applySaved(await api.put('/employees/' + id, payload)),
    [applySaved]
  );

  const deleteEmployee = useCallback(async (id) => {
    const removed = await api.delete('/employees/' + id);
    if (mounted.current) {
      setEmployees((previous) => previous.filter((item) => keyOf(item) !== id));
      setItTeam((previous) => previous.filter((item) => keyOf(item) !== id));
      setLastUpdated(new Date());
      setError(null);
    }
    return removed;
  }, []);

  useEffect(() => {
    refresh({ silent: false });
  }, [refresh]);

  return { employees, itTeam, loading, refreshing, error, lastUpdated, refresh, createEmployee, updateEmployee, deleteEmployee };
}

export default useEmployees;

