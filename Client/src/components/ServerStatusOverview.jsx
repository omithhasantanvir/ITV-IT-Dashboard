import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, Radar, RefreshCw, Wifi, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useServerStatus } from '@/hooks/useServerStatus';
import { resolveServerIcon } from '@/lib/serverIcons';
import { cn } from '@/lib/utils';

const formatClock = (date) =>
  date ? new Date(date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--';

// ICMP means the box answered a real ping; tcp means it only answered a port
// connect (firewall blocks echo). Shown so an admin can tell the two apart.
const METHOD_LABEL = { icmp: 'ICMP ping', tcp: 'TCP port', none: 'No reply' };

/**
 * The animated status puck on every tile:
 * - queued  : dimmed radar, waiting for its turn in the probe round
 * - pinging : two expanding rings + a rotating sweep
 * - done    : green puck when the host replied, red puck when it did not
 */
function PingPuck({ phase, online, pingedAt }) {
  if (phase === 'pinging' || phase === 'queued') {
    const queued = phase === 'queued';
    return (
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center">
        {!queued && <span className="absolute inset-0 rounded-full bg-sky-500/25 animate-ping-ring" />}
        {!queued && (
          <span
            className="absolute inset-0 rounded-full bg-sky-500/20 animate-ping-ring"
            style={{ animationDelay: '400ms' }}
          />
        )}
        <span
          className={cn(
            'absolute inset-0 rounded-full border-2 border-transparent',
            queued ? 'border-dashed border-border' : 'border-t-sky-500 border-r-sky-500/50 animate-ping-sweep',
          )}
        />
        <span
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-full',
            queued ? 'bg-muted text-muted-foreground/70' : 'bg-sky-500/10 text-sky-600 dark:text-sky-300',
          )}
        >
          <Radar className={cn('h-5 w-5', queued && 'opacity-60')} />
        </span>
      </span>
    );
  }

  return (
    <span className="relative flex h-11 w-11 shrink-0 items-center justify-center">
      {online && <span className="absolute inset-0 rounded-full bg-emerald-500/15" />}
      <span
        // Re-mounting on each completed ping replays the pop, so every round
        // visibly lands on the tile instead of silently swapping a colour.
        key={pingedAt || 'initial'}
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-full text-white shadow-sm animate-status-pop',
          online ? 'bg-emerald-500' : 'bg-rose-500',
        )}
      >
        {online ? <Check className="h-5 w-5 stroke-[3]" /> : <X className="h-5 w-5 stroke-[3]" />}
      </span>
    </span>
  );
}

/**
 * One monitored host: its own role icon, live ping animation and result.
 */
