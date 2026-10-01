import {
  Boxes,
  Cloud,
  Database,
  Gauge,
  Globe,
  HardDrive,
  Mail,
  Printer,
  Radio,
  Router,
  Server,
  ServerCog,
  ShieldCheck,
} from 'lucide-react';

// One recognisable glyph per role, so a wall of tiles can be scanned at a glance
// instead of fourteen identical server boxes. Tints stay away from emerald/rose
// because those two colours mean Online / Offline in this grid.
const TYPE_STYLES = {
  'Domain Controller': { Icon: ShieldCheck, tile: 'bg-sky-500/10 text-sky-600 dark:text-sky-300' },
  'Database Server': { Icon: Database, tile: 'bg-violet-500/10 text-violet-600 dark:text-violet-300' },
  'File Server': { Icon: HardDrive, tile: 'bg-amber-500/10 text-amber-600 dark:text-amber-300' },
  'Web Server': { Icon: Globe, tile: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-300' },
  'Application Server': { Icon: ServerCog, tile: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300' },
  'Mail Server': { Icon: Mail, tile: 'bg-pink-500/10 text-pink-600 dark:text-pink-300' },
  'Print Server': { Icon: Printer, tile: 'bg-orange-500/10 text-orange-600 dark:text-orange-300' },
  'Backup Server': { Icon: Cloud, tile: 'bg-teal-500/10 text-teal-600 dark:text-teal-300' },
  'Proxy Server': { Icon: Router, tile: 'bg-blue-500/10 text-blue-600 dark:text-blue-300' },
  'Virtualization Host': { Icon: Boxes, tile: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-300' },
};

// Name wins over the recorded type when it is more specific than "Application
// Server" — that is what makes DC-1, SQL and GV Core read differently.
const NAME_RULES = [
  [/\bdc[-]?\d?\b/i, { Icon: ShieldCheck, tile: 'bg-sky-500/10 text-sky-600 dark:text-sky-300' }],
  [/\bsql\b/i, { Icon: Database, tile: 'bg-violet-500/10 text-violet-600 dark:text-violet-300' }],
  [/\bftp\b/i, { Icon: HardDrive, tile: 'bg-amber-500/10 text-amber-600 dark:text-amber-300' }],
  [/\bcore\b/i, { Icon: Router, tile: 'bg-blue-500/10 text-blue-600 dark:text-blue-300' }],
  [/\b(fsm|x?re[-]?\d*)\b/i, { Icon: Radio, tile: 'bg-teal-500/10 text-teal-600 dark:text-teal-300' }],
  [/\bdse\b/i, { Icon: ServerCog, tile: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300' }],
  [/\bdashboard\b/i, { Icon: Gauge, tile: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-300' }],
  [/\b(mail|smtp|exchange)\b/i, { Icon: Mail, tile: 'bg-pink-500/10 text-pink-600 dark:text-pink-300' }],
  [/\b(print)\b/i, { Icon: Printer, tile: 'bg-orange-500/10 text-orange-600 dark:text-orange-300' }],
  [/\b(backup|nas)\b/i, { Icon: Cloud, tile: 'bg-teal-500/10 text-teal-600 dark:text-teal-300' }],
  [/\b(vmware|esxi|hyper-?v|virtual)\b/i, { Icon: Boxes, tile: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-300' }],
];

const FALLBACK = { Icon: Server, tile: 'bg-primary/10 text-primary' };

/**
 * Resolves the icon + tile tint for a monitored host.
 * Order: name keyword (most specific) → recorded serverType → generic server.
 */
export function resolveServerIcon(server) {
  const name = `${server?.serverName || ''} ${server?.ipAddress || ''}`;
  const byName = NAME_RULES.find(([pattern]) => pattern.test(name));
  if (byName) return byName[1];

  const byType = TYPE_STYLES[server?.serverType];
  if (byType) return byType;

  return FALLBACK;
}

export default resolveServerIcon;
