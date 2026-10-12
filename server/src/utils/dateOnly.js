/**
 * Date-only utilities.
 *
 * Leave and calendar dates are calendar dates, not instants. To avoid timezone
 * shifts they are represented everywhere as `YYYY-MM-DD` strings. All
 * arithmetic is performed in UTC so a calendar day never changes because of a
 * server/browser timezone difference.
 */

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const DATE_ONLY_PATTERN = DATE_ONLY_REGEX;

export function isValidDateOnly(value) {
  if (typeof value !== 'string' || !DATE_ONLY_REGEX.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function dateOnlyToUtc(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function utcToDateOnly(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(value, days) {
  const date = dateOnlyToUtc(value);
  date.setUTCDate(date.getUTCDate() + days);
  return utcToDateOnly(date);
}

export function compareDateOnly(a, b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export function isOnOrAfter(a, b) {
  return compareDateOnly(a, b) >= 0;
}

/** Inclusive calendar-day duration: end - start + 1. */
export function daysBetweenInclusive(start, end) {
  const diff = dateOnlyToUtc(end).getTime() - dateOnlyToUtc(start).getTime();
  return Math.round(diff / MS_PER_DAY) + 1;
}

/** All dates from start to end inclusive. Caller must ensure start <= end. */
export function enumerateDateOnly(start, end) {
  const dates = [];
  let current = start;
  while (compareDateOnly(current, end) <= 0) {
    dates.push(current);
    current = addDays(current, 1);
  }
  return dates;
}

export function isWeekend(value) {
  const day = dateOnlyToUtc(value).getUTCDay();
  return day === 0 || day === 6;
}

/** Today's calendar date in the given IANA timezone, as `YYYY-MM-DD`. */
export function getTodayInTimeZone(timeZone = 'Asia/Kolkata') {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (type) => parts.find((part) => part.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Human-readable date for letters, e.g. "12 Oct 2026". */
export function formatDateOnlyForDisplay(value) {
  if (!isValidDateOnly(value)) return '';
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
