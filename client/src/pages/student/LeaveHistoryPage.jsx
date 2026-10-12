import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileClock,
  FilePlus,
  FileText,
  Loader2,
  Printer,
  Search,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext.jsx';
import { leavesApi } from '../../services/leavesApi.js';
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

export default function LeaveHistoryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation();
  const isTeacherRoute = location.pathname.startsWith('/teacher');
  const base = isTeacherRoute ? '/teacher' : (user?.role === 'teacher' ? '/teacher' : '/student');

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      const response = await leavesApi.mine(params);
      setItems(response.data.items || []);
      setPagination(response.data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Unable to load leave history.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load(1);
  }, [load]);

  // Client-side search filtering
  const filteredItems = items.filter((item) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      item.applicationId?.toLowerCase().includes(q) ||
      item.purpose?.toLowerCase().includes(q) ||
      item.startDate?.includes(q) ||
      item.endDate?.includes(q)
    );
  });

  // Calculate local stats from loaded records
  const stats = items.reduce(
    (acc, cur) => {
      acc.total++;
      if (cur.status === 'Approved') {
        acc.approved++;
        acc.approvedDays += cur.requestedPolicyDays || cur.requestedCalendarDays || 0;
      } else if (cur.status === 'Pending') {
        acc.pending++;
      } else if (cur.status === 'Rejected') {
        acc.rejected++;
      }
      return acc;
    },
    { total: 0, approved: 0, pending: 0, rejected: 0, approvedDays: 0 }
  );

  async function handleDownloadPdf(item) {
    setDownloadingId(item._id);
    try {
      await leavesApi.downloadPdf(item._id, `Leave_${item.applicationId}.pdf`);
    } catch (err) {
      alert(err.message || 'Error downloading PDF.');
    } finally {
      setDownloadingId(null);
    }
  }

  function handlePrint(item) {
    // Navigate to detail page where print view is available
    window.open(`${base}/applications/${item._id}?print=true`, '_blank');
  }

  return (
    <div className="space-y-6">
      {/* 1. LeaveHub Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-indigo-50/80 p-5 sm:p-6 shadow-2xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="max-w-xl space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#182848]">
              Leave History &amp; Official Records
            </h1>
            <p className="text-sm font-semibold text-slate-700">
              View historical requests, track decision rationales &amp; download official letters
            </p>
            <p className="text-xs font-medium text-blue-700 tracking-wide">
              Inspect Decisions &bull; Export Signed Letters &bull; Verify Allotments
            </p>

            <div className="pt-2">
              <Link
                to={`${base}/apply`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all hover:bg-emerald-700 hover:shadow-sm"
              >
                <FilePlus className="h-4 w-4" />
                Apply for New Leave
              </Link>
            </div>
          </div>

          {/* Right Banner Badge */}
          <div className="flex shrink-0 items-center justify-center">
            <div className="relative flex flex-col items-center rounded-xl border border-blue-200/60 bg-white/80 p-3 shadow-2xs backdrop-blur-xs">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-2xs">
                  <FileClock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                    Audit Archive
                  </p>
                  <p className="text-xs font-bold text-slate-800">{pagination.total} Records Filed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Four Pastel Stat KPI Cards */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          tone="blue"
          icon={FileText}
          label="Total Applications"
          subtitle="All filed submissions"
          value={pagination.total}
        />
        <StatCard
          tone="green"
          icon={CheckCircle2}
          label="Approved Leaves"
          subtitle={`${stats.approvedDays} total days granted`}
          value={stats.approved}
        />
        <StatCard
          tone="amber"
          icon={Clock}
          label="Pending Review"
          subtitle="Awaiting administration"
          value={stats.pending}
        />
        <StatCard
          tone="rose"
          icon={XCircle}
          label="Declined Requests"
          subtitle="Rejected applications"
          value={stats.rejected}
        />
      </section>

      {/* 3. Search and Status Filter Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter('')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              statusFilter === ''
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            All ({pagination.total})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('Approved')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              statusFilter === 'Approved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Approved
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('Pending')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              statusFilter === 'Pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Pending
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('Rejected')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              statusFilter === 'Rejected'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Rejected
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID or purpose…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden"
          />
        </div>
      </div>

      {/* 4. History Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-slate-500">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              Loading leave records…
            </span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-between p-6 text-red-600 bg-red-50/50">
            <span className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </span>
            <button
              type="button"
              onClick={() => load(1)}
              className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Calendar className="mx-auto mb-2 h-10 w-10 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No leave records found</p>
            <p className="mt-1 text-xs text-slate-400">
              {statusFilter
                ? `No applications with status "${statusFilter}".`
                : 'You have not submitted any leave applications yet.'}
            </p>
            <div className="mt-4">
              <Link
                to={`${base}/apply`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs"
              >
                <FilePlus className="h-3.5 w-3.5" />
                Apply for Leave
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 pl-5 pr-3 font-semibold">Application</th>
                  <th className="py-3.5 px-3 font-semibold">Submitted</th>
                  <th className="py-3.5 px-3 font-semibold">Leave Period</th>
                  <th className="py-3.5 px-3 font-semibold">Duration</th>
                  <th className="py-3.5 px-3 font-semibold">Purpose</th>
                  <th className="py-3.5 px-3 font-semibold">Status</th>
                  <th className="py-3.5 pl-3 pr-5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredItems.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Application ID */}
                    <td className="py-3.5 pl-5 pr-3">
                      <Link
                        to={`${base}/applications/${item._id}`}
                        className="font-mono font-bold text-blue-600 hover:underline block"
                      >
                        {item.applicationId}
                      </Link>
                    </td>

                    {/* Submitted Date */}
                    <td className="py-3.5 px-3 whitespace-nowrap text-slate-500 font-medium">
                      {formatDate(item.submittedAt)}
                    </td>

                    {/* Period */}
                    <td className="py-3.5 px-3 whitespace-nowrap font-medium text-slate-900">
                      <div>{item.startDate}</div>
                      <div className="text-[11px] text-slate-400 font-normal">to {item.endDate}</div>
                    </td>

                    {/* Duration */}
                    <td className="py-3.5 px-3 whitespace-nowrap font-semibold text-slate-900">
                      {item.requestedPolicyDays ?? item.requestedCalendarDays} days
                      <span className="block text-[10px] font-normal text-slate-400">
                        ({item.requestedCalendarDays} cal)
                      </span>
                    </td>

                    {/* Purpose */}
                    <td className="py-3.5 px-3 max-w-[200px]">
                      <p className="line-clamp-2 text-slate-700" title={item.purpose}>
                        {item.purpose}
                      </p>
                      {item.rejectionReason && item.status === 'Rejected' && (
                        <p className="mt-1 text-[11px] font-medium text-rose-700 line-clamp-1 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                          Declined: {item.rejectionReason}
                        </p>
                      )}
                    </td>

                    {/* Status Pill Badge */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {item.status === 'Approved' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200/60">
                          <CheckCircle2 className="h-3 w-3" /> Approved
                        </span>
                      )}
                      {item.status === 'Pending' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200/60">
                          <Clock className="h-3 w-3" /> Pending
                        </span>
                      )}
                      {item.status === 'Rejected' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200/60">
                          <XCircle className="h-3 w-3" /> Rejected
                        </span>
                      )}
                      {item.decisionAt && (
                        <div className="mt-0.5 text-[10px] text-slate-400">
                          {formatDate(item.decisionAt)}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 pl-3 pr-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          to={`${base}/applications/${item._id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                          title="View formal letter details"
                        >
                          <Eye className="h-3 w-3 text-slate-500" />
                          <span>View</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(item)}
                          disabled={downloadingId === item._id}
                          className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 transition-colors shadow-2xs disabled:opacity-50"
                          title="Download official PDF"
                        >
                          {downloadingId === item._id ? (
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

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs text-slate-600">
            <span>
              Page <strong className="font-bold text-slate-900">{pagination.page}</strong> of{' '}
              <strong className="font-bold text-slate-900">{pagination.totalPages}</strong> (
              {pagination.total} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => load(pagination.page - 1)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 shadow-2xs"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => load(pagination.page + 1)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 shadow-2xs"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