function ServerTile({ server, phase, onRetry }) {
  const { Icon, tile } = resolveServerIcon(server);
  const pinging = phase === 'pinging' || phase === 'queued';
  const online = Boolean(server.isOnline);
  const previousOnline = useRef(online);
  const [justChanged, setJustChanged] = useState(null);

  // Highlight a host that FLIPS state — green ring when it came back, red shake
  // when it dropped. A host that stays online simply re-pops its puck.
  useEffect(() => {
    if (previousOnline.current !== online) {
      previousOnline.current = online;
      setJustChanged(online ? 'up' : 'down');
      const timer = setTimeout(() => setJustChanged(null), 1600);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [online]);

  return (
    <Card
      className={cn(
        'border border-border/80 bg-card/80 transition-all duration-300',
        pinging && 'border-sky-300/70 ring-1 ring-sky-400/30 dark:border-sky-500/40',
        !pinging && !online &&
          'border-rose-300 bg-rose-50/60 ring-1 ring-rose-400/40 dark:border-rose-500/50 dark:bg-rose-500/10',
        justChanged === 'down' && 'animate-status-shake',
        justChanged === 'up' && 'ring-2 ring-emerald-400/50',
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', tile)}>
            <Icon className="h-5 w-5" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-foreground">{server.serverName}</p>
              {/* TCP-only reply: the box blocks ICMP echo but the port answers */}
              {!pinging && server.method === 'tcp' ? <Wifi className="h-3.5 w-3.5 shrink-0 text-amber-500" /> : null}
            </div>
            <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">{server.ipAddress}</p>
            <p className="mt-0.5 truncate text-[11px] uppercase tracking-wide text-muted-foreground/80">
              {server.serverType}
            </p>
          </div>

          <PingPuck phase={phase} online={online} pingedAt={server.checkedAt} />
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
              pinging && 'bg-sky-500/10 text-sky-600 dark:text-sky-300',
              !pinging && online && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
              !pinging && !online && 'bg-rose-500/10 text-rose-600 dark:text-rose-300',
            )}
          >
            {phase === 'queued' ? (
              'Queued'
            ) : pinging ? (
              <>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sky-500" />
                </span>
                Pinging…
              </>
            ) : online ? (
              <>
                Online
                {typeof server.latencyMs === 'number' ? (
                  <span className="font-normal text-emerald-600/70 dark:text-emerald-300/70">{server.latencyMs}ms</span>
                ) : null}
              </>
            ) : (
              'Offline'
            )}
          </span>

          <div className="flex items-center gap-2">
            {!pinging && (
              <span className="hidden text-[11px] text-muted-foreground sm:inline">
                {METHOD_LABEL[server.method] || '—'}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title={`Ping ${server.serverName} again`}
              onClick={() => onRetry(server)}
              disabled={pinging}
            >
              <RefreshCw className={cn('h-3.5 w-3.5', phase === 'pinging' && 'animate-spin')} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}



export function ServerStatusOverview() {
  const {
    servers,
    summary,
    offlineServers,
    loading,
    refreshing,
    error,
    lastUpdated,
    probing,
    pingedCount,
    pingTotal,
    refresh,
    probeOne,
  } = useServerStatus();
  // The automatic outage alert lives in the site-wide <ServerOutagePopup />, so
  // this page only opens its own dialog when the operator clicks "Show issues".
  const [popupOpen, setPopupOpen] = useState(false);

  const percent = pingTotal > 0 ? Math.round((pingedCount / pingTotal) * 100) : 0;
  const hasFailures = !loading && summary.offline > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Server Status Overview</h2>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            {loading ? (
              <>
                <Radar className="h-4 w-4 animate-pulse text-sky-500" />
                Pinging the monitored hosts…
              </>
            ) : (
              <>
                {refreshing ? (
                  <Radar className="h-4 w-4 animate-pulse text-sky-500" />
                ) : summary.offline > 0 ? (
                  <Wifi className="h-4 w-4 text-rose-500" />
                ) : (
                  <Check className="h-4 w-4 text-emerald-500" />
                )}
                {refreshing
                  ? `Pinging ${pingedCount}/${pingTotal}…`
                  : `${summary.online} of ${summary.total} responding · last checked ${formatClock(lastUpdated)}`}
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!loading && summary.total > 0 && (
            <Badge variant={summary.offline > 0 ? 'danger' : 'success'}>
              {summary.offline > 0 ? `${summary.offline} offline` : 'All systems online'}
            </Badge>
          )}
          {hasFailures && (
            <Button variant="outline" size="sm" onClick={() => setPopupOpen(true)}>
              <AlertTriangle className="h-4 w-4" />
              Show issues
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => refresh({ silent: true })} disabled={loading || refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Ping all again
          </Button>
        </div>
      </div>

      {/* Round progress: fills as each host answers, green/red when the round ends */}
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            refreshing ? 'bg-sky-500' : summary.offline > 0 ? 'bg-rose-500' : 'bg-emerald-500'
          }`}
          style={{ width: loading ? '15%' : `${refreshing ? Math.max(percent, 6) : 100}%` }}
        />
      </div>

      {error && (
        <div className="flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <strong className="font-semibold">Ping service error:</strong> {error}
            </span>
          </div>
          <Button size="sm" variant="outline" onClick={() => refresh({ silent: true })} disabled={refreshing}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="h-[136px] animate-pulse rounded-lg bg-muted/40" />
          ))}
        </div>
      ) : servers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No hosts to monitor yet. Add them in <code className="font-mono">backend/config/defaultServers.js</code> and run{' '}
          <code className="font-mono">npm run seed:servers</code>.
        </div>
      ) : (
        <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {servers.map((server) => (
            <ServerTile
              key={server.id || server.serverName}
              server={server}
              phase={probing[server.id || server.serverName]}
              onRetry={probeOne}
            />
          ))}
        </div>
      )}

      <Dialog open={popupOpen} onOpenChange={setPopupOpen}>
        <DialogContent className="border-rose-300 sm:max-w-lg dark:border-rose-500/50">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/15 text-rose-600 animate-status-pop dark:text-rose-300">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-rose-600 dark:text-rose-300">
              {offlineServers.length} server{offlineServers.length === 1 ? '' : 's'} not responding
            </DialogTitle>
            <DialogDescription className="text-center">
              These hosts answered neither a ping nor a port check on the last round.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-64 space-y-2 overflow-y-auto">
            {offlineServers.map((server) => {
              const { Icon, tile } = resolveServerIcon(server);
              return (
                <div
                  key={server.id || server.serverName}
                  className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50/70 p-3 dark:border-rose-500/30 dark:bg-rose-500/10"
                >
                  <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', tile)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{server.serverName}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">{server.ipAddress}</p>
                  </div>
                  <Badge variant="danger">Offline</Badge>
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => refresh({ silent: true })} disabled={refreshing}>
              <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
              Retry ping
            </Button>
            <Button onClick={() => setPopupOpen(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ServerStatusOverview;



