import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  FilePlus,
  FileText,
  HelpCircle,
  ListChecks,
  Loader2,
  XCircle,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext.jsx';
import { dashboardApi } from '../services/dashboardApi.js';
import { wsClient } from '../services/websocket.js';
import StatCard from '../components/StatCard.jsx';

function formatDate(value) {
  if (!value) return '—';
  try {
    const d = new Date(value);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return value;
  }
}

export default function DashboardPage() {
  const { user } = useAuth();
  const location = useLocation();
  const isTeacherRoute = location.pathname.startsWith('/teacher');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await dashboardApi.mine();
      setData(response.data);
    } catch (err) {
      setError(err.message || 'Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const unsub = wsClient.subscribe('leave:update', () => {
      load();
    });
    return unsub;
  }, [load]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-slate-500 shadow-xs">
        <span className="flex items-center gap-2 text-sm">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" aria-hidden="true" />
          Loading LeaveHub dashboard…
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="flex items-center gap-2 font-medium">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          {error}
        </p>
        <button
          type="button"
          onClick={load}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const base = isTeacherRoute ? '/teacher' : (user?.role === 'teacher' ? '/teacher' : '/student');
  const { today, stats = { total: 0, pending: 0, approved: 0, rejected: 0, pendingDays: 0, approvedDays: 0 }, recentApplications = [] } = data || {};

  // Real, data-derived metrics (no hardcoded quotas).
  const approvedDays = stats.approvedDays || 0;
  const pendingDays = stats.pendingDays || 0;
  const rejectedDays = stats.rejectedDays || 0;
  const totalDaysUsed = approvedDays + pendingDays + rejectedDays;
  const maxDays = Math.max(approvedDays, pendingDays, rejectedDays, 1);

  return (
    <div className="space-y-5">
      {/* 1. Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-indigo-50/80 p-4 sm:p-5 shadow-2xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="max-w-xl space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#182848]">
              Online Leave Management System
            </h1>
            <p className="text-sm font-semibold text-slate-700">
              For {user.role === 'teacher' ? 'Employees & Faculty' : 'Students & Academics'}
            </p>
            <p className="text-xs font-medium text-blue-700 tracking-wide">
              Request &bull; Track &bull; Get Approvals &bull; Stay Organized
            </p>

            <div className="pt-1.5">
              <Link
                to={`${base}/apply`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all hover:bg-emerald-700 hover:shadow-sm"
              >
                <FilePlus className="h-4 w-4" aria-hidden="true" />
                Apply for Leave
              </Link>
            </div>
          </div>

          {/* Banner Graphic Illustration / Badges */}
          <div className="flex shrink-0 items-center justify-center">
            <div className="relative flex flex-col items-center rounded-xl border border-blue-200/60 bg-white/80 p-3 shadow-2xs backdrop-blur-xs">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-2xs">
                  <Calendar className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 font-sans">
                    LeaveHub Assistant
                  </p>
                  <p className="text-xs font-bold text-slate-800">Manage Leaves Hassle Free!</p>
                </div>
              </div>
              {today && (
                <div className="mt-1.5 text-[10px] font-medium text-slate-500 bg-blue-50 px-2 py-0.5 rounded-full">
                  Today: {today}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Four Pastel Stat Cards */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          tone="blue"
          icon={Calendar}
          label="Total Leaves"
          subtitle="This Year"
          value={stats.total}
        />
        <StatCard
          tone="green"
          icon={CheckCircle2}
          label="Approved Leaves"
          subtitle={`Total Days: ${stats.approvedDays}`}
          value={stats.approved}
        />
        <StatCard
          tone="amber"
          icon={Clock}
          label="Pending Requests"
          subtitle={`Awaiting Review: ${stats.pendingDays}d`}
          value={stats.pending}
        />
        <StatCard
          tone="rose"
          icon={XCircle}
          label="Rejected Requests"
          subtitle="Total Declined"
          value={stats.rejected}
        />
      </section>

      {/* 3. Middle Section: Recent Requests & Leave Balance */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12 sm:gap-5">
        {/* Left Column: Recent Leave Requests (7 Cols) */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs lg:col-span-7">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Recent Leave Requests</h2>
            <div className="flex items-center gap-3">
              <Link
                to={`${base}/history`}
                className="text-xs font-semibold text-slate-600 hover:text-blue-600"
              >
                View History
              </Link>
              <Link
                to={`${base}/apply`}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Apply New <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {recentApplications.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              <Calendar className="mx-auto mb-2 h-8 w-8 text-slate-300" />
              No leave requests submitted yet.
              <div className="mt-3">
                <Link
                  to={`${base}/apply`}
                  className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                >
                  Apply now
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="pb-3 pr-2">#</th>
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3 pr-4">Leave Info</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentApplications.slice(0, 5).map((app, idx) => (
                    <tr key={app._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 pr-2 font-mono text-xs text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 pr-4 text-xs font-medium text-slate-700 whitespace-nowrap">
                        {formatDate(app.startDate)}
                      </td>
                      <td className="py-2.5 pr-4">
                        <Link
                          to={`${base}/applications/${app._id}`}
                          className="font-medium text-xs text-blue-600 hover:underline block truncate max-w-[200px]"
                          title={app.purpose}
                        >
                          {app.applicationId}
                        </Link>
                        <span className="text-[11px] text-slate-500 line-clamp-1">
                          {app.purpose || 'Leave request'}
                        </span>
                      </td>
                      <td className="py-2.5 text-right whitespace-nowrap">
                        {app.status === 'Approved' && (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            Approved
                          </span>
                        )}
                        {app.status === 'Pending' && (
                          <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                            Pending
                          </span>
                        )}
                        {app.status === 'Rejected' && (
                          <span className="inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                            Rejected
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Leave Insights (5 Cols) */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs lg:col-span-5 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Leave Insights</h2>
            <Link
              to={`${base}/history`}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              View History
            </Link>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-slate-50 p-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Approved Days
              </p>
              <p className="mt-0.5 text-lg font-extrabold text-emerald-700">{approvedDays}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Applied Days
              </p>
              <p className="mt-0.5 text-lg font-extrabold text-[#182848]">{totalDaysUsed}</p>
            </div>
          </div>

          {/* Day breakdown bars */}
          <div className="mt-3.5 space-y-2.5">
            {[
              { label: 'Approved', days: approvedDays, bar: 'bg-emerald-500' },
              { label: 'Pending', days: pendingDays, bar: 'bg-amber-500' },
              { label: 'Rejected', days: rejectedDays, bar: 'bg-rose-500' },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                  <span>{row.label}</span>
                  <span className="font-semibold text-slate-900">
                    {row.days} day{row.days === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${row.bar} transition-all duration-500`}
                    style={{ width: `${Math.round((row.days / maxDays) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Upcoming
              </p>
              <p className="mt-0.5 text-sm font-bold text-purple-700">
                {stats.upcomingApproved || 0}
              </p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                On Leave Now
              </p>
              <p className="mt-0.5 text-sm font-bold text-blue-700">
                {stats.currentOnLeave ? 'Yes' : 'No'}
              </p>
            </div>
          </div>

          <div className="mt-auto pt-3">
            <div className="rounded-lg bg-slate-50 p-2 text-center text-[11px] text-slate-500">
              Figures update live as your applications are reviewed.
            </div>
          </div>
        </div>
      </section>

      {/* 4. Quick Actions Row */}
      <section className="space-y-2">
        <h2 className="text-sm sm:text-base font-bold text-slate-900">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Apply for Leave */}
          <Link
            to={`${base}/apply`}
            className="group flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-3.5 shadow-2xs transition-all hover:-translate-y-0.5 hover:shadow-xs"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-2xs">
              <FilePlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                Apply for Leave
              </h3>
              <p className="text-[11px] text-slate-500">Submit a new leave request</p>
            </div>
          </Link>

          {/* Card 2: Leave History */}
          <Link
            to={`${base}/history`}
            className="group flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3.5 shadow-2xs transition-all hover:-translate-y-0.5 hover:shadow-xs"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-2xs">
              <ListChecks className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                Leave History
              </h3>
              <p className="text-[11px] text-slate-500">Track &amp; export past records</p>
            </div>
          </Link>

          {/* Card 3: View Calendar */}
          <Link
            to={`${base}/calendar`}
            className="group flex items-center gap-3 rounded-xl border border-purple-100 bg-purple-50/70 p-3.5 shadow-2xs transition-all hover:-translate-y-0.5 hover:shadow-xs"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-600 text-white shadow-2xs">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                View Calendar
              </h3>
              <p className="text-[11px] text-slate-500">Check holidays &amp; leaves</p>
            </div>
          </Link>

          {/* Card 4: Contact Support */}
          <Link
            to="/change-password"
            className="group flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/70 p-3.5 shadow-2xs transition-all hover:-translate-y-0.5 hover:shadow-xs"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-600 text-white shadow-2xs">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                Account &amp; Help
              </h3>
              <p className="text-[11px] text-slate-500">Manage security settings</p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
