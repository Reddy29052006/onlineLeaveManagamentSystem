import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Flag,
  GraduationCap,
  Loader2,
  Plus,
} from 'lucide-react';
import { calendarApi } from '../../services/calendarApi.js';
import CalendarView from '../../components/calendar/CalendarView.jsx';
import EventFormDialog from '../../components/calendar/EventFormDialog.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import StatCard from '../../components/StatCard.jsx';

export default function AdminCalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [dialogDate, setDialogDate] = useState('');
  const [dialogBusy, setDialogBusy] = useState(false);
  const [dialogError, setDialogError] = useState(null);

  // Delete state
  const [deletingEvent, setDeletingEvent] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await calendarApi.events({ includeInactive: true });
      setEvents(response.data.events || []);
    } catch (err) {
      setError(err.message || 'Unable to load calendar events.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function showNotice(msg) {
    setNotice(msg);
    window.setTimeout(() => setNotice(''), 4000);
  }

  function handleOpenCreate(dateStr = '') {
    setEditingEvent(null);
    setDialogDate(dateStr);
    setDialogError(null);
    setDialogOpen(true);
  }

  function handleOpenEdit(event) {
    setEditingEvent(event);
    setDialogDate(event.startDate);
    setDialogError(null);
    setDialogOpen(true);
  }

  async function handleFormSubmit(payload) {
    setDialogBusy(true);
    setDialogError(null);
    try {
      if (editingEvent) {
        const response = await calendarApi.update(editingEvent._id, payload);
        showNotice(response.message || 'Event updated successfully');
      } else {
        const response = await calendarApi.create(payload);
        showNotice(response.message || 'Event created successfully');
      }
      setDialogOpen(false);
      await load();
    } catch (err) {
      setDialogError({ message: err.message, details: err.details });
    } finally {
      setDialogBusy(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deletingEvent) return;
    setDeleteBusy(true);
    try {
      const response = await calendarApi.delete(deletingEvent._id);
      showNotice(response.message || 'Event deleted');
      setDeletingEvent(null);
      await load();
    } catch (err) {
      setError(err.message || 'Unable to delete event.');
    } finally {
      setDeleteBusy(false);
    }
  }

  // Calculate event stats
  const stats = useMemo(() => {
    let publicHolidays = 0;
    let institutionHolidays = 0;
    let academicEvents = 0;
    let overrides = 0;

    for (const ev of events) {
      if (ev.type === 'public_holiday') publicHolidays++;
      else if (ev.type === 'institution_holiday') institutionHolidays++;
      else if (ev.type === 'academic_event') academicEvents++;
      else if (ev.type === 'weekend_override') overrides++;
    }

    return {
      total: events.length,
      publicHolidays,
      institutionHolidays,
      academicEvents,
      overrides,
    };
  }, [events]);

  return (
    <div className="space-y-6">
      {/* 1. LeaveHub Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-indigo-50/80 p-5 sm:p-6 shadow-2xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="max-w-xl space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#182848]">
              Academic Calendar &amp; Holiday Management
            </h1>
            <p className="text-sm font-semibold text-slate-700">
              Institutional Schedule, Gazetted Holidays &amp; Academic Milestones
            </p>
            <p className="text-xs font-medium text-blue-700 tracking-wide">
              Manage Holidays &bull; Schedule Events &bull; Maintain Academic Year
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleOpenCreate()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all hover:bg-emerald-700 hover:shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Add Calendar Event
              </button>
            </div>
          </div>

          {/* Right Banner Badge */}
          <div className="flex shrink-0 items-center justify-center">
            <div className="relative flex flex-col items-center rounded-xl border border-blue-200/60 bg-white/80 p-3 shadow-2xs backdrop-blur-xs">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-2xs">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                    Schedule Control
                  </p>
                  <p className="text-xs font-bold text-slate-800">{stats.total} Configured Events</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Four Pastel Stat Cards */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          tone="blue"
          icon={Calendar}
          label="Total Events"
          subtitle="All academic milestones"
          value={stats.total}
        />
        <StatCard
          tone="rose"
          icon={Flag}
          label="Public Holidays"
          subtitle="Gazetted national holidays"
          value={stats.publicHolidays}
        />
        <StatCard
          tone="purple"
          icon={Building2}
          label="Institution Holidays"
          subtitle="Campus holiday closures"
          value={stats.institutionHolidays}
        />
        <StatCard
          tone="green"
          icon={GraduationCap}
          label="Academic Events"
          subtitle="Exams & semester milestones"
          value={stats.academicEvents}
        />
      </section>

      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700 shadow-2xs">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-slate-500 shadow-xs">
          <span className="flex items-center gap-2 text-sm font-medium">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            Loading academic calendar events…
          </span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-xs">
          <p className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </p>
          <button
            type="button"
            onClick={load}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : (
        <CalendarView
          events={events}
          isAdmin={true}
          onAddEvent={handleOpenCreate}
          onEditEvent={handleOpenEdit}
          onDeleteEvent={(ev) => setDeletingEvent(ev)}
        />
      )}

      {/* Event Add/Edit Modal */}
      <EventFormDialog
        open={dialogOpen}
        editing={editingEvent}
        initialDate={dialogDate}
        busy={dialogBusy}
        error={dialogError}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={deletingEvent !== null}
        title="Delete Calendar Event?"
        message={
          deletingEvent
            ? `Are you sure you want to delete "${deletingEvent.name}" (${deletingEvent.startDate})? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete Event"
        tone="danger"
        busy={deleteBusy}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingEvent(null)}
      />
    </div>
  );
}
