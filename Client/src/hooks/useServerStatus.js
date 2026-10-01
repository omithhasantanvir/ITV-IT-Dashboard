import { useCallback, useMemo, useSyncExternalStore } from 'react';
import api, { getErrorMessage } from '@/lib/api';

const EMPTY_SUMMARY = { total: 0, online: 0, offline: 0, onlinePercent: 0 };
const POLL_INTERVAL_MS = 60000;
// Hosts probed at the same time. Four keeps a 14-host round quick without
// bursting the LAN with parallel pings.
const CONCURRENCY = 4;
// A LAN ping answers in a few milliseconds, which would make the "pinging"
// animation invisible. Every card holds its animation for at least this long so
// the ping can actually be seen before it flips green/red.
const MIN_PING_VISIBLE_MS = 500;
// Small per-card offset so the grid reads as a wave instead of one flat flash.
const STAGGER_MS = 70;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// One shared store for the whole app
// ---------------------------------------------------------------------------
// The Servers grid, the header pill and the site-wide outage popup all need the
// same live ping data. A module-level store means one poller and one probe round
// instead of three components fighting over the same hosts.
const listeners = new Set();

const state = {
  servers: [],
  summary: EMPTY_SUMMARY,
  loading: true,
  error: null,
  lastUpdated: null,
  // server id -> 'queued' | 'pinging'
  probing: {},
  round: { active: false, checked: 0, total: 0 },
};

const emit = () => listeners.forEach((listener) => listener());

const setPartial = (patch) => {
  Object.assign(state, patch);
  emit();
};

const summarise = (servers) => {
  const online = servers.filter((server) => server.isOnline).length;
  return {
    total: servers.length,
    online,
    offline: servers.length - online,
    onlinePercent: servers.length > 0 ? Math.round((online / servers.length) * 100) : 0,
  };
};

const serverId = (server) => server.id || server.serverName || server.ipAddress;

const setProbing = (id, phase) => {
  const probing = { ...state.probing };
  if (phase) probing[id] = phase;
  else delete probing[id];
  setPartial({ probing });
};

// ---------------------------------------------------------------------------
// Cached overview (one full round the backend also shares with the dashboard)
// ---------------------------------------------------------------------------
let overviewInFlight = null;

const loadOverview = async ({ silent = false } = {}) => {
  if (overviewInFlight) return overviewInFlight;

  if (!silent) setPartial({ loading: true });
  overviewInFlight = api
    .get('/servers/overview')
    .then((data) => {
      const servers = Array.isArray(data?.servers) ? data.servers : [];
      setPartial({
        servers,
        summary: data?.summary ?? summarise(servers),
        error: null,
        lastUpdated: new Date(),
        loading: false,
      });
      return data;
    })
    .catch((requestError) => {
      setPartial({ error: getErrorMessage(requestError), loading: false });
      return null;
    })
    .finally(() => {
      overviewInFlight = null;
    });

  return overviewInFlight;
};

// ---------------------------------------------------------------------------
// Per-host probe round: every card animates and flips on its own answer
// ---------------------------------------------------------------------------
let roundInFlight = null;

