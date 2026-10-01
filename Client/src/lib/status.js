// Maps backend status enums onto the existing Badge variants / dot colours so
// the dashboard never renders an unknown status as if it were healthy.
export const BADGE_CLASS_BY_SERVER_STATUS = {
  Online: 'success',
  Warning: 'warning',
  Offline: 'danger',
  Maintenance: 'secondary',
  Unknown: 'outline',
};

export const BADGE_CLASS_BY_IT_STATUS = {
  Available: 'success',
  Busy: 'warning',
  Away: 'secondary',
  Offline: 'danger',
};

export const DOT_CLASS_BY_SERVER_STATUS = {
  Online: 'bg-emerald-500 dark:bg-emerald-400',
  Warning: 'bg-amber-500 dark:bg-amber-400',
  Offline: 'bg-rose-500 dark:bg-rose-400',
  Maintenance: 'bg-sky-500 dark:bg-sky-400',
  Unknown: 'bg-slate-400 dark:bg-slate-500',
};

export const serverStatusVariant = (status) => BADGE_CLASS_BY_SERVER_STATUS[status] || 'outline';
export const itStatusVariant = (status) => BADGE_CLASS_BY_IT_STATUS[status] || 'outline';
export const serverDotClass = (status) => DOT_CLASS_BY_SERVER_STATUS[status] || DOT_CLASS_BY_SERVER_STATUS.Unknown;

export const initialsOf = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || 'IT';
