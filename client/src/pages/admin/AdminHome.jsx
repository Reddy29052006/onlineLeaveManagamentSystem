import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  Loader2,
  Sparkles,
  Users,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext.jsx';
import { dashboardApi } from '../../services/dashboardApi.js';
import { wsClient } from '../../services/websocket.js';
import StatCard from '../../components/StatCard.jsx';

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

const QUICK_ACTIONS = [
  {
    to: '/admin/applications',
    title: 'Leave Applications',
    description: 'Review, approve, and reject submitted leave requests with decision notes.',
    icon: FileText,
    color: 'blue',
  },
  {
    to: '/admin/calendar',
    title: 'Academic Calendar',
    description: 'Schedule institutional holidays, academic events, and holiday breaks.',
    icon: Calendar,
    color: 'emerald',
  },
  {
    to: '/admin/students',
    title: 'Manage Students',
    description: 'Enrol, manage, activate, or deactivate student accounts and departments.',
    icon: GraduationCap,
    color: 'amber',
  },
  {
    to: '/admin/teachers',
    title: 'Manage Teachers',
    description: 'Configure faculty accounts, designations, and departmental permissions.',
    icon: Users,
    color: 'purple',
  },
  {
    to: '/admin/settings',
    title: 'Institution Settings',
    description: 'Manage academic calendar bounds, timezone, contact info, and policies.',
    icon: Building,
    color: 'indigo',
  },
];