const probeAll = async ({ force = false } = {}) => {
  if (roundInFlight) return roundInFlight;

  const hosts = [...state.servers];
  if (hosts.length === 0) {
    await loadOverview();
    return roundInFlight || Promise.resolve();
  }

  const total = hosts.length;
  let cursor = 0;
  let checked = 0;

  setPartial({
    round: { active: true, checked: 0, total },
    probing: Object.fromEntries(hosts.map((host) => [serverId(host), 'queued'])),
  });

  const worker = async () => {
    let offset = 0;
    while (cursor < hosts.length) {
      const host = hosts[cursor];
      cursor += 1;
      const id = serverId(host);
      const startedAt = Date.now();
      setProbing(id, 'pinging');

      try {
        const result = await api.get('/servers/probe', {
          params: force ? { host: host.serverName, refresh: 'true' } : { host: host.serverName },
        });
        if (result?.serverName) {
          const servers = state.servers.map((server) =>
            serverId(server) === id ? { ...server, ...result } : server,
          );
          setPartial({ servers, summary: summarise(servers), lastUpdated: new Date(), error: null });
        }
      } catch (requestError) {
        // A failed probe *request* must not repaint a healthy host as offline:
        // keep the last known status and surface the API problem instead.
        setPartial({ error: getErrorMessage(requestError) });
      } finally {
        // Hold the ripple long enough to read, then release the card.
        const visibleFor = Math.max(0, MIN_PING_VISIBLE_MS + offset - (Date.now() - startedAt));
        if (visibleFor > 0) await sleep(visibleFor);
        offset = Math.min(offset + STAGGER_MS, 490);
        checked += 1;
        setProbing(id, null);
        setPartial({ round: { active: checked < total, checked, total } });
      }
    }
  };

  roundInFlight = Promise.all(Array.from({ length: Math.min(CONCURRENCY, hosts.length) }, worker))
    .catch((error) => setPartial({ error: getErrorMessage(error) }))
    .finally(() => {
      roundInFlight = null;
    });

  return roundInFlight;
};

// Manual refresh (header pill, page button, popup "Ping again"): re-probe the
// grid one card at a time so the animations replay. The grid is only read from
// /servers/overview the first time — afterwards the per-host round is enough,
// which halves the pings sent to the LAN per refresh.
const refresh = async ({ silent = true } = {}) => {
  if (state.servers.length === 0) await loadOverview({ silent });
  await probeAll({ force: true });
  return state.servers;
};

// ---------------------------------------------------------------------------
// Polling: started once for the whole app, stopped when nothing listens
// ---------------------------------------------------------------------------
let subscribers = 0;
let timer = null;

const startPolling = () => {
  if (timer) return;
  timer = setInterval(() => {
    if (state.servers.length === 0) loadOverview({ silent: true });
    else probeAll({ force: true });
  }, POLL_INTERVAL_MS);
};

const subscribe = (listener) => {
  listeners.add(listener);
  subscribers += 1;
  startPolling();
  if (state.servers.length === 0) {
    loadOverview().then(() => probeAll());
  }
  return () => {
    listeners.delete(listener);
    subscribers -= 1;
    if (subscribers <= 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
};

const getSnapshot = () => state;

/**
 * Live ping status of the monitored hosts.
 *
 * Backed by a module store, so mounting this in the header pill, the outage popup
 * and the Servers grid costs exactly one poller and one probe round. Each host is
 * probed individually so a card can show "pinging…" and turn green (replied) or
 * red (no answer) the moment its own result lands.
 */
export function useServerStatus() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const offlineServers = useMemo(() => snapshot.servers.filter((server) => !server.isOnline), [snapshot.servers]);

  const probeOne = useCallback(async (host) => {
    const id = serverId(host);
    setProbing(id, 'pinging');
    try {
      const result = await api.get('/servers/probe', { params: { host: host.serverName || id, refresh: 'true' } });
      if (result?.serverName) {
        const servers = state.servers.map((server) => (serverId(server) === id ? { ...server, ...result } : server));
        setPartial({ servers, summary: summarise(servers), lastUpdated: new Date(), error: null });
      }
      return result;
    } catch (requestError) {
      setPartial({ error: getErrorMessage(requestError) });
      return null;
    } finally {
      setProbing(id, null);
    }
  }, []);

  return {
    servers: snapshot.servers,
    summary: snapshot.summary,
    offlineServers,
    loading: snapshot.loading,
    error: snapshot.error,
    lastUpdated: snapshot.lastUpdated,
    probing: snapshot.probing,
    refreshing: snapshot.round.active,
    pingedCount: snapshot.round.checked,
    pingTotal: snapshot.round.total,
    refresh,
    probeOne,
  };
}

export default useServerStatus;

