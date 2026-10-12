import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  FilePlus,
  Flag,
  GraduationCap,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { calendarApi } from '../../services/calendarApi.js';
import { leavesApi } from '../../services/leavesApi.js';
import { useAuth } from '../../features/auth/AuthContext.jsx';
import CalendarView from '../../components/calendar/CalendarView.jsx';
import StatCard from '../../components/StatCard.jsx';

export default function SharedCalendarPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [eventsRes, leavesRes] = await Promise.all([
        calendarApi.events(),
        user?.role !== 'admin'
          ? leavesApi.mine({ status: 'Approved', limit: 100 }).catch(() => ({ data: { items: [] } }))
          : Promise.resolve({ data: { items: [] } }),
      ]);
      setEvents(eventsRes.data.events || []);
      setLeaves(leavesRes.data.items || []);
    } catch (err) {
      setError(err.message || 'Unable to load calendar data.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    let holidays = 0;
    let academicEvents = 0;

    for (const ev of events) {
      if (ev.type === 'public_holiday' || ev.type === 'institution_holiday') holidays++;
      else if (ev.type === 'academic_event') academicEvents++;
    }

    return {
      holidays,
      academicEvents,
      myLeaves: leaves.length,
      totalEvents: events.length,
    };
  }, [events, leaves]);

  const base = user ? `/${user.role}` : '/student';

  return (
    <div className="space-y-6">
      {/* 1. LeaveHub Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-indigo-50/80 p-5 sm:p-6 shadow-2xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="max-w-xl space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#182848]">
              Academic Calendar &amp; Schedules
            </h1>
            <p className="text-sm font-semibold text-slate-700">
              Institutional Holidays, Academic Deadlines &amp; Approved Leaves
            </p>
            <p className="text-xs font-medium text-blue-700 tracking-wide">
              Check Holidays &bull; Track Schedule &bull; Plan Ahead Seamlessly
            </p>

            <div className="pt-2">
              <Link
                to={`${base}/apply`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all hover:bg-emerald-700 hover:shadow-sm"
              >
                <FilePlus className="h-4 w-4" />
                Apply for Leave
              </Link>
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
                    My Schedule
                  </p>
                  <p className="text-xs font-bold text-slate-800">{stats.myLeaves} Approved Leaves</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Four Pastel Stat Cards */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          tone="amber"
          icon={Flag}
          label="Campus Holidays"
          subtitle="Public & college closures"
          value={stats.holidays}
        />
        <StatCard
          tone="blue"
          icon={GraduationCap}
          label="Academic Milestones"
          subtitle="Exams & term dates"
          value={stats.academicEvents}
        />
        <StatCard
          tone="green"
          icon={CheckCircle2}
          label="My Approved Leaves"
          subtitle="Active on my schedule"
          value={stats.myLeaves}
        />
        <StatCard
          tone="purple"
          icon={Building2}
          label="Total Calendar Items"
          subtitle="All scheduled entries"
          value={stats.totalEvents}
        />
      </section>

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-slate-500 shadow-xs">
          <span className="flex items-center gap-2 text-sm font-medium">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            Loading academic calendar…
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
          leaves={leaves}
          isAdmin={false}
        />
      )}
    </div>
  );
}
