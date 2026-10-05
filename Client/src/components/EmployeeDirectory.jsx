import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Eye, Mail, Pencil, Phone, Plus, RefreshCw, Search, Trash2, Users, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useEmployees } from '@/hooks/useEmployees';
import { getErrorMessage } from '@/lib/api';
import { initialsOf, itStatusVariant } from '@/lib/status';

const formatClock = (date) =>
  date ? new Date(date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--';

const EMPLOYMENT_STATUSES = ['Active', 'Former Employee', 'On Leave', 'Suspended', 'Inactive'];
const IT_STATUSES = ['Available', 'Busy', 'Away', 'Offline'];
const ROLE_OPTIONS = ['Super Admin', 'IT Admin', 'IT Support', 'Viewer'];
const EMPLOYMENT_VARIANT = {
  Active: 'success',
  'Former Employee': 'secondary',
  'On Leave': 'warning',
  Suspended: 'danger',
  Inactive: 'outline',
};
const inputCls = 'h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none';
const OMIT_BLANK = new Set(['employeeId', 'username', 'email', 'joiningDate', 'leavingDate']);

function toPayload(form, clearBlank) {
  const out = {};
  Object.entries(form).forEach(([k, v]) => {
    if (k === 'isITTeam') {
      out[k] = Boolean(v);
      return;
    }
    const t = typeof v === 'string' ? v.trim() : v;
    if (t === '' || t == null) {
      if (clearBlank && !OMIT_BLANK.has(k)) out[k] = '';
      return;
    }
    out[k] = t;
  });
  return out;
}

const dateForInput = (v) => {
  if (!v) return '';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
};

const baseOf = (e) => ({
  employeeId: e.employeeId ?? '',
  name: e.name ?? '',
  email: e.email ?? '',
  designation: e.designation ?? '',
  department: e.department ?? '',
  phone: e.phone ?? '',
  extensionNumber: e.extensionNumber ?? '',
  officeLocation: e.officeLocation ?? '',
  remarks: e.remarks ?? '',
  isITTeam: Boolean(e.isITTeam),
});

const fullOf = (e) => ({
  ...baseOf(e),
  username: e.username ?? '',
  role: e.role ?? 'Viewer',
  employmentStatus: e.employmentStatus ?? 'Active',
  itStatus: e.itStatus ?? 'Available',
  joiningDate: dateForInput(e.joiningDate),
  leavingDate: dateForInput(e.leavingDate),
});

const EMPTY = { ...baseOf({}), username: '', role: 'Viewer', employmentStatus: 'Active', itStatus: 'Available', joiningDate: '', leavingDate: '' };

function Field({ label, htmlFor, req, err, children }) {
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <label htmlFor={htmlFor} className="font-medium text-foreground">
        {label}
        {req && <span className="text-rose-500"> *</span>}
      </label>
      {children}
      {err && <span className="text-xs text-rose-600">{err}</span>}
    </div>
  );
}

function Avatar({ name }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
      {initialsOf(name)}
    </span>
  );
}

