import {
  Calendar as CalendarIcon,
  Flag,
  GraduationCap,
  Sparkles,
  CheckCircle,
  Building2,
} from 'lucide-react';

export const EVENT_TYPE_CONFIG = {
  public_holiday: {
    label: 'Public Holiday',
    shortLabel: 'Public Holiday',
    icon: Flag,
    colorClass: 'bg-rose-100 text-rose-800 border-rose-200',
    dotClass: 'bg-rose-500',
    badgeClass: 'bg-rose-50 text-rose-700 ring-rose-200',
    bgTint: 'bg-rose-50/50',
  },
  institution_holiday: {
    label: 'Institution Holiday',
    shortLabel: 'Institution Holiday',
    icon: Building2,
    colorClass: 'bg-purple-100 text-purple-800 border-purple-200',
    dotClass: 'bg-purple-500',
    badgeClass: 'bg-purple-50 text-purple-700 ring-purple-200',
    bgTint: 'bg-purple-50/50',
  },
  academic_event: {
    label: 'Academic Event',
    shortLabel: 'Academic Event',
    icon: GraduationCap,
    colorClass: 'bg-blue-100 text-blue-800 border-blue-200',
    dotClass: 'bg-blue-500',
    badgeClass: 'bg-blue-50 text-blue-700 ring-blue-200',
    bgTint: 'bg-blue-50/50',
  },
  weekend_override: {
    label: 'Weekend Override',
    shortLabel: 'Override',
    icon: Sparkles,
    colorClass: 'bg-amber-100 text-amber-800 border-amber-200',
    dotClass: 'bg-amber-500',
    badgeClass: 'bg-amber-50 text-amber-700 ring-amber-200',
    bgTint: 'bg-amber-50/50',
  },
  approved_leave: {
    label: 'Approved Leave',
    shortLabel: 'My Leave',
    icon: CheckCircle,
    colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-500',
    badgeClass: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    bgTint: 'bg-emerald-50/50',
  },
};

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatMonthYear(year, monthIndex) {
  const date = new Date(Date.UTC(year, monthIndex, 1));
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function padZero(num) {
  return String(num).padStart(2, '0');
}

export function toDateString(year, monthIndex, day) {
  return `${year}-${padZero(monthIndex + 1)}-${padZero(day)}`;
}

export function isDateInRange(dateStr, startStr, endStr) {
  return dateStr >= startStr && dateStr <= endStr;
}

export function isWeekendDay(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = date.getUTCDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
}

/**
 * Generates a 35 or 42 day matrix for the month grid.
 */
export function getMonthMatrix(year, monthIndex) {
  const firstDay = new Date(Date.UTC(year, monthIndex, 1));
  const firstDayOfWeek = firstDay.getUTCDay(); // 0 = Sun
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

  const daysInPrevMonth = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();

  const cells = [];

  // Previous month trailing days
  for (let i = firstDayOfWeek - 1; i >= 0; i -= 1) {
    const day = daysInPrevMonth - i;
    const prevMonthIdx = monthIndex === 0 ? 11 : monthIndex - 1;
    const prevYear = monthIndex === 0 ? year - 1 : year;
    const dateStr = toDateString(prevYear, prevMonthIdx, day);
    cells.push({
      dateStr,
      dayNumber: day,
      isCurrentMonth: false,
      isWeekend: isWeekendDay(dateStr),
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateStr = toDateString(year, monthIndex, day);
    cells.push({
      dateStr,
      dayNumber: day,
      isCurrentMonth: true,
      isWeekend: isWeekendDay(dateStr),
    });
  }

  // Next month leading days to complete full weeks (up to 35 or 42 cells)
  const totalCellsNeeded = cells.length > 35 ? 42 : 35;
  const remaining = totalCellsNeeded - cells.length;
  for (let day = 1; day <= remaining; day += 1) {
    const nextMonthIdx = monthIndex === 11 ? 0 : monthIndex + 1;
    const nextYear = monthIndex === 11 ? year + 1 : year;
    const dateStr = toDateString(nextYear, nextMonthIdx, day);
    cells.push({
      dateStr,
      dayNumber: day,
      isCurrentMonth: false,
      isWeekend: isWeekendDay(dateStr),
    });
  }

  return cells;
}
