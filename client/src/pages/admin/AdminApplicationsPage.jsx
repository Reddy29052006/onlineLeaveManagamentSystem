import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  FileText,
  ListChecks,
  Loader2,
  Search,
  XCircle,
} from 'lucide-react';
import { leavesApi } from '../../services/leavesApi.js';
import { wsClient } from '../../services/websocket.js';
import Pagination from '../../components/admin/Pagination.jsx';
import LeaveStatusBadge from '../../components/leave/LeaveStatusBadge.jsx';
import LeaveDecisionDialog from '../../components/admin/LeaveDecisionDialog.jsx';

const PAGE_SIZE = 20;

const DEFAULTS = {
  q: '',
  status: '',
  role: '',
  department: '',
  startDateFrom: '',
  startDateTo: '',
  sortBy: 'submittedAt',
  sortOrder: 'desc',
};

function formatDateTime(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return '—';
  }
}

export default function AdminApplicationsPage() {
  const [form, setForm] = useState({ ...DEFAULTS });
  const [applied, setApplied] = useState({ ...DEFAULTS });
  const [page, setPage] = useState(1);

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [notice, setNotice] = useState('');
  const [decisionMode, setDecisionMode] = useState(null);
  const [decisionTarget, setDecisionTarget] = useState(null);
  const [decisionBusy, setDecisionBusy] = useState(false);
  const [decisionError, setDecisionError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await leavesApi.list({ page, limit: PAGE_SIZE, ...applied });
      setItems(response.data.items);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.message || 'Unable to load applications.');
      setItems([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [page, applied]);

  useEffect(() => {
    load();
    const unsub = wsClient.subscribe('application:submitted', () => {
      load();
    });
    return unsub;
  }, [load]);

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 5000);
  }

  function openDecision(mode, application) {
    setDecisionError(null);
    setDecisionTarget(application);
    setDecisionMode(mode);
  }

  function closeDecision() {
    setDecisionMode(null);
    setDecisionTarget(null);
    setDecisionError(null);
  }

  async function handleDecision({ rejectionReason, decisionNote }) {
    if (!decisionTarget) return;
    setDecisionBusy(true);
    setDecisionError(null);
    try {
      const response =
        decisionMode === 'reject'
          ? await leavesApi.reject(decisionTarget._id, { rejectionReason, decisionNote })
          : await leavesApi.approve(decisionTarget._id, { decisionNote });
      closeDecision();
      showNotice(response.message || 'Decision saved.');
      await load();
    } catch (err) {
      setDecisionError({ message: err.message, details: err.details });
    } finally {
      setDecisionBusy(false);
    }
  }

  function applyFilters(event) {
    if (event) event.preventDefault();
    setPage(1);
    setApplied({
      q: form.q.trim(),
      status: form.status,
      role: form.role,
      department: form.department.trim(),
      startDateFrom: form.startDateFrom,
      startDateTo: form.startDateTo,
      sortBy: form.sortBy,
      sortOrder: form.sortOrder,
    });
  }

  function clearFilters() {
    setForm({ ...DEFAULTS });
    setPage(1);
    setApplied({ ...DEFAULTS });
  }

  function changeSort(value) {
    const [sortBy, sortOrder] = value.split(':');
    setForm((f) => ({ ...f, sortBy, sortOrder }));
    setApplied((a) => ({ ...a, sortBy, sortOrder }));
    setPage(1);
  }

  const inputClass =
    'rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs sm:text-sm text-slate-800 outline-none transition-colors focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100';

  return (
    <div className="space-y-5">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-indigo-50/80 p-5 sm:p-6 shadow-2xs">
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100/80 px-3 py-0.5 text-xs font-semibold text-blue-800">
              <ListChecks className="h-3.5 w-3.5" /> Review Queue
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#182848]">
              Leave Applications
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-600">
              Review, approve, or reject submitted leave requests, and open the formal letter for any
              application.
            </p>
          </div>
          <div className="flex shrink-0 items-center">
            <span className="rounded-xl border border-blue-200/70 bg-white/90 px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs">
              {pagination?.total || 0} application(s)
            </span>
          </div>
        </div>
      </section>

      {notice && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs sm:text-sm font-medium text-emerald-700 shadow-2xs"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          {notice}
        </div>
      )}

      {/* Filters */}
      <form
        onSubmit={applyFilters}
        className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="relative lg:col-span-2">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="text"
            value={form.q}
            onChange={(e) => setForm((f) => ({ ...f, q: e.target.value }))}
            placeholder="Search application ID, applicant, purpose…"
            className={`${inputClass} w-full pl-9`}
          />
        </div>
        <select
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          className={inputClass}
        >
          <option value="">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
        <select
          value={form.role}
          onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          className={inputClass}
        >
          <option value="">All roles</option>
          <option value="student">Students</option>
          <option value="teacher">Teachers</option>
        </select>
        <input
          type="text"
          value={form.department}
          onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
          placeholder="Department"
          className={inputClass}
        />
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
          Start date from
          <input
            type="date"
            value={form.startDateFrom}
            onChange={(e) => setForm((f) => ({ ...f, startDateFrom: e.target.value }))}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
          Start date to
          <input
            type="date"
            value={form.startDateTo}
            onChange={(e) => setForm((f) => ({ ...f, startDateTo: e.target.value }))}
            className={inputClass}
          />
        </label>
        <div className="flex gap-2 lg:col-span-2">
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors hover:bg-blue-700"
          >
            Search
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-slate-600 shadow-2xs transition-colors hover:bg-slate-50"
          >
            Clear
          </button>
        </div>
      </form>

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-10 text-slate-500 shadow-2xs">
          <span className="flex items-center gap-2 text-sm">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" aria-hidden="true" />
            Loading applications…
          </span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            {error}
          </p>
          <button
            type="button"
            onClick={load}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          <p className="text-sm">No applications match your filters.</p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-3 text-sm font-medium text-blue-600 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <span className="text-xs sm:text-sm font-medium text-slate-500">
              {pagination?.total || 0} application(s)
            </span>
            <label className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
              Sort
              <select
                value={`${form.sortBy}:${form.sortOrder}`}
                onChange={(e) => changeSort(e.target.value)}
                className={inputClass}
              >
                <option value="submittedAt:desc">Newest submitted</option>
                <option value="submittedAt:asc">Oldest submitted</option>
                <option value="startDate:asc">Start date (earliest)</option>
                <option value="startDate:desc">Start date (latest)</option>
                <option value="applicantNameSnapshot:asc">Applicant (A–Z)</option>
              </select>
            </label>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Application</th>
                  <th className="px-4 py-3 font-semibold">Applicant</th>
                  <th className="px-4 py-3 font-semibold">Dates</th>
                  <th className="px-4 py-3 font-semibold">Days</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Submitted</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((application) => {
                  const isPending = application.status === 'Pending';
                  return (
                    <tr key={application._id} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/applications/${application._id}`}
                          className="font-mono text-xs font-semibold text-blue-600 hover:underline"
                        >
                          {application.applicationId}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="block font-medium text-slate-800">
                          {application.applicantNameSnapshot}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {application.applicantRoleSnapshot} ·{' '}
                          {application.applicantIdSnapshot || '—'}
                          {application.departmentSnapshot
                            ? ` · ${application.departmentSnapshot}`
                            : ''}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                        {application.startDate} → {application.endDate}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {application.requestedPolicyDays}
                      </td>
                      <td className="px-4 py-3">
                        <LeaveStatusBadge status={application.status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                        {formatDateTime(application.submittedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/admin/applications/${application._id}`}
                            title="View letter"
                            aria-label={`View letter for ${application.applicationId}`}
                            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                          >
                            <FileText className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/admin/applications/${application._id}`}
                            title="View details"
                            aria-label={`View ${application.applicationId}`}
                            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => openDecision('approve', application)}
                                title="Approve"
                                aria-label={`Approve ${application.applicationId}`}
                                className="rounded-lg bg-emerald-600 p-2 text-white shadow-2xs transition-colors hover:bg-emerald-700"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openDecision('reject', application)}
                                title="Reject"
                                aria-label={`Reject ${application.applicationId}`}
                                className="rounded-lg bg-rose-600 p-2 text-white shadow-2xs transition-colors hover:bg-rose-700"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 p-4">
            <Pagination
              page={pagination?.page || 1}
              totalPages={pagination?.totalPages || 1}
              total={pagination?.total || 0}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}

      <LeaveDecisionDialog
        open={decisionMode !== null}
        mode={decisionMode}
        application={decisionTarget}
        busy={decisionBusy}
        error={decisionError}
        onClose={closeDecision}
        onSubmit={handleDecision}
      />
    </div>
  );
}
