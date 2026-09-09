function todayMidnight() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// Costruisce un Date locale (non UTC) a partire da 'YYYY-MM-DD', per evitare
// spostamenti di un giorno legati al fuso orario.
export function isoToDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function dateToISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = isoToDate(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - todayMidnight().getTime()) / 86400000);
}

export function statusFor(days, threshold) {
  if (days < 0) return 'expired';
  if (days <= threshold) return 'warning';
  return 'ok';
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export function badgeFor(days) {
  if (days === null || days === undefined) return null;
  if (days < 0) return { big: `${Math.abs(days)}`, small: days === -1 ? 'giorno fa' : 'giorni fa' };
  if (days === 0) return { big: 'Oggi', small: 'scade' };
  if (days === 1) return { big: '1', small: 'giorno' };
  return { big: `${days}`, small: 'giorni' };
}