function EmpForm({ open, employee, onOpenChange, onSubmit }) {
  const [form, setForm] = useState(EMPTY);
  const [errs, setErrs] = useState({});
  const [submitErr, setSubmitErr] = useState(null);
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(employee);

  useEffect(() => {
    if (!open) return;
    setForm(employee ? fullOf(employee) : EMPTY);
    setErrs({});
    setSubmitErr(null);
  }, [open, employee]);

  const upd = (k) => (ev) => {
    const v = ev.target.type === 'checkbox' ? ev.target.checked : ev.target.value;
    setForm((p) => ({ ...p, [k]: v }));
    setErrs((p) => (p[k] ? { ...p, [k]: undefined } : p));
  };

  const valid = () => {
    const n = {};
    if (!form.name.trim()) n.name = 'Name is required.';
    if (!form.employeeId.trim() && !isEdit) n.employeeId = 'Employee ID is required.';
    if (!form.username.trim() && !isEdit) n.username = 'Username is required.';
    if (!form.email.trim()) n.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) n.email = 'Enter a valid email address.';
    setErrs(n);
    return Object.keys(n).length === 0;
  };

  const reset = () => {
    setForm(EMPTY);
    setErrs({});
    setSubmitErr(null);
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (saving || !valid()) return;
    setSaving(true);
    setSubmitErr(null);
    try {
      await onSubmit(toPayload(form, isEdit));
      reset();
      onOpenChange(false);
    } catch (e) {
      setSubmitErr(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const change = (o) => {
    if (!o) reset();
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit employee' : 'Add an employee'}</DialogTitle>
          <DialogDescription>IT Team members appear in the IT Team section.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          {submitErr && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{submitErr}</span>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Employee ID" htmlFor="e-eid" req={!isEdit} err={errs.employeeId}>
              <input id="e-eid" className={inputCls} value={form.employeeId} onChange={upd('employeeId')} disabled={isEdit} />
            </Field>
            <Field label="Full name" htmlFor="e-name" req err={errs.name}>
              <input id="e-name" className={inputCls} value={form.name} onChange={upd('name')} />
            </Field>
            <Field label="Username" htmlFor="e-un" req={!isEdit} err={errs.username}>
              <input id="e-un" className={inputCls} value={form.username} onChange={upd('username')} disabled={isEdit} />
            </Field>
            <Field label="Email" htmlFor="e-em" req err={errs.email}>
              <input id="e-em" type="email" className={inputCls} value={form.email} onChange={upd('email')} />
            </Field>
            <Field label="Designation" htmlFor="e-des">
              <input id="e-des" className={inputCls} value={form.designation} onChange={upd('designation')} />
            </Field>
            <Field label="Department" htmlFor="e-dep">
              <input id="e-dep" className={inputCls} value={form.department} onChange={upd('department')} />
            </Field>
            <Field label="Phone" htmlFor="e-ph">
              <input id="e-ph" className={inputCls} value={form.phone} onChange={upd('phone')} />
            </Field>
            <Field label="Extension" htmlFor="e-ex">
              <input id="e-ex" className={inputCls} value={form.extensionNumber} onChange={upd('extensionNumber')} />
            </Field>
            <Field label="Office" htmlFor="e-off">
              <input id="e-off" className={inputCls} value={form.officeLocation} onChange={upd('officeLocation')} />
            </Field>
            <Field label="Role" htmlFor="e-role">
              <select id="e-role" className={inputCls} value={form.role} onChange={upd('role')}>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </Field>
            <Field label="Employment" htmlFor="e-es">
              <select id="e-es" className={inputCls} value={form.employmentStatus} onChange={upd('employmentStatus')}>
                {EMPLOYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="IT status" htmlFor="e-is">
              <select id="e-is" className={inputCls} value={form.itStatus} onChange={upd('itStatus')}>
                {IT_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Joining" htmlFor="e-jd">
              <input id="e-jd" type="date" className={inputCls} value={form.joiningDate} onChange={upd('joiningDate')} />
            </Field>
            <Field label="Leaving" htmlFor="e-ld">
              <input id="e-ld" type="date" className={inputCls} value={form.leavingDate} onChange={upd('leavingDate')} />
            </Field>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isITTeam} onChange={upd('isITTeam')} className="h-4 w-4" />
            IT Team member
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => change(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving' : isEdit ? 'Save changes' : 'Save employee'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EmpView({ open, employee, onOpenChange }) {
  const rows = employee
    ? [
        ['Employee ID', employee.employeeId],
        ['Name', employee.name],
        ['Username', employee.username],
        ['Email', employee.email],
        ['Designation', employee.designation],
        ['Department', employee.department],
        ['Phone', employee.phone],
        ['Extension', employee.extensionNumber],
        ['Office', employee.officeLocation],
        ['Role', employee.role],
        ['Employment', employee.employmentStatus],
        ['IT status', employee.itStatus],
        ['IT Team', employee.isITTeam ? 'Yes' : 'No'],
      ]
    : [];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{employee?.name || 'Employee'}</DialogTitle>
          <DialogDescription>Full record.</DialogDescription>
        </DialogHeader>
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {rows.map(([l, v]) => (
            <div key={l} className="flex flex-col gap-0.5 border-b border-border/60 pb-2">
              <dt className="text-xs uppercase text-muted-foreground">{l}</dt>
              <dd className="text-sm">{v || '-'}</dd>
            </div>
          ))}
        </dl>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EmployeeDirectory() {
  const { employees, itTeam, loading, refreshing, error, lastUpdated, refresh, createEmployee, updateEmployee, deleteEmployee } =
    useEmployees();
  const [q, setQ] = useState('');
  const [dlg, setDlg] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [pend, setPend] = useState(null);
  const [delBusy, setDelBusy] = useState(false);
  const [delErr, setDelErr] = useState(null);
  const [notice, setNotice] = useState(null);

  const doAdd = () => {
    setEditing(null);
    setDlg(true);
  };
  const doEdit = (e) => {
    setEditing(e);
    setDlg(true);
  };
  const submit = async (p) => {
    if (editing) {
      const u = await updateEmployee(editing._id || editing.employeeId, p);
      setNotice('Updated ' + (u?.name || ''));
      return u;
    }
    const c = await createEmployee(p);
    setNotice('Added ' + (c?.name || ''));
    return c;
  };
  const confirmDel = async () => {
    if (!pend || delBusy) return;
    setDelBusy(true);
    setDelErr(null);
    try {
      await deleteEmployee(pend._id || pend.employeeId);
      setNotice('Deleted ' + (pend.name || ''));
      setPend(null);
    } catch (e) {
      setDelErr(getErrorMessage(e));
    } finally {
      setDelBusy(false);
    }
  };

  const nq = q.trim().toLowerCase();
  const list = useMemo(() => {
    if (!nq) return employees;
    return employees.filter((e) =>
      [e.employeeId, e.name, e.username, e.email, e.designation, e.department, e.phone, e.extensionNumber].some((v) =>
        String(v ?? '').toLowerCase().includes(nq)
      )
    );
  }, [employees, nq]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Employees</h2>
          <p className="text-xs text-muted-foreground">{loading ? 'Loading…' : 'Updated ' + formatClock(lastUpdated)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => refresh({ silent: true })} disabled={loading || refreshing}>
            <RefreshCw className="h-4 w-4" />Refresh
          </Button>
          <Button size="sm" onClick={doAdd}><Plus className="h-4 w-4" />Add Employee</Button>
        </div>
      </div>
      {error && <div className="rounded-lg border p-3 text-sm">API error: {error}</div>}
      {notice && <div className="rounded-lg border p-3 text-sm">{notice}</div>}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">IT Team Members</h3>
          <Badge variant="outline">{loading ? '..' : itTeam.length + ' members'}</Badge>
        </div>
        <div className="p-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading team</p>
          ) : itTeam.length === 0 ? (
            <p className="text-sm text-muted-foreground">No IT team members yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {itTeam.map((m) => (
                <div key={m._id || m.employeeId} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.name} />
                    <div>
                      <p className="font-medium">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{[m.designation, m.phone].filter(Boolean).join(' - ') || m.email}</p>
                    </div>
                  </div>
                  <Badge variant={itStatusVariant(m.itStatus)}>{m.itStatus || 'Available'}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(ev) => setQ(ev.target.value)} className={inputCls + ' pl-9'} placeholder="Search" aria-label="Search" />
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading employees</p>
      ) : list.length === 0 ? (
        <p className="text-sm text-muted-foreground">No employees.</p>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead><tr><th className="px-4 py-3 text-left">Employee</th><th className="px-4 py-3 text-left">Contact</th></tr></thead>
              <tbody>
                {list.map((e) => (
                  <tr key={e._id || e.employeeId} className="border-t">
                    <td className="px-4 py-3"><p className="font-medium">{e.name}</p><p className="text-xs">{e.employeeId}</p></td>
                    <td className="px-4 py-3 text-xs">{e.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <EmpForm open={dlg} employee={editing} onOpenChange={setDlg} onSubmit={submit} />
      <EmpView open={Boolean(viewing)} employee={viewing} onOpenChange={(o) => !o && setViewing(null)} />
      <Dialog open={Boolean(pend)} onOpenChange={(o) => !o && setPend(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-center">Delete?</DialogTitle>
            <DialogDescription className="text-center">{pend?.name || ''}</DialogDescription>
          </DialogHeader>
          {delErr && <div className="text-sm text-rose-600">{delErr}</div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPend(null)} disabled={delBusy}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDel} disabled={delBusy}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
