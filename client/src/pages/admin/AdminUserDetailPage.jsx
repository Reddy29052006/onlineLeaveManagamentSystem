import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Download, Loader2 } from 'lucide-react';
import { usersApi } from '../../services/usersApi.js';
import { leavesApi } from '../../services/leavesApi.js';
import StatusBadge from '../../components/admin/StatusBadge.jsx';
import { ROLE_LABELS } from '../../routes/roleHome.js';

function InfoRow({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="font-semibold text-slate-800">{value || '—'}</dd>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}

const STATUS_STYLES = {
  Pending: 'bg-amber-100 text-amber-700',
  Approved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
};

export default function AdminUserDetailPage({ role }) {
  const { id } = useParams();
  const isStudent = role === 'student';

  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      setRecent(summaryResponse.data.recentApplications);
    } catch (err) {
      setError(err.message || 'Unable to load account.');
    } finally {
      setLoading(false);
    }
  }, [role, id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-10 text-slate-500">
        <span className="flex items-center gap-2 text-sm">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          Loading account…
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
        <Link to={`/admin/${role}s`} className="text-sm font-medium underline">
          Back to {role}s
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to={`/admin/${role}s`}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to {role}s
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{user.name}</h1>
          <p className="text-sm text-slate-500">
            {ROLE_LABELS[user.role]} · @{user.username}
          </p>
        </div>
        <StatusBadge status={user.accountStatus} />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-medium text-slate-900">Profile</h2>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <InfoRow label="Email" value={user.email} />
          <InfoRow label={isStudent ? 'Student ID' : 'Teacher ID'} value={isStudent ? user.studentId : user.teacherId} />
          {isStudent ? (
            <>
              <InfoRow label="Course" value={user.course} />
              <InfoRow label="Department" value={user.department} />
              <InfoRow label="Year" value={user.year} />
              <InfoRow label="Section" value={user.section} />
            </>
          ) : (
            <>
              <InfoRow label="Designation" value={user.designation} />
              <InfoRow label="Department" value={user.department} />
            </>
          )}
          <InfoRow label="Phone" value={user.phone} />
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-medium text-slate-900">Leave summary</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard label="Total" value={summary.total} />
          <SummaryCard label="Pending" value={summary.pending} />
          <SummaryCard label="Approved" value={summary.approved} />
          <SummaryCard label="Rejected" value={summary.rejected} />
        </div>
        <p className="mt-3 text-sm text-slate-500">
          Approved days: <span className="font-semibold text-slate-700">{summary.approvedDays}</span>
        </p>

        <h3 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Recent applications
        </h3>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-500">No leave applications yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 pr-4 font-medium">Application</th>
                  <th className="py-2 pr-4 font-medium">Dates</th>
                  <th className="py-2 pr-4 font-medium">Days</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pl-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent.map((application) => (
                  <tr key={application._id}>
                    <td className="py-2 pr-4 font-medium">
                      <Link
                        to={`/admin/applications/${application._id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {application.applicationId}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 text-slate-600">
                      {application.startDate} → {application.endDate}
                    </td>
                    <td className="py-2 pr-4 text-slate-600">
                      {application.requestedPolicyDays}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          STATUS_STYLES[application.status] || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {application.status}
                      </span>
                    </td>
                    <td className="py-2 pl-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          to={`/admin/applications/${application._id}`}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Review
                        </Link>
                        <button
                          type="button"
                          onClick={() =>
                            leavesApi.downloadPdf(
                              application._id,
                              `Leave_${application.applicationId}.pdf`
                            )
                          }
                          className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                          title="Download PDF"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}