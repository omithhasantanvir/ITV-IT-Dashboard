import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Computer,
  Eye,
  HardDrive,
  Laptop,
  Monitor,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
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
import { useComputers } from '@/hooks/useComputers';
import { getErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

const formatClock = (date) =>
  date ? new Date(date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--';

// Option lists mirror the Computer schema enums plus the seed values, so the
// form never offers a value the backend will reject.
const COMPUTER_TYPES = ['Desktop', 'Laptop'];
const COMPUTER_STATUSES = ['Available', 'Assigned', 'Repair', 'Maintenance', 'Retired', 'Lost', 'Disposed'];
const COMPUTER_CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor'];
const WARRANTY_OPTIONS = ['Active', 'Expired', 'Extended'];
const DEPARTMENT_SUGGESTIONS = ['HR', 'Finance', 'Operations', 'Sales', 'Support', 'Logistics', 'Information Technology'];
const LOCATION_SUGGESTIONS = ['Floor 1', 'Floor 2', 'Floor 3', 'Server Room', 'Head Office'];

const STATUS_VARIANT = {
  Available: 'success',
  Assigned: 'default',
  Repair: 'warning',
  Maintenance: 'warning',
  Retired: 'secondary',
  Lost: 'danger',
  Disposed: 'danger',
};

const CONDITION_VARIANT = { Excellent: 'success', Good: 'secondary', Fair: 'warning', Poor: 'danger' };

// One glyph per asset type so a desktop and laptop are told apart at a glance in
// the register. Unknown types fall back to the desktop glyph.
const TYPE_ICONS = { Desktop: Computer, Laptop: Laptop };

function TypeIcon({ type }) {
  const Icon = TYPE_ICONS[type] || Computer;
  return <Icon className="h-4 w-4" />;
}

const EMPTY_FORM = {
  assetId: '',
  computerType: 'Desktop',
  brand: '',
  model: '',
  serialNumber: '',
  processor: '',
  ram: '',
  storage: '',
  monitor: '',
  operatingSystem: '',
  macAddress: '',
  ipAddress: '',
  purchaseDate: '',
  warranty: '',
  location: '',
  department: '',
  status: 'Available',
  condition: 'Good',
  remarks: '',
};

const fieldClass =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring';

// Unique/date fields that must be omitted (never sent as "") when blank:
// `serialNumber` is unique (two computers with an empty serial would collide),
// `assetId`/`barcode` are unique + required, and `purchaseDate` is a Date so ""
// would fail the cast.
const OMIT_WHEN_BLANK = new Set(['assetId', 'barcode', 'serialNumber', 'purchaseDate']);

// Serialises the form for the API. On create, blanks are dropped. On update
// (`clearBlank`), blanks for optional fields are sent as "" so clearing a field
// actually persists, while the protected fields above are still omitted.
function buildPayload(form, { clearBlank = false } = {}) {
  const payload = {};
  Object.entries(form).forEach(([key, value]) => {
    const trimmed = typeof value === 'string' ? value.trim() : value;
    const blank = trimmed === '' || trimmed == null;
    if (blank) {
      if (clearBlank && !OMIT_WHEN_BLANK.has(key)) payload[key] = '';
      return;
    }
    payload[key] = trimmed;
  });
  return payload;
}

// Converts a stored purchaseDate (ISO string) to the yyyy-mm-dd an
// <input type="date"> expects, then maps a saved record onto the form shape.
const toDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};

const formFromComputer = (computer) => ({
  assetId: computer.assetId ?? '',
  computerType: computer.computerType ?? 'Desktop',
  brand: computer.brand ?? '',
  model: computer.model ?? '',
  serialNumber: computer.serialNumber ?? '',
  processor: computer.processor ?? '',
  ram: computer.ram ?? '',
  storage: computer.storage ?? '',
  monitor: computer.monitor ?? '',
  operatingSystem: computer.operatingSystem ?? '',
  macAddress: computer.macAddress ?? '',
  ipAddress: computer.ipAddress ?? '',
  purchaseDate: toDateInput(computer.purchaseDate),
  warranty: computer.warranty ?? '',
  location: computer.location ?? '',
  department: computer.department ?? '',
  status: computer.status ?? 'Available',
  condition: computer.condition ?? 'Good',
  remarks: computer.remarks ?? '',
});

function Field({ label, htmlFor, required, error, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <label htmlFor={htmlFor} className="font-medium text-foreground">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </label>
      {children}
      {error ? (
        <span className="text-xs text-rose-600 dark:text-rose-400">{error}</span>
      ) : hint ? (
        <span className="text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </div>
  );
}

function SummaryTile({ icon: Icon, label, value, tone = 'default' }) {
  const toneClass = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  }[tone];

  return (
    <Card className="border border-border/80 bg-card/80">
      <CardContent className="flex items-center gap-3 p-4">
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', toneClass)}>
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

function ComputerFormDialog({ open, computer, onOpenChange, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(computer);

  // Prefill from the record being edited (or clear for "add") each time the
  // dialog opens, so a freshly-opened form never shows stale values.
  useEffect(() => {
    if (!open) return;
    setForm(computer ? formFromComputer(computer) : EMPTY_FORM);
    setErrors({});
    setSubmitError(null);
  }, [open, computer]);

  const update = (key) => (event) => {
    const { value } = event.target;
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => (previous[key] ? { ...previous, [key]: undefined } : previous));
  };

  const validate = () => {
    const next = {};
    if (!form.computerType) next.computerType = 'Choose a computer type.';
    if (!form.brand.trim()) next.brand = 'Brand is required.';
    if (!form.model.trim()) next.model = 'Model is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const reset = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setSubmitError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving || !validate()) return;
    setSaving(true);
    setSubmitError(null);
    try {
      await onSubmit(buildPayload(form, { clearBlank: isEditing }));
      reset();
      onOpenChange(false);
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChange = (nextOpen) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit computer' : 'Add a computer'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Update the details for ${computer?.assetId || 'this computer'}.`
              : 'Register a desktop or laptop in the asset inventory.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {submitError && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Asset ID" htmlFor="computer-assetId" hint="Leave blank to auto-generate (PC-DHK-####).">
              <input
                id="computer-assetId"
                className={fieldClass}
                value={form.assetId}
                onChange={update('assetId')}
                placeholder="PC-DHK-0001"
              />
            </Field>
            <Field label="Computer type" htmlFor="computer-computerType" required error={errors.computerType}>
              <select
                id="computer-computerType"
                className={fieldClass}
                value={form.computerType}
                onChange={update('computerType')}
              >
                {COMPUTER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Brand" htmlFor="computer-brand" required error={errors.brand}>
              <input
                id="computer-brand"
                className={fieldClass}
                value={form.brand}
                onChange={update('brand')}
                placeholder="Dell, HP, Lenovo…"
              />
            </Field>
            <Field label="Model" htmlFor="computer-model" required error={errors.model}>
              <input
                id="computer-model"
                className={fieldClass}
                value={form.model}
                onChange={update('model')}
                placeholder="OptiPlex 7090"
              />
            </Field>
            <Field label="Serial number" htmlFor="computer-serialNumber" hint="Must be unique across the register.">
              <input
                id="computer-serialNumber"
                className={fieldClass}
                value={form.serialNumber}
                onChange={update('serialNumber')}
                placeholder="SN-1000"
              />
            </Field>
            <Field label="Operating system" htmlFor="computer-operatingSystem">
              <input
                id="computer-operatingSystem"
                className={fieldClass}
                value={form.operatingSystem}
                onChange={update('operatingSystem')}
                placeholder="Windows 11 Pro"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Processor" htmlFor="computer-processor">
              <input id="computer-processor" className={fieldClass} value={form.processor} onChange={update('processor')} placeholder="i5-11500" />
            </Field>
            <Field label="RAM" htmlFor="computer-ram">
              <input id="computer-ram" className={fieldClass} value={form.ram} onChange={update('ram')} placeholder="16GB" />
            </Field>
            <Field label="Storage" htmlFor="computer-storage">
              <input id="computer-storage" className={fieldClass} value={form.storage} onChange={update('storage')} placeholder="512GB SSD" />
            </Field>
            <Field label="Monitor" htmlFor="computer-monitor">
              <input id="computer-monitor" className={fieldClass} value={form.monitor} onChange={update('monitor')} placeholder="Dell P2422H" />
            </Field>
            <Field label="MAC address" htmlFor="computer-macAddress">
              <input id="computer-macAddress" className={fieldClass} value={form.macAddress} onChange={update('macAddress')} placeholder="00:1A:2B:3C:4D:5E" />
            </Field>
            <Field label="IP address" htmlFor="computer-ipAddress">
              <input id="computer-ipAddress" className={fieldClass} value={form.ipAddress} onChange={update('ipAddress')} placeholder="192.168.10.100" />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Status" htmlFor="computer-status">
              <select id="computer-status" className={fieldClass} value={form.status} onChange={update('status')}>
                {COMPUTER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Condition" htmlFor="computer-condition">
              <select id="computer-condition" className={fieldClass} value={form.condition} onChange={update('condition')}>
                {COMPUTER_CONDITIONS.map((condition) => (
                  <option key={condition} value={condition}>
                    {condition}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Department" htmlFor="computer-department">
              <input id="computer-department" list="computer-departments" className={fieldClass} value={form.department} onChange={update('department')} placeholder="Operations" />
              <datalist id="computer-departments">
                {DEPARTMENT_SUGGESTIONS.map((department) => (
                  <option key={department} value={department} />
                ))}
              </datalist>
            </Field>
            <Field label="Location" htmlFor="computer-location">
              <input id="computer-location" list="computer-locations" className={fieldClass} value={form.location} onChange={update('location')} placeholder="Floor 2" />
              <datalist id="computer-locations">
                {LOCATION_SUGGESTIONS.map((location) => (
                  <option key={location} value={location} />
                ))}
              </datalist>
            </Field>
            <Field label="Warranty" htmlFor="computer-warranty">
              <select id="computer-warranty" className={fieldClass} value={form.warranty} onChange={update('warranty')}>
                <option value="">Not set</option>
                {WARRANTY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Purchase date" htmlFor="computer-purchaseDate">
              <input id="computer-purchaseDate" type="date" className={fieldClass} value={form.purchaseDate} onChange={update('purchaseDate')} />
            </Field>
          </div>

          <Field label="Remarks" htmlFor="computer-remarks">
            <textarea
              id="computer-remarks"
              rows={3}
              className={cn(fieldClass, 'h-auto py-2')}
              value={form.remarks}
              onChange={update('remarks')}
              placeholder="Optional notes — warranty provider, accessories, condition details…"
            />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Save computer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Read-only counterpart to the form dialog: every stored field for one asset.
function ComputerViewDialog({ open, computer, onOpenChange }) {
  const rows = computer
    ? [
        ['Asset ID', computer.assetId],
        ['Computer type', computer.computerType],
        ['Brand', computer.brand],
        ['Model', computer.model],
        ['Serial number', computer.serialNumber],
        ['Operating system', computer.operatingSystem],
        ['Processor', computer.processor],
        ['RAM', computer.ram],
        ['Storage', computer.storage],
        ['Monitor', computer.monitor],
        ['MAC address', computer.macAddress],
        ['IP address', computer.ipAddress],
        ['Status', computer.status],
        ['Condition', computer.condition],
        ['Department', computer.department],
        ['Location', computer.location],
        ['Warranty', computer.warranty],
        ['Purchase date', computer.purchaseDate ? toDateInput(computer.purchaseDate) : ''],
        ['Remarks', computer.remarks],
      ]
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{computer?.assetId ? `Computer ${computer.assetId}` : 'Computer details'}</DialogTitle>
          <DialogDescription>Full asset record.</DialogDescription>
        </DialogHeader>

        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-0.5 border-b border-border/60 pb-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
              <dd className="break-words text-sm text-foreground">{value || '—'}</dd>
            </div>
          ))}
        </dl>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ComputerInventory() {
  const { computers, loading, refreshing, error, lastUpdated, refresh, createComputer, updateComputer, deleteComputer } = useComputers();
  const [query, setQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [notice, setNotice] = useState(null);

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (computer) => {
    setEditing(computer);
    setDialogOpen(true);
  };

  const openView = (computer) => setViewing(computer);

  const requestDelete = (computer) => {
    setDeleteError(null);
    setPendingDelete(computer);
  };

  const closeDelete = () => {
    setPendingDelete(null);
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteComputer(pendingDelete._id || pendingDelete.assetId);
      setNotice(`Computer ${pendingDelete.assetId || ''} deleted.`.replace(/\s+/g, ' ').trim());
      setPendingDelete(null);
    } catch (requestError) {
      setDeleteError(getErrorMessage(requestError));
    } finally {
      setDeleting(false);
    }
  };

  const stats = useMemo(
    () => ({
      total: computers.length,
      available: computers.filter((computer) => computer.status === 'Available').length,
      assigned: computers.filter((computer) => computer.status === 'Assigned').length,
      attention: computers.filter((computer) => computer.status === 'Repair' || computer.status === 'Maintenance').length,
    }),
    [computers],
  );

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!normalizedQuery) return computers;
    return computers.filter((computer) =>
      [
        computer.assetId,
        computer.computerType,
        computer.brand,
        computer.model,
        computer.serialNumber,
        computer.monitor,
        computer.ipAddress,
        computer.macAddress,
        computer.department,
        computer.location,
        computer.status,
      ].some((value) => String(value ?? '').toLowerCase().includes(normalizedQuery)),
    );
  }, [computers, normalizedQuery]);

  const handleSubmit = async (payload) => {
    if (editing) {
      const updated = await updateComputer(editing._id || editing.assetId, payload);
      setNotice(`Computer ${updated?.assetId || editing.assetId || ''} updated.`.replace(/\s+/g, ' ').trim());
      return updated;
    }
    const created = await createComputer(payload);
    setNotice(`Computer ${created?.assetId || ''} added to the inventory.`.replace(/\s+/g, ' ').trim());
    return created;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Computer inventory</h2>
          <p className="text-xs text-muted-foreground">
            {loading ? 'Loading computers…' : `Last updated ${formatClock(lastUpdated)}${refreshing ? ' · refreshing…' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => refresh({ silent: true })} disabled={loading || refreshing}>
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            Refresh
          </Button>
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Computer
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <strong className="font-semibold">API error:</strong> {error}
            </span>
          </div>
          <Button size="sm" variant="outline" onClick={() => refresh({ silent: true })} disabled={refreshing}>
            Retry
          </Button>
        </div>
      )}

      {notice && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{notice}</span>
          </div>
          <button type="button" onClick={() => setNotice(null)} className="rounded p-1 hover:bg-emerald-500/10" aria-label="Dismiss notification">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryTile icon={Monitor} label="Total computers" value={stats.total} />
        <SummaryTile icon={CheckCircle2} label="Available" value={stats.available} tone="success" />
        <SummaryTile icon={HardDrive} label="Assigned" value={stats.assigned} />
        <SummaryTile
          icon={Wrench}
          label="Needs attention"
          value={stats.attention}
          tone={stats.attention > 0 ? 'warning' : 'success'}
        />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-9 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Search asset, brand, serial, IP, department…"
          aria-label="Search the computer inventory"
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


      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-lg bg-muted/40" />
          ))}
        </div>
      ) : computers.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-10 text-center">
          <Monitor className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No computers registered yet.</p>
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add the first computer
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No computers match “{query.trim()}”.
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Asset</th>
                  <th className="px-4 py-3 font-medium">Device</th>
                  <th className="px-4 py-3 font-medium">Serial</th>
                  <th className="px-4 py-3 font-medium">Network</th>
                  <th className="px-4 py-3 font-medium">Assignment</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Condition</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((computer) => (
                  <tr key={computer._id || computer.assetId} className="border-b border-border/60 last:border-0 hover:bg-muted/30">

                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <TypeIcon type={computer.computerType} />
                        </span>
                        <div>
                          <p className="font-medium text-foreground">{computer.assetId}</p>
                          <p className="text-xs text-muted-foreground">{computer.computerType || 'Desktop'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="text-foreground">{[computer.brand, computer.model].filter(Boolean).join(' ') || '—'}</p>
                      <p className="text-xs text-muted-foreground">
                        {[computer.processor, computer.ram, computer.storage].filter(Boolean).join(' · ') || '—'}
                      </p>
                      {computer.monitor && (
                        <p className="text-xs text-muted-foreground">Monitor: {computer.monitor}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top font-mono text-xs text-muted-foreground">{computer.serialNumber || '—'}</td>
                    <td className="px-4 py-3 align-top">
                      <p className="font-mono text-xs text-foreground">{computer.ipAddress || '—'}</p>
                      <p className="font-mono text-xs text-muted-foreground">{computer.macAddress || '—'}</p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="text-foreground">{computer.department || '—'}</p>
                      <p className="text-xs text-muted-foreground">{computer.location || '—'}</p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Badge variant={STATUS_VARIANT[computer.status] || 'outline'}>{computer.status || 'Unknown'}</Badge>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Badge variant={CONDITION_VARIANT[computer.condition] || 'outline'}>{computer.condition || '—'}</Badge>
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          title={`View ${computer.assetId}`}
                          aria-label={`View computer ${computer.assetId}`}
                          onClick={() => openView(computer)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          title={`Edit ${computer.assetId}`}
                          aria-label={`Edit computer ${computer.assetId}`}
                          onClick={() => openEdit(computer)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 dark:text-rose-400"
                          title={`Delete ${computer.assetId}`}
                          aria-label={`Delete computer ${computer.assetId}`}
                          onClick={() => requestDelete(computer)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ComputerFormDialog open={dialogOpen} computer={editing} onOpenChange={setDialogOpen} onSubmit={handleSubmit} />

      <ComputerViewDialog open={Boolean(viewing)} computer={viewing} onOpenChange={(nextOpen) => !nextOpen && setViewing(null)} />

      <Dialog open={Boolean(pendingDelete)} onOpenChange={(nextOpen) => !nextOpen && closeDelete()}>
        <DialogContent className="border-rose-300 sm:max-w-lg dark:border-rose-500/50">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-300">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center">Delete computer?</DialogTitle>
            <DialogDescription className="text-center">
              This permanently removes{' '}
              <span className="font-medium text-foreground">{pendingDelete?.assetId || 'this computer'}</span> from the asset
              register. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDelete} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ComputerInventory;

