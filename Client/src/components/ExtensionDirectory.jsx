import { useMemo, useState } from 'react';
import { AlertCircle, BadgeCheck, Building2, Check, Copy, Phone, RefreshCw, Search, Users, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useExtensionDirectory } from '@/hooks/useExtensionDirectory';

const formatClock = (date) =>
  date ? new Date(date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--';

// `tel:` only understands digits and a leading '+', so the pretty separators are
// stripped before the link is built.
const telHref = (value) => `tel:${String(value || '').replace(/[^\d+]/g, '')}`;

const lineMatches = (values, query) => values.some((value) => String(value ?? '').toLowerCase().includes(query));

function CopyNumberButton({ value, label }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard access is blocked on plain http:// origins; the number is still
      // readable on screen, so this is not worth an error toast.
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7"
      onClick={copy}
      title={copied ? 'Copied' : `Copy ${label}: ${value}`}
      aria-label={`Copy ${label} ${value}`}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

function SummaryTile({ icon: Icon, label, value }) {
  return (
    <Card className="border border-border/80 bg-card/80">
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold tracking-tight text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function MobileLink({ mobile }) {
  if (!mobile) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <a
      href={telHref(mobile)}
      className="inline-flex items-center gap-1.5 font-mono text-xs text-primary hover:underline"
      title={`Call ${mobile}`}
    >
      <Phone className="h-3.5 w-3.5" />
      {mobile}
    </a>
  );
}

function PabxBadges({ numbers }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {numbers.map((number) => (
        <Badge key={number} variant="secondary" className="font-mono text-[11px]">
          {number}
        </Badge>
      ))}
    </div>
  );
}

function PersonRow({ person }) {
  return (
    <div className="flex flex-col gap-2 border-t border-border/70 px-4 py-3 first:border-t-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 sm:flex-1">
        <p className="truncate text-sm font-medium text-foreground">{person.name}</p>
        {person.note && <p className="mt-0.5 text-[11px] text-amber-600 dark:text-amber-400">{person.note}</p>}
      </div>
      <MobileLink mobile={person.mobile} />
      <div className="flex items-center gap-1">
        <PabxBadges numbers={person.pabx} />
        <CopyNumberButton value={person.pabx.join(', ')} label={`extension for ${person.name}`} />
      </div>
    </div>
  );
}

// A bureau contact has no desk line, so the mobile number gets its own copy button.
function ContactRow({ contact }) {
  return (
    <div className="flex flex-col gap-2 border-t border-border/70 px-4 py-3 first:border-t-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 sm:flex-1">
        <p className="truncate text-sm font-medium text-foreground">{contact.name}</p>
        {contact.note && <p className="mt-0.5 text-[11px] text-amber-600 dark:text-amber-400">{contact.note}</p>}
      </div>
      <div className="flex items-center gap-1">
        <MobileLink mobile={contact.mobile} />
        <CopyNumberButton value={contact.mobile} label={`mobile for ${contact.name}`} />
      </div>
    </div>
  );
}

function CommonLineRow({ line }) {
  return (
    <div className="flex flex-col gap-2 border-t border-border/70 px-4 py-3 first:border-t-0 sm:flex-row sm:items-center sm:justify-between">
      <p className="min-w-0 truncate text-sm font-medium text-foreground sm:flex-1">{line.name}</p>
      <div className="flex items-center gap-1">
        <PabxBadges numbers={line.pabx} />
        <CopyNumberButton value={line.pabx.join(', ')} label={`extension for ${line.name}`} />
      </div>
    </div>
  );
}

function DirectoryCard({ title, countLabel, children }) {
  return (
    <Card className="overflow-hidden border border-border/80 bg-card/80">
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border/70 bg-muted/40 px-4 py-3">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <Badge variant="outline" className="shrink-0">
          {countLabel}
        </Badge>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

function DirectorySkeleton({ rows = 4 }) {
  return (
    <Card className="overflow-hidden border border-border/80 bg-card/80">
      <CardHeader className="border-b border-border/70 px-4 py-3">
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="h-10 animate-pulse rounded-lg bg-muted/40" />
        ))}
      </CardContent>
    </Card>
  );
}

export function ExtensionDirectory() {
  const { directory, summary, loading, refreshing, error, lastUpdated, refresh } = useExtensionDirectory();
  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim().toLowerCase();
  // `directory?.sections ?? []` only allocates a new array while the payload is
  // still null, so the memo deps below stay referentially stable once loaded.
  const sections = directory?.sections ?? [];
  const bureau = directory?.bureau ?? [];
  const common = directory?.common ?? [];

  const filteredSections = useMemo(() => {
    if (!normalizedQuery) return sections;
    return sections
      .map((section) => ({
        ...section,
        people: section.people.filter((person) =>
          lineMatches([person.name, person.mobile, section.section, ...person.pabx], normalizedQuery)
        ),
      }))
      .filter((section) => section.people.length > 0);
  }, [sections, normalizedQuery]);

  const filteredBureau = useMemo(
    () => (normalizedQuery ? bureau.filter((contact) => lineMatches([contact.name, contact.mobile], normalizedQuery)) : bureau),
    [bureau, normalizedQuery]
  );

  const filteredCommon = useMemo(
    () => (normalizedQuery ? common.filter((line) => lineMatches([line.name, ...line.pabx], normalizedQuery)) : common),
    [common, normalizedQuery]
  );

  const matchCount =
    filteredSections.reduce((total, section) => total + section.people.length, 0) +
    filteredBureau.length +
    filteredCommon.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Extension Directory</h2>
          <p className="text-sm text-muted-foreground">
            Office lines and mobile numbers from the printed “List of key persons (ITV)” notice board.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground">
            {loading ? 'Loading directory…' : `Updated ${formatClock(lastUpdated)}${refreshing ? ' · refreshing…' : ''}`}
          </p>
          <Button size="sm" variant="outline" onClick={() => refresh({ silent: true })} disabled={loading || refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <strong className="font-semibold">Directory error:</strong> {error}
            </span>
          </div>
          <Button size="sm" variant="outline" onClick={() => refresh()} disabled={refreshing}>
            Retry
          </Button>
        </div>
      )}

      {!loading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryTile icon={Users} label="Key persons" value={summary.keyPersons} />
          <SummaryTile icon={Building2} label="Sections / departments" value={summary.sections} />
          <SummaryTile icon={Phone} label="PABX lines" value={summary.pabxLines} />
          <SummaryTile icon={BadgeCheck} label="Rows in extension register" value={summary.registeredExtensions ?? '—'} />
        </div>
      )}

      {!loading && (
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-9 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Search name, mobile, or PABX extension"
            aria-label="Search the extension directory"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="grid items-start gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <DirectorySkeleton key={index} />
          ))}
        </div>
      ) : (
        <div className="grid items-start gap-4 xl:grid-cols-2">
          {filteredSections.map((section) => (
            <DirectoryCard
              key={section.section}
              title={section.section}
              countLabel={`${section.people.length} ${section.people.length === 1 ? 'person' : 'people'}`}
            >
              {section.people.map((person) => (
                <PersonRow key={`${section.section}-${person.name}-${person.pabx.join('-')}`} person={person} />
              ))}
            </DirectoryCard>
          ))}
        </div>
      )}

      {!loading && (filteredBureau.length > 0 || filteredCommon.length > 0) && (
        <div className="grid items-start gap-4 xl:grid-cols-2">
          {filteredBureau.length > 0 && (
            <DirectoryCard title="Bureau correspondents" countLabel={`${filteredBureau.length} contacts`}>
              {filteredBureau.map((contact) => (
                <ContactRow key={contact.name} contact={contact} />
              ))}
            </DirectoryCard>
          )}
          {filteredCommon.length > 0 && (
            <DirectoryCard title="Common & shared lines" countLabel={`${filteredCommon.length} entries`}>
              {filteredCommon.map((line) => (
                <CommonLineRow key={line.name} line={line} />
              ))}
            </DirectoryCard>
          )}
        </div>
      )}

      {!loading && normalizedQuery && matchCount === 0 && (
        <Card className="bg-card/80">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <Search className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No extension matches “{query.trim()}”.</p>
            <Button size="sm" variant="outline" onClick={() => setQuery('')}>
              Clear search
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && (summary.source || summary.personLines > 0) && (
        <p className="text-xs text-muted-foreground">
          {summary.source && `Source: ${summary.source}. `}
          {summary.personLines} desk lines, {summary.sharedLines} shared lines and {summary.bureauContacts} bureau mobiles.
          {summary.registeredExtensions != null && ` ${summary.registeredExtensions} rows in the extension register.`}
        </p>
      )}
    </div>
  );
}

export default ExtensionDirectory;
