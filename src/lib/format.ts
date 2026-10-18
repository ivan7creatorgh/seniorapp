// Date/time + display formatting helpers.
// Event times are stored as local wall time strings: "YYYY-MM-DDTHH:MM".
// They are deliberately rendered exactly as entered by local organizations —
// a hyperlocal board has one time zone and should never shift times.

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Parse a "YYYY-MM-DDTHH:MM" wall-time string into a local Date. */
export function parseWallTime(value: string): Date {
  const [datePart, timePart] = value.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const [hh, mm] = (timePart ?? '00:00').split(':').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
}

/** Today's date as YYYY-MM-DD (local). */
export function todayISO(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Add days to a YYYY-MM-DD string. */
export function addDaysISO(isoDate: string, days: number): string {
  const d = parseWallTime(`${isoDate}T00:00`);
  d.setDate(d.getDate() + days);
  return todayISO(d);
}

/** "Monday, October 20" */
export function formatEventDate(value: string): string {
  const d = parseWallTime(value);
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function formatEventDayBlock(value: string): { weekday: string; day: string; month: string } {
  const d = parseWallTime(value);
  return { weekday: WEEKDAYS_SHORT[d.getDay()], day: String(d.getDate()), month: MONTHS_SHORT[d.getMonth()] };
}

/** "2:00 PM – 4:00 PM" or "2:00 PM" */
export function formatTimeRange(start: string, end?: string | null): string {
  const fmt = (v: string) => {
    const d = parseWallTime(v);
    let hh = d.getHours();
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ampm = hh >= 12 ? 'PM' : 'AM';
    hh = hh % 12 || 12;
    return `${hh}:${mm} ${ampm}`;
  };
  return end ? `${fmt(start)} – ${fmt(end)}` : fmt(start);
}

export function formatCost(costType: 'free' | 'paid', amount: number): string {
  if (costType === 'free') return 'Free';
  const rounded = Math.round(amount * 100) / 100;
  return Number.isInteger(rounded) ? `$${rounded}` : `$${rounded.toFixed(2)}`;
}

/** Friendly relative label: "Today", "Tomorrow", "In 3 days", or the date. */
export function relativeDayLabel(value: string, now: Date = new Date()): string {
  const d = parseWallTime(value);
  const dayA = todayISO(now);
  const dayB = todayISO(d);
  if (dayA === dayB) return 'Today';
  if (dayB === addDaysISO(dayA, 1)) return 'Tomorrow';
  const diff = Math.round((parseWallTime(`${dayB}T00:00`).getTime() - parseWallTime(`${dayA}T00:00`).getTime()) / 86_400_000);
  if (diff > 1 && diff <= 14) return `In ${diff} days`;
  return formatEventDate(value);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
