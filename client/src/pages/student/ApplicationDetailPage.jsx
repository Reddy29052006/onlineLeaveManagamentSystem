import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import { leavesApi } from '../../services/leavesApi.js';
import { wsClient } from '../../services/websocket.js';
import { useAuth } from '../../features/auth/AuthContext.jsx';
import LeaveStatusBadge from '../../components/leave/LeaveStatusBadge.jsx';
import LetterView from '../../components/leave/LetterView.jsx';

function formatDateTime(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return '—';
  }
}

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const base = `/${user?.role || ''}`;

  const [application, setApplication] = useState(null);
  const [letter, setLetter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        <Link to={`${base}/apply`} className="text-sm font-medium underline">
          Back to leave form
        </Link>
      </div>
    );
  }

  const [downloadingPdf, setDownloadingPdf] = useState(false);

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
      <div className="no-print flex items-center justify-between gap-2 text-sm">
        <Link
          to={base}
          className="inline-flex items-center gap-2 font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to={`${base}/history`}
            className="text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            Leave History
          </Link>
          <span className="text-slate-300">&bull;</span>
          <Link
            to={`${base}/calendar`}
            className="text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            Calendar
          </Link>
          <span className="text-slate-300">&bull;</span>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 shadow-2xs transition-colors disabled:opacity-50"
          >
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      <section className="no-print rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Application ID
            </p>
            <h1 className="text-xl font-semibold text-slate-900">
              {application.applicationId}
            </h1>
          </div>
          <LeaveStatusBadge status={application.status} />
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">From</dt>
            <dd className="font-medium">{application.startDate}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">To</dt>
            <dd className="font-medium">{application.endDate}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Calendar days</dt>
            <dd className="font-medium">{application.requestedCalendarDays}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Leave days</dt>
            <dd className="font-medium">{application.requestedPolicyDays}</dd>
          </div>
          <div className="col-span-2 sm:col-span-4">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Purpose</dt>
            <dd className="mt-1 whitespace-pre-wrap">{application.purpose}</dd>
          </div>
          <div className="col-span-2 sm:col-span-4">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Submitted</dt>
            <dd className="mt-1">{formatDateTime(application.submittedAt)}</dd>
          </div>
        </dl>

        {application.status !== 'Pending' && (
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
      </section>

      <LetterView
        content={letter?.content}
        onDownloadPdf={handleDownloadPdf}
        downloading={downloadingPdf}
      />
    </div>
  );
}
