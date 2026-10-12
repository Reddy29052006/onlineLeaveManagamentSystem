import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  GraduationCap,
  Loader2,
  Mail,
  Phone,
  ShieldAlert,
  Sparkles,
  UserCheck,
  UserX,
  Users,
  XCircle,
} from 'lucide-react';
import { usersApi } from '../../services/usersApi.js';
import { leavesApi } from '../../services/leavesApi.js';
import StatCard from '../../components/StatCard.jsx';
import { ROLE_LABELS } from '../../routes/roleHome.js';

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (!parts.length || !parts[0]) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function AdminUserDetailPage({ role }) {
  const { id } = useParams();
  const isStudent = role === 'student';

  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [userResponse, summaryResponse] = await Promise.all([
        usersApi.get(role, id),
        usersApi.leaveSummary(id),
      ]);
      setUser(userResponse.data.user);
      setSummary(summaryResponse.data.summary);
      setRecent(summaryResponse.data.recentApplications || []);
    } catch (err) {
      setError(err.message || 'Unable to load account information.');
    } finally {
      setLoading(false);
    }
  }, [role, id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDownloadPdf(application) {
    setDownloadingId(application._id);
    try {
      await leavesApi.downloadPdf(
        application._id,
        `Leave_${application.applicationId || application._id}.pdf`
      );
    } catch (err) {
      alert(err.message || 'Unable to download official leave PDF.');
    } finally {
      setDownloadingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-200/90 bg-white p-12 text-slate-500 shadow-2xs">
        <span className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" aria-hidden="true" />
          Loading user profile…
        </span>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-2xs">
        <p className="flex items-center gap-2 font-medium text-sm">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          {error || 'User not found.'}
        </p>
        <Link
          to={`/admin/${role}s`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-800 underline hover:text-rose-950"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to {isStudent ? 'Students' : 'Teachers'} Directory
        </Link>
      </div>
    );
  }

  const initials = getInitials(user.name);

  return (
    <div className="space-y-6">
      {/* 1. Breadcrumb Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Link
          to={`/admin/${role}s`}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to {isStudent ? 'Student' : 'Faculty'} Directory
        </Link>

        <div className="flex items-center gap-2">
          {user.accountStatus === 'active' ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/90 px-3 py-1 text-xs font-semibold text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Account
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100/90 px-3 py-1 text-xs font-semibold text-rose-800">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              Suspended Account
            </span>
          )}
        </div>
      </div>

      {/* 2. Profile Header Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-indigo-50/80 p-5 sm:p-7 shadow-2xs">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Avatar Circle */}
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-xl sm:text-2xl font-bold text-white shadow-md border-2 border-white/80">
              {initials}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#182848]">
                  {user.name}
                </h1>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                  {ROLE_LABELS[user.role] || user.role}
                </span>
              </div>

              <p className="text-xs sm:text-sm font-medium text-slate-600 flex items-center gap-2">
                <span className="font-mono text-slate-500">@{user.username}</span>
                <span className="text-slate-300">&bull;</span>
                <span className="text-blue-700 font-semibold">{user.department || 'General'}</span>
              </p>

              <div className="pt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  {user.email}
                </span>
                {user.phone && (
                  <>
                    <span className="text-slate-300">&bull;</span>
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      {user.phone}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col sm:items-end justify-between border-t border-blue-200/50 pt-3 sm:border-0 sm:pt-0">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              {isStudent ? 'Student ID' : 'Employee ID'}
            </span>
            <span className="font-mono text-sm sm:text-base font-bold text-slate-800 bg-white/80 px-3 py-1 rounded-lg border border-blue-100 shadow-2xs">
              {isStudent ? user.studentId || '—' : user.teacherId || '—'}
            </span>
          </div>
        </div>
      </section>

      {/* 3. Leave Metrics KPI Cards */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          tone="blue"
          icon={Calendar}
          label="Total Applications"
          subtitle="All-time Submissions"
          value={summary?.total || 0}
        />
        <StatCard
          tone="green"
          icon={CheckCircle2}
          label="Approved Leaves"
          subtitle={`Total: ${summary?.approvedDays || 0} Days`}
          value={summary?.approved || 0}
        />
        <StatCard
          tone="amber"
          icon={Clock}
          label="Pending Review"
          subtitle={`Awaiting: ${summary?.pendingDays || 0} Days`}
          value={summary?.pending || 0}
        />
        <StatCard
          tone="rose"
          icon={XCircle}
          label="Rejected Leaves"
          subtitle="Declined Requests"
          value={summary?.rejected || 0}
        />
      </section>

      {/* 4. Details Grid & Recent Applications */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Academic / Employment Details (4 cols) */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs lg:col-span-4 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              {isStudent ? <GraduationCap className="h-4 w-4" /> : <Users className="h-4 w-4" />}
            </div>
            <h2 className="text-sm font-bold text-slate-900">
              {isStudent ? 'Academic Information' : 'Faculty Credentials'}
            </h2>
          </div>

          <dl className="space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between items-center rounded-lg bg-slate-50/70 p-2.5">
              <dt className="text-slate-500 font-medium">
                {isStudent ? 'Student ID' : 'Teacher ID'}
              </dt>
              <dd className="font-mono font-semibold text-slate-800">
                {isStudent ? user.studentId || '—' : user.teacherId || '—'}
              </dd>
            </div>

            <div className="flex justify-between items-center rounded-lg bg-slate-50/70 p-2.5">
              <dt className="text-slate-500 font-medium">Department</dt>
              <dd className="font-semibold text-slate-800">{user.department || '—'}</dd>
            </div>

            {isStudent ? (
              <>
                <div className="flex justify-between items-center rounded-lg bg-slate-50/70 p-2.5">
                  <dt className="text-slate-500 font-medium">Course</dt>
                  <dd className="font-semibold text-slate-800">{user.course || '—'}</dd>
                </div>
                <div className="flex justify-between items-center rounded-lg bg-slate-50/70 p-2.5">
                  <dt className="text-slate-500 font-medium">Year & Section</dt>
                  <dd className="font-semibold text-slate-800">
                    {user.year ? `Year ${user.year}` : '—'}
                    {user.section ? ` / Sec ${user.section}` : ''}
                  </dd>
                </div>
              </>
            ) : (
              <div className="flex justify-between items-center rounded-lg bg-slate-50/70 p-2.5">
                <dt className="text-slate-500 font-medium">Designation</dt>
                <dd className="font-semibold text-slate-800">{user.designation || 'Faculty'}</dd>
              </div>
            )}

            <div className="flex justify-between items-center rounded-lg bg-slate-50/70 p-2.5">
              <dt className="text-slate-500 font-medium">Email Address</dt>
              <dd className="font-semibold text-slate-800 truncate max-w-[170px]" title={user.email}>
                {user.email}
              </dd>
            </div>

            <div className="flex justify-between items-center rounded-lg bg-slate-50/70 p-2.5">
              <dt className="text-slate-500 font-medium">Phone</dt>
              <dd className="font-semibold text-slate-800">{user.phone || '—'}</dd>
            </div>

            <div className="flex justify-between items-center rounded-lg bg-slate-50/70 p-2.5">
              <dt className="text-slate-500 font-medium">Account Created</dt>
              <dd className="font-semibold text-slate-800">{formatDate(user.createdAt)}</dd>
            </div>
          </dl>
        </section>

        {/* Right Column: Recent Applications & History (8 cols) */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs lg:col-span-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <FileText className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900">Recent Leave Applications</h2>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {recent.length} recent submissions
              </span>
            </div>

            {recent.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <Calendar className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                <p className="text-sm font-medium">No leave applications recorded for this user.</p>
                <p className="mt-1 text-xs text-slate-400">
                  When leave requests are submitted, they will appear here.
                </p>
              </div>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[540px] text-left text-xs sm:text-sm">
                  <thead className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="py-2.5 pr-3">Application ID</th>
                      <th className="py-2.5 pr-3">Dates</th>
                      <th className="py-2.5 pr-3">Days</th>
                      <th className="py-2.5 pr-3">Status</th>
                      <th className="py-2.5 pl-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recent.map((application) => (
                      <tr key={application._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 pr-3 font-medium">
                          <Link
                            to={`/admin/applications/${application._id}`}
                            className="font-semibold text-blue-600 hover:underline"
                          >
                            {application.applicationId}
                          </Link>
                        </td>
                        <td className="py-3 pr-3 text-slate-700 whitespace-nowrap text-xs">
                          {formatDate(application.startDate)} &rarr; {formatDate(application.endDate)}
                        </td>
                        <td className="py-3 pr-3 font-semibold text-slate-800">
                          {application.requestedPolicyDays}{' '}
                          <span className="text-[11px] font-normal text-slate-400">days</span>
                        </td>
                        <td className="py-3 pr-3 whitespace-nowrap">
                          {application.status === 'Approved' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Approved
                            </span>
                          )}
                          {application.status === 'Pending' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Pending
                            </span>
                          )}
                          {application.status === 'Rejected' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                              Rejected
                            </span>
                          )}
                        </td>
                        <td className="py-3 pl-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <Link
                              to={`/admin/applications/${application._id}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                            >
                              <Eye className="h-3 w-3 text-slate-500" />
                              <span>Review</span>
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDownloadPdf(application)}
                              disabled={downloadingId === application._id}
                              className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors shadow-2xs disabled:opacity-50"
                              title="Download official PDF letter"
                            >
                              {downloadingId === application._id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Download className="h-3 w-3" />
                              )}
                              <span>PDF</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Approved leave days taken: <strong className="text-slate-800">{summary?.approvedDays || 0}</strong></span>
            <Link
              to="/admin/applications"
              className="text-blue-600 font-semibold hover:underline"
            >
              All Administrative Applications &rarr;
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}