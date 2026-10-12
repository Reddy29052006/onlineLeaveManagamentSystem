import { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Pencil,
  Trash2,
  List,
  LayoutGrid,
  Sparkles,
  Clock,
  CheckCircle2,
  Info,
} from 'lucide-react';
import {
  EVENT_TYPE_CONFIG,
  WEEKDAYS,
  formatMonthYear,
  getMonthMatrix,
  isDateInRange,
} from '../../utils/calendarUtils.js';

function formatFullDate(dateStr) {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  } catch {
    return dateStr;
  }
}

function formatShortMonthDay(dateStr) {
  if (!dateStr) return { month: '', day: '' };
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    const month = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(date);
    return { month: month.toUpperCase(), day: String(d) };
  } catch {
    return { month: '', day: dateStr };
  }
}

export default function CalendarView({
  events = [],
  leaves = [],
  isAdmin = false,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
}) {
  const today = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedDateStr, setSelectedDateStr] = useState(today);

  const currentYear = currentDate.getFullYear();
  const currentMonthIndex = currentDate.getMonth();

  function prevMonth() {
    setCurrentDate(new Date(currentYear, currentMonthIndex - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(currentYear, currentMonthIndex + 1, 1));
  }

  function goToday() {
    setCurrentDate(new Date());
    setSelectedDateStr(today);
  }

  const matrix = useMemo(
    () => getMonthMatrix(currentYear, currentMonthIndex),
    [currentYear, currentMonthIndex]
  );

  // Filter events
  const filteredEvents = useMemo(() => {
    if (typeFilter === 'all') return events;
    if (typeFilter === 'leaves') return [];
    return events.filter((ev) => ev.type === typeFilter);
  }, [events, typeFilter]);

  const showLeaves = typeFilter === 'all' || typeFilter === 'leaves';

  // Map events to date lookup
  const eventsByDate = useMemo(() => {
    const map = new Map();
    for (const cell of matrix) {
      const dateStr = cell.dateStr;
      const matchedEvents = filteredEvents.filter((ev) =>
        isDateInRange(dateStr, ev.startDate, ev.endDate)
      );
      const matchedLeaves = showLeaves
        ? leaves.filter((lv) => isDateInRange(dateStr, lv.startDate, lv.endDate))
        : [];
      map.set(dateStr, { events: matchedEvents, leaves: matchedLeaves });
    }
    return map;
  }, [matrix, filteredEvents, leaves, showLeaves]);

  // Selected day items
  const selectedDayData = useMemo(() => {
    const targetDate = selectedDateStr || today;
    const allMatchingEvents = events.filter((ev) =>
      isDateInRange(targetDate, ev.startDate, ev.endDate)
    );
    const allMatchingLeaves = leaves.filter((lv) =>
      isDateInRange(targetDate, lv.startDate, lv.endDate)
    );

    const [y, m, d] = targetDate.split('-').map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    const dayOfWeek = dateObj.getUTCDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    return {
      dateStr: targetDate,
      isWeekend,
      events: allMatchingEvents,
      leaves: allMatchingLeaves,
    };
  }, [selectedDateStr, today, events, leaves]);

  // Upcoming events
  const upcomingEvents = useMemo(() => {
    return [...events]
      .filter((ev) => ev.endDate >= today)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .slice(0, 5);
  }, [events, today]);

  // All events sorted for list view
  const sortedAllEvents = useMemo(() => {
    return [...events].sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [events]);

  return (
    <div className="space-y-5">
      {/* 1. Integrated Calendar Control Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={prevMonth}
              className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-white hover:text-slate-900 shadow-2xs"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-white hover:text-slate-900 shadow-2xs"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={goToday}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            Today
          </button>
          <div className="flex items-center gap-2 pl-1">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {formatMonthYear(currentYear, currentMonthIndex)}
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Month
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              List
            </button>
          </div>

          {/* Admin Add Event */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => onAddEvent && onAddEvent(selectedDateStr)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Event
            </button>
          )}
        </div>
      </div>

      {/* 2. Filter Pills Row */}
      <div className="flex flex-wrap items-center gap-1.5 px-0.5">
        <span className="text-xs font-bold text-slate-500 mr-1">Filter:</span>
        <button
          type="button"
          onClick={() => setTypeFilter('all')}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            typeFilter === 'all'
              ? 'bg-[#182848] text-white shadow-xs'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Events
        </button>
        {Object.entries(EVENT_TYPE_CONFIG).map(([key, cfg]) => {
          if (key === 'approved_leave' && leaves.length === 0) return null;
          const isLeave = key === 'approved_leave';
          const filterKey = isLeave ? 'leaves' : key;
          const Icon = cfg.icon;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTypeFilter(filterKey)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                typeFilter === filterKey
                  ? 'bg-[#182848] text-white shadow-xs'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${cfg.dotClass}`} />
              <Icon className="h-3 w-3" />
              {cfg.shortLabel}
            </button>
          );
        })}
      </div>

      {/* 3. Main Body */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols): The Month Matrix Calendar */}
          <div className="lg:col-span-8 flex flex-col rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
            {/* Weekday Header Row */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center text-xs font-bold uppercase tracking-wider text-slate-600">
              {WEEKDAYS.map((day, i) => (
                <div
                  key={day}
                  className={`py-2.5 ${i === 0 || i === 6 ? 'text-amber-700 bg-amber-50/40' : ''}`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Month Matrix Cells */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-slate-100/50">
              {matrix.map((cell) => {
                const cellData = eventsByDate.get(cell.dateStr) || { events: [], leaves: [] };
                const isToday = cell.dateStr === today;
                const isSelected = selectedDateStr === cell.dateStr;
                const totalItems = cellData.events.length + cellData.leaves.length;

                return (
                  <div
                    key={cell.dateStr}
                    onClick={() => setSelectedDateStr(cell.dateStr)}
                    className={`min-h-[70px] sm:min-h-[78px] p-1.5 flex flex-col justify-between cursor-pointer transition-all ${
                      cell.isCurrentMonth ? 'bg-white' : 'bg-slate-50/60 text-slate-400'
                    } ${
                      cell.isWeekend && cell.isCurrentMonth ? 'bg-amber-50/15' : ''
                    } ${
                      isSelected
                        ? 'ring-2 ring-blue-600 ring-inset bg-blue-50/40 z-10'
                        : 'hover:bg-slate-50/90'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold transition-transform ${
                          isToday
                            ? 'bg-blue-600 text-white shadow-xs'
                            : isSelected
                            ? 'bg-blue-100 text-blue-700'
                            : cell.isCurrentMonth
                            ? 'text-slate-800'
                            : 'text-slate-300 font-normal'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>
                      {cell.isWeekend && cell.isCurrentMonth && (
                        <span className="text-[9px] font-bold text-amber-600 tracking-tight uppercase">
                          W/E
                        </span>
                      )}
                    </div>

                    {/* Day Event Badges */}
                    <div className="mt-1 flex flex-1 flex-col gap-0.5 overflow-hidden">
                      {/* Leaves */}
                      {cellData.leaves.slice(0, 2).map((lv) => {
                        const cfg = EVENT_TYPE_CONFIG.approved_leave;
                        const Icon = cfg.icon;
                        return (
                          <div
                            key={lv._id || lv.applicationId}
                            className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-semibold border truncate ${cfg.colorClass}`}
                            title={`Approved Leave (${lv.applicationId || 'Leave'})`}
                          >
                            <Icon className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate">Leave: {lv.applicationId}</span>
                          </div>
                        );
                      })}

                      {/* Events */}
                      {cellData.events.slice(0, 2).map((ev) => {
                        const cfg = EVENT_TYPE_CONFIG[ev.type] || EVENT_TYPE_CONFIG.academic_event;
                        const Icon = cfg.icon;
                        return (
                          <div
                            key={ev._id}
                            className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-semibold border truncate ${cfg.colorClass}`}
                            title={`${cfg.label}: ${ev.name}`}
                          >
                            <Icon className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate">{ev.name}</span>
                          </div>
                        );
                      })}

                      {totalItems > 2 && (
                        <div className="text-[9px] font-semibold text-slate-500 pl-0.5">
                          +{totalItems - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Legend Bar */}
            <div className="border-t border-slate-100 bg-slate-50/70 p-3 text-xs text-slate-600">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                <span className="font-bold text-slate-700">Legend:</span>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full border border-slate-300 bg-white" />
                  <span>Working Day</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full border border-amber-300 bg-amber-200" />
                  <span>Weekend (W/E)</span>
                </div>
                {Object.entries(EVENT_TYPE_CONFIG).map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <div key={key} className="flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${cfg.dotClass}`} />
                      <Icon className="h-3 w-3 text-slate-500" />
                      <span>{cfg.shortLabel}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): Day Inspector & Upcoming Schedule */}
          <div className="lg:col-span-4 space-y-5">
            {/* 1. Selected Day Inspector */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Day Details</p>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    {formatFullDate(selectedDayData.dateStr)}
                  </h3>
                </div>
                {selectedDayData.isWeekend ? (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                    Weekend
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200/60">
                    Working Day
                  </span>
                )}
              </div>

              {/* Items for this day */}
              <div className="mt-4 space-y-3">
                {selectedDayData.events.length === 0 && selectedDayData.leaves.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center text-xs text-slate-500">
                    <Clock className="mx-auto mb-1.5 h-5 w-5 text-slate-400" />
                    {selectedDayData.isWeekend
                      ? 'Standard weekend. No holidays or events scheduled.'
                      : 'Regular working day. No special events or leaves scheduled.'}
                  </div>
                ) : null}

                {/* Approved Leaves */}
                {selectedDayData.leaves.map((lv) => (
                  <div
                    key={lv._id || lv.applicationId}
                    className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Approved Leave: {lv.applicationId}
                      </span>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        Approved
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-emerald-800">
                      Duration: {lv.startDate} to {lv.endDate} ({lv.requestedPolicyDays} days)
                    </p>
                    {lv.purpose && (
                      <p className="mt-1 text-[11px] text-slate-600 line-clamp-2">
                        &ldquo;{lv.purpose}&rdquo;
                      </p>
                    )}
                  </div>
                ))}

                {/* Events */}
                {selectedDayData.events.map((ev) => {
                  const cfg = EVENT_TYPE_CONFIG[ev.type] || EVENT_TYPE_CONFIG.academic_event;
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={ev._id}
                      className={`rounded-xl border p-3 shadow-2xs ${cfg.colorClass}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs">{ev.name}</h4>
                            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mt-0.5">
                              {cfg.label}
                            </p>
                          </div>
                        </div>

                        {isAdmin && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => onEditEvent && onEditEvent(ev)}
                              className="rounded-lg p-1 text-slate-600 hover:bg-white/80 transition-colors"
                              title="Edit event"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteEvent && onDeleteEvent(ev)}
                              className="rounded-lg p-1 text-red-600 hover:bg-white/80 transition-colors"
                              title="Delete event"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {ev.description && (
                        <p className="mt-1.5 text-xs text-slate-700 leading-snug">
                          {ev.description}
                        </p>
                      )}

                      <div className="mt-2 text-[10px] font-mono text-slate-500">
                        {ev.startDate === ev.endDate ? ev.startDate : `${ev.startDate} → ${ev.endDate}`}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Admin Add Event on this date */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => onAddEvent && onAddEvent(selectedDayData.dateStr)}
                  className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Event for {selectedDayData.dateStr}
                </button>
              )}
            </div>

            {/* 2. Upcoming Holidays & Events Card */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Upcoming Schedule</h3>
                <span className="text-xs font-semibold text-slate-400">Next holidays</span>
              </div>

              <div className="mt-3.5 space-y-3">
                {upcomingEvents.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-400">
                    No upcoming events scheduled.
                  </p>
                ) : (
                  upcomingEvents.map((ev) => {
                    const cfg = EVENT_TYPE_CONFIG[ev.type] || EVENT_TYPE_CONFIG.academic_event;
                    const { month, day } = formatShortMonthDay(ev.startDate);
                    return (
                      <div
                        key={ev._id}
                        onClick={() => setSelectedDateStr(ev.startDate)}
                        className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 hover:bg-blue-50/50 hover:border-blue-200 transition-all cursor-pointer"
                      >
                        {/* Date badge */}
                        <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-white border border-slate-200 shadow-2xs">
                          <span className="text-[9px] font-bold text-blue-600 leading-none">{month}</span>
                          <span className="text-sm font-extrabold text-slate-900 leading-none mt-0.5">{day}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{ev.name}</h4>
                          <span
                            className={`inline-block rounded-full px-2 py-0.2 text-[9px] font-semibold mt-0.5 ${cfg.colorClass}`}
                          >
                            {cfg.shortLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-3.5 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Institution Academic Calendar Schedule ({sortedAllEvents.length} events)
            </h3>
            {isAdmin && (
              <button
                type="button"
                onClick={() => onAddEvent && onAddEvent()}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Event
              </button>
            )}
          </div>

          {sortedAllEvents.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-400">
              No calendar events found.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {sortedAllEvents.map((ev) => {
                const cfg = EVENT_TYPE_CONFIG[ev.type] || EVENT_TYPE_CONFIG.academic_event;
                const Icon = cfg.icon;
                const isSingleDay = ev.startDate === ev.endDate;
                return (
                  <li
                    key={ev._id}
                    className="flex flex-col gap-3 p-4 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${cfg.colorClass}`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{ev.name}</h4>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${cfg.colorClass}`}
                          >
                            {cfg.label}
                          </span>
                        </div>
                        {ev.description && (
                          <p className="mt-1 text-xs text-slate-600">{ev.description}</p>
                        )}
                        <p className="mt-1 font-mono text-xs text-slate-500">
                          {isSingleDay ? ev.startDate : `${ev.startDate} → ${ev.endDate}`}
                        </p>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => onEditEvent && onEditEvent(ev)}
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-2xs"
                          title="Edit event"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteEvent && onDeleteEvent(ev)}
                          className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100 shadow-2xs"
                          title="Delete event"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
