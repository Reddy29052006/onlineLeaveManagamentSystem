import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Eye,
  Filter,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  UserCheck,
  UserX,
  Users,
  XCircle,
} from 'lucide-react';
import { usersApi } from '../../services/usersApi.js';
import Pagination from '../../components/admin/Pagination.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import UserFormDialog from '../../components/admin/UserFormDialog.jsx';
import TemporaryCredentialsDialog from '../../components/admin/TemporaryCredentialsDialog.jsx';
import StatCard from '../../components/StatCard.jsx';

const PAGE_SIZE = 20;

const DEFAULTS = {
  q: '',
  status: '',
  department: '',
  course: '',
  year: '',
  sort: 'createdAt',
  order: 'desc',
};

const AVATAR_GRADIENTS = [
  'from-blue-500 to-indigo-600 text-white',
  'from-emerald-500 to-teal-600 text-white',
  'from-amber-500 to-orange-600 text-white',
  'from-purple-500 to-pink-600 text-white',
  'from-cyan-500 to-blue-600 text-white',
  'from-rose-500 to-red-600 text-white',
];

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (!parts.length || !parts[0]) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarStyle(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
}

export default function AdminUsersPage({ role }) {
  const isStudent = role === 'student';

  const [form, setForm] = useState({ ...DEFAULTS });
  const [applied, setApplied] = useState({ ...DEFAULTS });
  const [page, setPage] = useState(1);

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [notice, setNotice] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState(null);
  const [createdCreds, setCreatedCreds] = useState(null);

  const [statusTarget, setStatusTarget] = useState(null);
  const [statusBusy, setStatusBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await usersApi.list(role, { page, limit: PAGE_SIZE, ...applied });
      setItems(response.data.items);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.message || 'Unable to load accounts.');
      setItems([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [role, page, applied]);

  useEffect(() => {
    load();
  }, [load]);

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 4000);
  }

  function applyFilters(event) {
    if (event) event.preventDefault();
    setPage(1);
    setApplied({
      q: form.q.trim(),
      status: form.status,
      department: form.department.trim(),
      course: form.course.trim(),
      year: form.year.trim(),
      sort: form.sort,
      order: form.order,
    });
  }

  function handleStatusTab(status) {
    const nextStatus = form.status === status ? '' : status;
    setForm((f) => ({ ...f, status: nextStatus }));
    setPage(1);
    setApplied((prev) => ({ ...prev, status: nextStatus }));
  }

  function clearFilters() {
    setForm({ ...DEFAULTS });
    setPage(1);
    setApplied({ ...DEFAULTS });
  }

  function openCreate() {
    setEditing(null);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(user) {
    setEditing(user);
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSubmit(payload) {
    setFormBusy(true);
    setFormError(null);
    try {
      const response = editing
        ? await usersApi.update(role, editing._id, payload)
        : await usersApi.create(role, payload);
      setFormOpen(false);
      await load();
      if (!editing && response.data.temporaryPassword) {
        setCreatedCreds({
          user: response.data.user,
          temporaryPassword: response.data.temporaryPassword,
        });
      }
      showNotice(editing ? 'Account updated successfully.' : 'New account created successfully.');
    } catch (err) {
      setFormError({ message: err.message, details: err.details });
    } finally {
      setFormBusy(false);
    }
  }

  async function confirmStatusChange() {
    if (!statusTarget) return;
    setStatusBusy(true);
    try {
      const nextStatus = statusTarget.action === 'deactivate' ? 'inactive' : 'active';
      await usersApi.setStatus(role, statusTarget.user._id, nextStatus);
      setStatusTarget(null);
      await load();
      showNotice(
        statusTarget.action === 'deactivate'
          ? 'Account deactivated. Any active session has been revoked.'
          : 'Account activated successfully.'
      );
    } catch (err) {
      setStatusTarget(null);
      showNotice(err.message || 'Unable to change account status.');
    } finally {
      setStatusBusy(false);
    }
  }

  // Derive summary metrics
  const activeCount = useMemo(() => items.filter((u) => u.accountStatus === 'active').length, [items]);
  const inactiveCount = useMemo(() => items.filter((u) => u.accountStatus === 'inactive').length, [items]);
  const uniqueDepartments = useMemo(() => {
    const set = new Set();
    items.forEach((u) => {
      if (u.department) set.add(u.department);
    });
    return Array.from(set);
  }, [items]);

  const totalUsers = pagination?.total ?? items.length;

  return (
    <div className="space-y-6">
      {/* 1. Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-indigo-50/80 p-5 sm:p-6 shadow-2xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100/80 px-3 py-1 text-xs font-semibold text-blue-800">
              {isStudent ? (
                <>
                  <GraduationCap className="h-3.5 w-3.5" /> Student Roster Management
                </>
              ) : (
                <>
                  <Users className="h-3.5 w-3.5" /> Faculty & Staff Directory
                </>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#182848]">
              {isStudent ? 'Student Directory & Accounts' : 'Faculty & Teacher Directory'}
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-600">
              {isStudent
                ? 'Manage active student enrollments, academic departments, credentials, and leave eligibility.'
                : 'Oversee faculty appointments, departmental designations, permissions, and leave privileges.'}
            </p>

            <div className="pt-1 flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs border border-blue-100">
                {totalUsers} {isStudent ? 'Students' : 'Teachers'} Registered
              </span>
              <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-2xs border border-emerald-100">
                {activeCount} Active in view
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center">
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all hover:bg-blue-700 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {isStudent ? 'Enrol New Student' : 'Add New Teacher'}
            </button>
          </div>
        </div>
      </section>

      {/* 2. Four Pastel Stat Cards */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          tone="blue"
          icon={isStudent ? GraduationCap : Users}
          label={isStudent ? 'Total Enrolled' : 'Total Faculty'}
          subtitle="Directory Records"
          value={totalUsers}
        />
        <StatCard
          tone="green"
          icon={UserCheck}
          label="Active Accounts"
          subtitle="Eligible for Login"
          value={activeCount}
        />
        <StatCard
          tone="rose"
          icon={UserX}
          label="Inactive / Suspended"
          subtitle="Revoked Access"
          value={inactiveCount}
        />
        <StatCard
          tone="purple"
          icon={Building2}
          label="Departments"
          subtitle="Represented"
          value={uniqueDepartments.length || 1}
        />
      </section>

      {/* Notice Toast / Alert */}
      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs sm:text-sm font-medium text-emerald-800 shadow-2xs animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* 3. Search and Filtering Bar */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
        <form onSubmit={applyFilters} className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={form.q}
              onChange={(e) => setForm((f) => ({ ...f, q: e.target.value }))}
              placeholder={`Search by name, email, @username, or ${isStudent ? 'Roll/Student ID' : 'Employee ID'}…`}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Department Filter */}
          <div className="w-full md:w-52">
            <input
              type="text"
              value={form.department}
              onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              placeholder="Filter Department…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#132238] px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-2xs transition-colors hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <Search className="h-3.5 w-3.5" />
              Filter
            </button>
            <button
              type="button"
              onClick={clearFilters}
              title="Reset all filters"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </form>

        {/* Quick Status Tabs Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1 text-xs">
            <span className="font-semibold text-slate-500 mr-1.5 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Status:
            </span>
            <button
              type="button"
              onClick={() => handleStatusTab('')}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-colors ${
                !form.status
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => handleStatusTab('active')}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-colors ${
                form.status === 'active'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => handleStatusTab('inactive')}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-colors ${
                form.status === 'inactive'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              Inactive
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            Showing {items.length} of {totalUsers} accounts
          </div>
        </div>
      </div>

      {/* 4. Table / Content Section */}
      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200/90 bg-white p-12 text-slate-500 shadow-2xs">
          <span className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" aria-hidden="true" />
            Loading {isStudent ? 'students' : 'faculty'} directory…
          </span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-2xs">
          <p className="flex items-center gap-2 font-medium text-sm">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            {error}
          </p>
          <button
            type="button"
            onClick={load}
            className="rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500 shadow-2xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
            {isStudent ? <GraduationCap className="h-6 w-6" /> : <Users className="h-6 w-6" />}
          </div>
          <p className="text-sm font-semibold text-slate-800">
            No {isStudent ? 'students' : 'teachers'} found matching your search.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Try adjusting your search filters or add a new account.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs sm:text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Account / Name</th>
                  <th className="px-4 py-3.5">Identifier</th>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5">{isStudent ? 'Course / Year' : 'Designation'}</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((user) => {
                  const avatarGradient = getAvatarStyle(user.name || user.username);
                  const initials = getInitials(user.name);

                  return (
                    <tr key={user._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Avatar */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${avatarGradient} text-xs font-bold shadow-2xs`}
                          >
                            {initials}
                          </div>
                          <div>
                            <Link
                              to={`/admin/${role}s/${user._id}`}
                              className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                            >
                              {user.name}
                            </Link>
                            <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                              <span>{user.email}</span>
                              <span className="text-slate-300">&bull;</span>
                              <span className="font-mono text-slate-400">@{user.username}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Identifier */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700 border border-slate-200/60">
                          {isStudent ? user.studentId || '—' : user.teacherId || '—'}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                          {user.department || 'General'}
                        </span>
                      </td>

                      {/* Course / Designation */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-600">
                        {isStudent ? (
                          <span>
                            {user.course || '—'}
                            {user.year ? ` • Year ${user.year}` : ''}
                          </span>
                        ) : (
                          <span>{user.designation || 'Faculty'}</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {user.accountStatus === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100/80 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/admin/${role}s/${user._id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                            title={`View profile of ${user.name}`}
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-500" />
                            <span>View</span>
                          </Link>

                          <button
                            type="button"
                            onClick={() => openEdit(user)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                            title={`Edit ${user.name}`}
                          >
                            <Pencil className="h-3.5 w-3.5 text-slate-500" />
                            <span>Edit</span>
                          </button>

                          {user.accountStatus === 'active' ? (
                            <button
                              type="button"
                              onClick={() => setStatusTarget({ user, action: 'deactivate' })}
                              className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-700 hover:bg-rose-100 transition-colors"
                              title={`Deactivate account of ${user.name}`}
                            >
                              <UserX className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setStatusTarget({ user, action: 'activate' })}
                              className="rounded-lg border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-700 hover:bg-emerald-100 transition-colors"
                              title={`Activate account of ${user.name}`}
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-100 p-4 bg-slate-50/50">
            <Pagination
              page={pagination?.page || 1}
              totalPages={pagination?.totalPages || 1}
              total={pagination?.total || 0}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}

      {/* Modals and Dialogs */}
      <UserFormDialog
        open={formOpen}
        role={role}
        editing={editing}
        busy={formBusy}
        error={formError}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <TemporaryCredentialsDialog
        open={createdCreds !== null}
        user={createdCreds?.user}
        temporaryPassword={createdCreds?.temporaryPassword}
        onClose={() => setCreatedCreds(null)}
      />

      <ConfirmDialog
        open={statusTarget !== null}
        title={
          statusTarget?.action === 'deactivate'
            ? 'Deactivate User Account?'
            : 'Activate User Account?'
        }
        message={
          statusTarget?.action === 'deactivate'
            ? `${statusTarget.user.name} will be prohibited from signing in, and any ongoing session will be terminated immediately.`
            : `${statusTarget.user.name} will have their account restored and will be able to sign into the system again.`
        }
        confirmLabel={statusTarget?.action === 'deactivate' ? 'Deactivate Account' : 'Activate Account'}
        tone={statusTarget?.action === 'deactivate' ? 'danger' : 'default'}
        busy={statusBusy}
        onConfirm={confirmStatusChange}
        onCancel={() => setStatusTarget(null)}
      />
    </div>
  );
}