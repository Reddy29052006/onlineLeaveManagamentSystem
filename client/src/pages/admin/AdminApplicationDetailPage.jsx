import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { leavesApi } from '../../services/leavesApi.js';
import { wsClient } from '../../services/websocket.js';
import LeaveStatusBadge from '../../components/leave/LeaveStatusBadge.jsx';
import LetterView from '../../components/leave/LetterView.jsx';
import LeaveDecisionDialog from '../../components/admin/LeaveDecisionDialog.jsx';
import { ROLE_LABELS } from '../../routes/roleHome.js';

function formatDateTime(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return '—';
  }
}

function InfoRow({ label, value }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 font-medium text-slate-800">{value || '—'}</dd>
    </div>
  );
}

export default function AdminApplicationDetailPage() {
  const { id } = useParams();

  const [application, setApplication] = useState(null);
  const [letter, setLetter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [notice, setNotice] = useState('');
  const [decisionMode, setDecisionMode] = useState(null);
  const [decisionBusy, setDecisionBusy] = useState(false);
  const [decisionError, setDecisionError] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await leavesApi.get(id);
      setApplication(response.data.application);
      setLetter(response.data.letter);
    } catch (err) {
      setError(err.message || 'Unable to load the application.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    const unsub = wsClient.subscribe('leave:update', (updated) => {
      if (!updated || updated._id === id || updated.applicationId === id) {
        load();
      }
    });
    return unsub;
  }, [load, id]);

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 5000);
  }

  async function handleDecision({ rejectionReason, decisionNote }) {
    setDecisionBusy(true);
    setDecisionError(null);
    try {
      const response =
        decisionMode === 'reject'
          ? await leavesApi.reject(id, { rejectionReason, decisionNote })
          : await leavesApi.approve(id, { decisionNote });
      setDecisionMode(null);
      setApplication(response.data.application);
      showNotice(response.message || 'Decision saved.');
      await load();
    } catch (err) {
      setDecisionError({ message: err.message, details: err.details });
    } finally {
      setDecisionBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-10 text-slate-500">
        <span className="flex items-center gap-2 text-sm">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          Loading application…
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
        <Link to="/admin/applications" className="text-sm font-medium underline">
          Back to applications
        </Link>
      </div>
    );
  }

  const isPending = application.status === 'Pending';

  async function handleDownloadPdf() {
    setDownloadingPdf(true);
    try {
      await leavesApi.downloadPdf(id, `Leave_${application?.applicationId || id}.pdf`);
    } catch (err) {
      alert(err.message || 'Error downloading official PDF.');
    } finally {
      setDownloadingPdf(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="no-print flex items-center justify-between text-sm">
        <Link
          to="/admin/applications"
          className="inline-flex items-center gap-2 font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to applications
        </Link>
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={downloadingPdf}
          className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 shadow-2xs transition-colors disabled:opacity-50"
        >
          <span>Download PDF</span>
        </button>
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {notice}
        </div>
      )}

      <section className="no-print rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Application ID</p>
            <h1 className="text-xl font-semibold text-slate-900">
              {application.applicationId}
            </h1>
          </div>
          <LeaveStatusBadge status={application.status} />
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <InfoRow label="Applicant" value={application.applicantNameSnapshot} />
          <InfoRow
            label="Role"
            value={ROLE_LABELS[application.applicantRoleSnapshot] || application.applicantRoleSnapshot}
          />
          <InfoRow
            label={application.applicantRoleSnapshot === 'student' ? 'Student ID' : 'Teacher ID'}
            value={application.applicantIdSnapshot}
          />
          <InfoRow label="Department" value={application.departmentSnapshot} />
          <InfoRow
            label={
              application.applicantRoleSnapshot === 'student'
                ? 'Course / class'
                : 'Designation'
            }
            value={application.classOrDesignationSnapshot}
          />
          <InfoRow label="Submitted" value={formatDateTime(application.submittedAt)} />
          <InfoRow label="From" value={application.startDate} />
          <InfoRow label="To" value={application.endDate} />
          <InfoRow
            label="Days"
            value={`${application.requestedPolicyDays} (of ${application.requestedCalendarDays} calendar)`}
          />
          <div className="col-span-2 sm:col-span-3">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Purpose</dt>
            <dd className="mt-1 whitespace-pre-wrap text-slate-800">{application.purpose}</dd>
          </div>
        </dl>

        {!isPending && (
          <div
            className={`mt-5 rounded-lg border p-4 text-sm ${
              application.status === 'Approved'
                ? 'border-green-200 bg-green-50 text-green-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            <p className="font-medium">Decision: {application.status}</p>
            <p className="mt-1">Decided on: {formatDateTime(application.decisionAt)}</p>
            {application.rejectionReason && (
              <p className="mt-1">Reason: {application.rejectionReason}</p>
            )}
            {application.decisionNote && (
              <p className="mt-1">Note: {application.decisionNote}</p>
            )}
          </div>
        )}

        {isPending && (
          <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={() => {
                setDecisionError(null);
                setDecisionMode('approve');
              }}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Approve
            </button>
            <button
              type="button"
              onClick={() => {
                setDecisionError(null);
                setDecisionMode('reject');
              }}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <XCircle className="h-4 w-4" aria-hidden="true" />
              Reject
            </button>
          </div>
        )}
      </section>

      <LetterView
        content={letter?.content}
        onDownloadPdf={handleDownloadPdf}
        downloading={downloadingPdf}
      />

      <LeaveDecisionDialog
        open={decisionMode !== null}
        mode={decisionMode}
        application={application}
        busy={decisionBusy}
        error={decisionError}
        onClose={() => {
          setDecisionMode(null);
          setDecisionError(null);
        }}
        onSubmit={handleDecision}
      />
    </div>
  );
}
