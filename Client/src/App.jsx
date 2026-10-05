import { Link, Route, Routes } from 'react-router-dom';
import {
  AlertCircle,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Computer,
  LayoutDashboard,
  Loader2,
  LogOut,
  Moon,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Sun,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BrandBackdrop, BrandLogo } from '@/components/BrandLogo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ComputerInventory } from '@/components/ComputerInventory';
import { EmployeeDirectory } from '@/components/EmployeeDirectory';
import { ExtensionDirectory } from '@/components/ExtensionDirectory';
import { LoginPage } from '@/components/LoginPage';
import { ServerHealthPill, ServerOutagePopup } from '@/components/ServerHealth';
import { ServerStatusOverview } from '@/components/ServerStatusOverview';
import { useAuth } from '@/context/AuthContext';
import { useDashboardSummary } from '@/hooks/useDashboardSummary';
import { useTheme } from '@/hooks/useTheme';
import { initialsOf, itStatusVariant, serverDotClass, serverStatusVariant } from '@/lib/status';

const numberFormat = new Intl.NumberFormat('en-US');
const formatCount = (value) => numberFormat.format(Number(value) || 0);
const formatClock = (date) =>
  date ? new Date(date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--';

const relativeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const RELATIVE_UNITS = [
  ['year', 31557600000],
  ['month', 2629800000],
  ['week', 604800000],
  ['day', 86400000],
  ['hour', 3600000],
  ['minute', 60000],
];
const formatRelative = (value) => {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return null;
  const diffMs = timestamp - Date.now();
  const unit = RELATIVE_UNITS.find(([, ms]) => Math.abs(diffMs) >= ms) || RELATIVE_UNITS[RELATIVE_UNITS.length - 1];
  return relativeFormatter.format(Math.round(diffMs / unit[1]), unit[0]);
};

function StatCard({ label, value, hint, tone = 'success', icon: Icon, loading }) {
  return (
    <Card className="border border-border/80 bg-card/80">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            {loading ? (
              <div className="mt-3 h-9 w-20 animate-pulse rounded bg-muted" />
            ) : (
              <h3 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{formatCount(value)}</h3>
            )}
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4">
          {loading ? (
            <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
          ) : (
            <Badge variant={tone}>{hint}</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PanelState({ message }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function LoadingRows({ rows = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="h-14 animate-pulse rounded-lg bg-muted/40" />
      ))}
    </div>
  );
}

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Employees', path: '/employees', icon: Users },
  { name: 'Computers', path: '/computers', icon: Computer },
  { name: 'Extensions', path: '/extensions', icon: BriefcaseBusiness },
  { name: 'Servers', path: '/servers', icon: Server },
  { name: 'Reports', path: '/reports', icon: BarChart3 },
  { name: 'Activity Log', path: '/activity', icon: Bell },
];

const CARD_DEFINITIONS = [
  {
    key: 'totalEmployees',
    label: 'Total Employees',
    icon: Users,
    value: (s) => s.totalEmployees,
    hint: (s) => `${formatCount(s.formerEmployees)} former`,
    tone: () => 'secondary',
  },
  {
    key: 'activeEmployees',
    label: 'Active Employees',
    icon: ShieldCheck,
    value: (s) => s.activeEmployees,
    hint: (s) => `${formatCount(s.itTeamMembers)} in IT team`,
    tone: () => 'success',
  },
  {
    key: 'totalComputers',
    label: 'Total Computers',
    icon: Computer,
    value: (s) => s.totalComputers,
    hint: (s) => `${formatCount(s.availableComputers)} available`,
    tone: (s) => (s.availableComputers > 0 ? 'success' : 'warning'),
  },
  {
    key: 'onlineServers',
    label: 'Online Servers',
    icon: Server,
    value: (s) => s.onlineServers,
    hint: (s) => `${formatCount(s.offlineServers)} offline`,
    tone: (s) => (s.offlineServers > 0 ? 'warning' : 'success'),
  },
];

function DashboardPage() {
  const { summary, stats, loading, refreshing, error, lastUpdated, refresh } = useDashboardSummary();

  const utilization = summary?.computerStatus?.utilizationPercent ?? 0;
  const computerStatus = summary?.computerStatus;
  const servers = summary?.serverStatus ?? [];
  const itTeam = summary?.itTeam ?? [];
  const recentEmployees = summary?.recentEmployees ?? [];
  const isEmpty =
    !loading &&
    !error &&
    stats &&
    stats.totalEmployees === 0 &&
    stats.totalComputers === 0 &&
    stats.totalServers === 0;

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <strong className="font-semibold">API error:</strong> {error}
            </span>
          </div>
          <Button size="sm" variant="outline" onClick={() => refresh()} disabled={refreshing}>
            Retry
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {loading
            ? 'Loading live data from the API…'
            : `Last updated ${formatClock(lastUpdated)}${refreshing ? ' · refreshing…' : ''}`}
        </p>
        <Button size="sm" variant="outline" onClick={() => refresh({ silent: true })} disabled={loading || refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {isEmpty && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
          Connected to the API, but the database is empty. Run <code className="font-mono">npm run seed</code> in{' '}
          <code className="font-mono">backend/</code> to load sample assets.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {CARD_DEFINITIONS.map((definition) => (
          <StatCard
            key={definition.key}
            label={definition.label}
            icon={definition.icon}
            loading={loading || !stats}
            value={stats ? definition.value(stats) : 0}
            hint={stats ? definition.hint(stats) : ''}
            tone={stats ? definition.tone(stats) : 'secondary'}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Server Status</CardTitle>
            <CardDescription>Live office infrastructure health summary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <LoadingRows rows={3} />
            ) : servers.length === 0 ? (
              <PanelState message="No servers registered yet." />
            ) : (
              servers.map((server) => (
                <div
                  key={server.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-2.5 w-2.5 rounded-full ${serverDotClass(server.status)}`} />
                    <div>
                      <p className="font-medium text-foreground">{server.serverName}</p>
                      <p className="text-xs text-muted-foreground">
                        {[server.ipAddress, server.location].filter(Boolean).join(' · ') || 'No address recorded'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={serverStatusVariant(server.status)}>{server.status}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Computer Status</CardTitle>
            <CardDescription>Asset utilization overview</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-5 pb-6">
            {loading ? (
              <div className="h-40 w-40 animate-pulse rounded-full bg-muted/40" />
            ) : !computerStatus || computerStatus.total === 0 ? (
              <PanelState message="No computers registered yet." />
            ) : (
              <>
                <div
                  className="flex h-40 w-40 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(hsl(var(--primary)) 0% ${utilization}%, hsl(var(--muted)) ${utilization}% 100%)`,
                  }}
                >
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border border-border bg-background text-xl font-semibold text-foreground">
                    {utilization}%
                  </div>
                </div>
                <div className="grid w-full grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-semibold text-foreground">{formatCount(computerStatus.assigned)}</p>
                    <p className="text-xs text-muted-foreground">Assigned</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">{formatCount(computerStatus.available)}</p>
                    <p className="text-xs text-muted-foreground">Available</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">{formatCount(computerStatus.repair)}</p>
                    <p className="text-xs text-muted-foreground">Repair</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>IT Team</CardTitle>
            <CardDescription>Operations and support roster</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <LoadingRows rows={3} />
            ) : itTeam.length === 0 ? (
              <PanelState message="No IT team members yet — add employees with the 'IT Team Member' option." />
            ) : (
              itTeam.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {initialsOf(member.name)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.designation || 'IT Administrator'}</p>
                    </div>
                  </div>
                  <Badge variant={itStatusVariant(member.itStatus)}>{member.itStatus}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Employees</CardTitle>
            <CardDescription>New joiners and latest updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <LoadingRows rows={3} />
            ) : recentEmployees.length === 0 ? (
              <PanelState message="No employees registered yet." />
            ) : (
              recentEmployees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{employee.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[employee.employeeId, employee.designation].filter(Boolean).join(' · ') || 'No details recorded'}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant="outline">{employee.department}</Badge>
                    {formatRelative(employee.joiningDate) && (
                      <span className="text-[11px] text-muted-foreground">
                        joined {formatRelative(employee.joiningDate)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GenericPage({ title, description }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
          This section is ready for the full backend integration.
        </div>
      </CardContent>
    </Card>
  );
}

function EmployeesPage() {
  return <EmployeeDirectory />;
}

function ComputersPage() {
  return <ComputerInventory />;
}

function ExtensionsPage() {
  return <ExtensionDirectory />;
}

function ServersPage() {
  return <ServerStatusOverview />;
}

function ReportsPage() {
  return <GenericPage title="Reports" description="Inventory reports and export operations" />;
}

function ActivityPage() {
  return <GenericPage title="Activity Log" description="System events and operational history" />;
}

// Signed-in identity chip plus the sign-out control, shown in the header so the
// current operator is always visible on a shared office machine.
function UserMenu() {
  const { user, signOut } = useAuth();

  return (
    <div className="flex items-center gap-3">
      <div className="hidden items-center gap-3 sm:flex">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {initialsOf(user?.name)}
        </div>
        <div className="leading-tight">
          <p className="max-w-[160px] truncate text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-muted-foreground">{user?.designation || user?.department || 'IT Staff'}</p>
        </div>
        {user?.role ? <Badge variant="secondary">{user.role}</Badge> : null}
      </div>
      <Button variant="outline" size="sm" onClick={signOut}>
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </div>
  );
}

function App() {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, checking } = useAuth();

  // Validating a stored token on boot; showing the login screen early would
  // flash a spurious "please sign in" at a user who is still signed in.
  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) return <LoginPage />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Decorative brand plate spanning the whole dashboard, behind every panel. */}
      <BrandBackdrop />
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="w-full border-b border-border bg-card/85 backdrop-blur-xl lg:w-72 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3 p-6">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-background p-1.5 ring-1 ring-border">
              <BrandLogo className="h-full w-full" alt="Independent" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xl font-semibold tracking-tight">IT Operations</p>
              <p className="text-xs text-muted-foreground">Asset Control</p>
            </div>
          </div>

          <nav className="space-y-1 px-3 pb-6">
            {navItems.map(({ name, path, icon: Icon }) => (
              <Link key={path} to={path} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                <Icon className="h-4 w-4" />
                {name}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1">
          <header className="border-b border-border bg-card/85 backdrop-blur-xl">
            <div className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Internal Dashboard</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                  IT Management & Asset Control System
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleTheme}
                  aria-label="Toggle light and dark theme"
                  title="Toggle light and dark theme"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    className="h-10 w-72 rounded-md border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none ring-0 placeholder:text-muted-foreground"
                    placeholder="Search employee, asset, server"
                  />
                </div>
                <ServerHealthPill />
                <UserMenu />
              </div>
            </div>
          </header>

          <div className="p-6">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/computers" element={<ComputersPage />} />
              <Route path="/extensions" element={<ExtensionsPage />} />
              <Route path="/servers" element={<ServersPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/activity" element={<ActivityPage />} />
            </Routes>
          </div>
        </main>
      </div>

      {/* Site-wide outage alert: fires on any page the moment a host stops answering */}
      <ServerOutagePopup />
    </div>
  );
}

export default App;
