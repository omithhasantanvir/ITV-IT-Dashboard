import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Server, ServerCrash, Wifi, WifiOff, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

const signatureOf = (servers) =>
  servers
    .map((server) => server.serverName || server.ipAddress)
    .sort()
    .join('|');

/**
 * Live ping pill for the app header: green when every monitored host answers,
 * red with the failing count as soon as one stops answering. Backed by the
 * shared ping store, so it costs no extra polling.
 */
export function ServerHealthPill() {
  const { summary, loading, refreshing, offlineServers } = useServerStatus();
  const [open, setOpen] = useState(false);

  if (loading || summary.total === 0) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="cursor-pointer">
        <Badge variant="outline" className="gap-1.5">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Checking
        </Badge>
      </button>
    );
  }

  const failing = summary.offline > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Live server ping status · click for details"
        className="cursor-pointer"
      >
        <Badge variant={failing ? 'danger' : 'success'} className="gap-1.5">
          {refreshing ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : failing ? (
            <WifiOff className="h-3 w-3" />
          ) : (
            <Wifi className="h-3 w-3" />
          )}
          {failing ? `${summary.offline} server${summary.offline === 1 ? '' : 's'} offline` : 'All servers online'}
        </Badge>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={cn('sm:max-w-md', failing && 'border-rose-300 dark:border-rose-500/50')}>
          <DialogHeader>
            <DialogTitle className={cn('text-center', failing && 'text-rose-600 dark:text-rose-300')}>
              Server ping status
            </DialogTitle>
            <DialogDescription className="text-center">
              {summary.online} of {summary.total} monitored hosts are answering pings.
            </DialogDescription>
          </DialogHeader>
          {failing ? (
            <div className="max-h-56 space-y-2 overflow-y-auto">
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
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
              <Server className="h-4 w-4" />
              Every monitored host is reachable.
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" asChild>
              <Link to="/servers" onClick={() => setOpen(false)}>
                Open server status
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Site-wide outage alert, mounted once in the app layout so a failure is visible
 * from any page:
 *  1. a modal that opens by itself the moment the set of failing hosts changes
 *     (so entering the website while a server is down says so immediately), and
 *  2. a red corner toast that stays until dismissed and returns if a new host drops.
 */
export function ServerOutagePopup() {
  const { offlineServers, loading, refreshing, refresh } = useServerStatus();
  const [open, setOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const notified = useRef('');

  const signature = useMemo(() => signatureOf(offlineServers), [offlineServers]);

  useEffect(() => {
    if (loading) return undefined;
    if (!signature) {
      // Everything answers again: close and re-arm the alert for the next outage.
      if (notified.current) {
        notified.current = '';
        setOpen(false);
      }
      return undefined;
    }
    if (notified.current !== signature) {
      notified.current = signature;
      setOpen(true);
      setToastOpen(true);
    }
    return undefined;
  }, [loading, signature]);

  if (loading || offlineServers.length === 0) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-rose-300 sm:max-w-lg dark:border-rose-500/50">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/15 text-rose-600 animate-status-pop dark:text-rose-300">
              <ServerCrash className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-rose-600 dark:text-rose-300">
              {offlineServers.length} server{offlineServers.length === 1 ? '' : 's'} offline
            </DialogTitle>
            <DialogDescription className="text-center">
              These hosts answered neither a ping nor a port check. The alert repeats if another host drops.
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
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {server.ipAddress} · {server.serverType}
                    </p>
                  </div>
                  <Badge variant="danger">Offline</Badge>
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => refresh({ silent: true })} disabled={refreshing}>
              <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
              Ping again
            </Button>
            <Button asChild onClick={() => setOpen(false)}>
              <Link to="/servers">Open server status</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {toastOpen && (
        <div className="fixed bottom-4 right-4 z-40 w-[min(360px,calc(100vw-2rem))] animate-toast-in rounded-xl border border-rose-300 bg-card p-4 shadow-soft ring-1 ring-rose-400/30 dark:border-rose-500/50">
          <div className="flex items-start gap-3">
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-300">
              <AlertTriangle className="h-4 w-4" />
              <span className="absolute inset-0 rounded-full bg-rose-500/25 animate-ping-ring" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-rose-600 dark:text-rose-300">
                {offlineServers.length} server{offlineServers.length === 1 ? '' : 's'} not responding
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {offlineServers
                  .map((server) => server.serverName)
                  .slice(0, 4)
                  .join(', ')}
                {offlineServers.length > 4 ? ` +${offlineServers.length - 4} more` : ''}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => refresh({ silent: true })} disabled={refreshing}>
                  <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
                  Ping again
                </Button>
                <Button size="sm" asChild>
                  <Link to="/servers" onClick={() => setToastOpen(false)}>
                    View details
                  </Link>
                </Button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setToastOpen(false)}
              aria-label="Dismiss server alert"
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default ServerOutagePopup;

