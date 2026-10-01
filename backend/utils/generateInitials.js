export const generateInitials = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'IT';
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('');
};
