import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Search,
  UserX,
  UserCheck,
} from 'lucide-react';
import { usersApi } from '../../services/usersApi.js';
import Pagination from '../../components/admin/Pagination.jsx';
import StatusBadge from '../../components/admin/StatusBadge.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import UserFormDialog from '../../components/admin/UserFormDialog.jsx';
import TemporaryCredentialsDialog from '../../components/admin/TemporaryCredentialsDialog.jsx';

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
      showNotice(editing ? 'Account updated.' : 'Account created.');
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
          ? 'Account deactivated. Their session was ended.'
          : 'Account activated.'
      );
    } catch (err) {
      setStatusTarget(null);
      showNotice(err.message || 'Unable to change account status.');
    } finally {
      setStatusBusy(false);
    }
  }

  const inputClass =
    'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            {isStudent ? 'Students' : 'Teachers'}
          </h1>
          <p className="text-sm text-slate-500">
            Manage {isStudent ? 'student' : 'teacher'} accounts
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add {isStudent ? 'student' : 'teacher'}
        </button>
      </div>

      {notice && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {notice}
        </div>
      )}

      <form
        onSubmit={applyFilters}
        className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5"
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
            placeholder="Search name, email, username, ID…"
            className={`${inputClass} pl-9`}
          />
        </div>
        <select
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          className={inputClass}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <input
          type="text"
          value={form.department}
          onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
          placeholder="Department"
          className={inputClass}
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Search
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Clear
          </button>
        </div>
      </form>

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-10 text-slate-500">
          <span className="flex items-center gap-2 text-sm">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            Loading accounts…
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
          <p className="text-sm">
            No {isStudent ? 'students' : 'teachers'} match your filters.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-3 text-sm font-medium text-blue-600 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email / Username</th>
                  <th className="px-4 py-3 font-medium">
                    {isStudent ? 'Student ID' : 'Teacher ID'}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {isStudent ? 'Course' : 'Designation'}
                  </th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/${role}s/${user._id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {user.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="block">{user.email}</span>
                      <span className="block text-xs text-slate-500">@{user.username}</span>
                    </td>
                    <td className="px-4 py-3">{isStudent ? user.studentId : user.teacherId}</td>
                    <td className="px-4 py-3">
                      {isStudent ? user.course || '—' : user.designation || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={user.accountStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/admin/${role}s/${user._id}`}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                          aria-label={`View ${user.name}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => openEdit(user)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                          aria-label={`Edit ${user.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {user.accountStatus === 'active' ? (
                          <button
                            type="button"
                            onClick={() => setStatusTarget({ user, action: 'deactivate' })}
                            className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                            aria-label={`Deactivate ${user.name}`}
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setStatusTarget({ user, action: 'activate' })}
                            className="rounded-lg p-2 text-green-600 hover:bg-green-50"
                            aria-label={`Activate ${user.name}`}
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-200 p-4">
            <Pagination
              page={pagination?.page || 1}
              totalPages={pagination?.totalPages || 1}
              total={pagination?.total || 0}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}

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
          statusTarget?.action === 'deactivate' ? 'Deactivate account?' : 'Activate account?'
        }
        message={
          statusTarget?.action === 'deactivate'
            ? `${statusTarget.user.name} will not be able to sign in, and any active session will be ended.`
            : `${statusTarget.user.name} will be able to sign in again.`
        }
        confirmLabel={statusTarget?.action === 'deactivate' ? 'Deactivate' : 'Activate'}
        tone={statusTarget?.action === 'deactivate' ? 'danger' : 'default'}
        busy={statusBusy}
        onConfirm={confirmStatusChange}
        onCancel={() => setStatusTarget(null)}
      />
    </div>
  );
}