export default function AdminHome() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await dashboardApi.admin();
      setData(response.data);
    } catch (err) {
      setError(err.message || 'Unable to load administrative dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const unsubSubmitted = wsClient.subscribe('application:submitted', () => {
      load();
    });
    const unsubUpdated = wsClient.subscribe('leave:update', () => {
      load();
    });
    return () => {
      unsubSubmitted();
      unsubUpdated();
    };
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-slate-500 shadow-xs">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" aria-hidden="true" />
          Loading administrative dashboard…
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-xs">
        <p className="flex items-center gap-2 font-medium">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
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
    );
  }

  const {
    today = '',
    users = { students: 0, teachers: 0, total: 0 },
    applications = { total: 0, pending: 0, approved: 0, rejected: 0 },
    onLeave = { students: 0, teachers: 0, total: 0 },
    recentApplications = [],
  } = data || {};

  const studentLeaveRate = users.students > 0 ? Math.round((onLeave.students / users.students) * 100) : 0;
  const teacherLeaveRate = users.teachers > 0 ? Math.round((onLeave.teachers / users.teachers) * 100) : 0;
  const approvalRate = applications.total > 0 ? Math.round((applications.approved / applications.total) * 100) : 0;

  return (
    <div className="space-y-7">
      {/* 1. LeaveHub Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-indigo-50/80 p-6 sm:p-8 shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl space-y-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#182848]">
              Online Leave Management System
            </h1>
            <p className="text-base font-semibold text-slate-700">
              Administrative Control Centre &bull; {user?.name || 'Administrator'}
            </p>
            <p className="text-xs sm:text-sm font-medium text-blue-700 tracking-wide">
              Oversee Applications &bull; Manage Academic Calendar &bull; Maintain User Rosters
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                to="/admin/applications"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md"
              >
                <FileText className="h-4 w-4" aria-hidden="true" />
                Review Applications ({applications.pending} Pending)
              </Link>
              <Link
                to="/admin/calendar"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
              >
                <Calendar className="h-4 w-4 text-slate-500" />
                Academic Calendar
              </Link>
            </div>
          </div>

          {/* Banner Graphic Date & Summary Badge */}
          <div className="flex shrink-0 items-center justify-center">
            <div className="relative flex flex-col items-center rounded-2xl border border-blue-200/60 bg-white/80 p-4 shadow-sm backdrop-blur-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Institution Date</p>
                  <p className="text-sm font-bold text-slate-900">{today ? formatDate(today) : 'Active Today'}</p>
                </div>
              </div>
              <div className="mt-3 flex w-full items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-600">
                <span>Active Users</span>
                <span className="font-bold text-slate-900">{users.total}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative corner glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-200/30 blur-2xl" />
      </section>

      {/* 2. Four Pastel Stat KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Applications"
          value={applications.total}
          icon={FileText}
          color="blue"
          sublabel="All historical submissions"
        />
        <StatCard
          label="Pending Review"
          value={applications.pending}
          icon={Clock}
          color="amber"
          sublabel="Requires administrator decision"
        />
        <StatCard
          label="Approved Requests"
          value={applications.approved}
          icon={CheckCircle2}
          color="green"
          sublabel={`${approvalRate}% approval rate`}
        />
        <StatCard
          label="Currently on Leave"
          value={onLeave.total}
          icon={Users}
          color="purple"
          sublabel={`${onLeave.students} students, ${onLeave.teachers} teachers`}
        />
      </section>

      {/* 3. Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Recent Leave Requests Table */}
        <section className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Recent Leave Applications</h2>
                <p className="text-xs text-slate-500">Live submissions streaming in from students and faculty</p>
              </div>
              <Link
                to="/admin/applications"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                <span>View all</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3 pr-3 font-semibold">Applicant</th>
                    <th className="pb-3 px-3 font-semibold">Role & Dept</th>
                    <th className="pb-3 px-3 font-semibold">Dates</th>
                    <th className="pb-3 px-3 font-semibold">Days</th>
                    <th className="pb-3 px-3 font-semibold">Status</th>
                    <th className="pb-3 pl-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {recentApplications.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        No leave applications submitted yet.
                      </td>
                    </tr>
                  ) : (
                    recentApplications.map((app) => (
                      <tr key={app._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 pr-3">
                          <div className="font-semibold text-slate-900">{app.applicantNameSnapshot || 'Applicant'}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{app.applicationId}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                              app.applicantRoleSnapshot === 'teacher'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {app.applicantRoleSnapshot || 'Student'}
                          </span>
                          <div className="text-[11px] text-slate-500">{app.departmentSnapshot || '—'}</div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div>{formatDate(app.startDate)}</div>
                          <div className="text-[11px] text-slate-400">to {formatDate(app.endDate)}</div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          {app.requestedPolicyDays ?? app.requestedCalendarDays}d
                        </td>
                        <td className="py-3 px-3">
                          {app.status === 'Approved' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/60">
                              <CheckCircle2 className="h-3 w-3" /> Approved
                            </span>
                          )}
                          {app.status === 'Pending' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200/60">
                              <Clock className="h-3 w-3" /> Pending
                            </span>
                          )}
                          {app.status === 'Rejected' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 border border-rose-200/60">
                              <XCircle className="h-3 w-3" /> Rejected
                            </span>
                          )}
                        </td>
                        <td className="py-3 pl-3 text-right">
                          <Link
                            to={`/admin/applications/${app._id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition-colors"
                          >
                            <span>Review</span>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Showing recent submissions</span>
            <Link to="/admin/applications" className="font-semibold text-blue-600 hover:underline">
              Go to full application queue &rarr;
            </Link>
          </div>
        </section>

        {/* Right Column (1 Col): Institution Attendance & User Overview */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Today&apos;s Active Status</h2>
              <p className="text-xs text-slate-500">Real-time attendance & user roster summary</p>
            </div>

            {/* Visual Attendance Progress Meters */}
            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-blue-600" />
                    Students on Leave
                  </span>
                  <span className="font-bold text-slate-900">
                    {onLeave.students} / {users.students} ({studentLeaveRate}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(studentLeaveRate, 100)}%` }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-purple-600" />
                    Teachers on Leave
                  </span>
                  <span className="font-bold text-slate-900">
                    {onLeave.teachers} / {users.teachers} ({teacherLeaveRate}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(teacherLeaveRate, 100)}%` }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Application Resolution
                  </span>
                  <span className="font-bold text-slate-900">
                    {approvalRate}% approved
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(approvalRate, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Status Pill Counters */}
            <div className="mt-5 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-2.5">
                <div className="text-lg font-bold text-blue-700">{users.students}</div>
                <div className="text-[11px] font-medium text-slate-500">Enrolled Students</div>
              </div>
              <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-2.5">
                <div className="text-lg font-bold text-purple-700">{users.teachers}</div>
                <div className="text-[11px] font-medium text-slate-500">Faculty Members</div>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
            <p className="text-xs text-emerald-800 leading-snug">
              WebSockets active: real-time application updates are streamed live to this dashboard.
            </p>
          </div>
        </section>
      </div>

      {/* 4. Pastel Quick Action Cards */}
      <section>
        <h2 className="text-base font-bold text-slate-900 mb-3">Administrative Hub Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {QUICK_ACTIONS.map(({ to, title, description, icon: Icon, color }) => {
            const colorClasses = {
              blue: 'bg-blue-50/60 border-blue-100 hover:border-blue-300 group-hover:bg-blue-100/60',
              emerald: 'bg-emerald-50/60 border-emerald-100 hover:border-emerald-300 group-hover:bg-emerald-100/60',
              amber: 'bg-amber-50/60 border-amber-100 hover:border-amber-300 group-hover:bg-amber-100/60',
              purple: 'bg-purple-50/60 border-purple-100 hover:border-purple-300 group-hover:bg-purple-100/60',
              indigo: 'bg-indigo-50/60 border-indigo-100 hover:border-indigo-300 group-hover:bg-indigo-100/60',
            }[color] || 'bg-slate-50 border-slate-100';

            const iconBg = {
              blue: 'bg-blue-600 text-white',
              emerald: 'bg-emerald-600 text-white',
              amber: 'bg-amber-600 text-white',
              purple: 'bg-purple-600 text-white',
              indigo: 'bg-indigo-600 text-white',
            }[color] || 'bg-slate-700 text-white';

            return (
              <Link
                key={to}
                to={to}
                className={`group flex flex-col justify-between rounded-2xl border p-5 shadow-2xs transition-all hover:-translate-y-0.5 hover:shadow-xs ${colorClasses}`}
              >
                <div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl shadow-xs transition-transform group-hover:scale-105 ${iconBg}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-3.5 text-sm font-bold text-slate-900">{title}</h3>
                  <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">{description}</p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-slate-800 group-hover:text-blue-700">
                  <span>Open</span>
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}