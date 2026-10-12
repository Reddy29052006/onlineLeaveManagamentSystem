import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  FileText,
  Loader2,
  Printer,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { leavesApi } from '../../services/leavesApi.js';
import { wsClient } from '../../services/websocket.js';
import { useAuth } from '../../features/auth/AuthContext.jsx';
import LetterView from '../../components/leave/LetterView.jsx';
import StatCard from '../../components/StatCard.jsx';

function formatDateTime(value) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return '—';
  }
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

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const isTeacherRoute = location.pathname.startsWith('/teacher');
  const base = isTeacherRoute ? '/teacher' : (user?.role === 'teacher' ? '/teacher' : '/student');

  const [application, setApplication] = useState(null);
  const [letter, setLetter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-200/90 bg-white p-12 text-slate-500 shadow-2xs">
        <span className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" aria-hidden="true" />
          Loading application and letterhead…
        </span>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-2xs">
        <p className="flex items-center gap-2 font-medium text-sm">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          {error || 'Application not found.'}
        </p>
        <Link
          to={`${base}/history`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-800 underline hover:text-rose-950"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Leave History
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Breadcrumbs & Actions Bar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link
          to={`${base}/history`}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Leave History
        </Link>

        <div className="flex items-center gap-2.5">
          <Link
            to={base}
            className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
          >
            Dashboard
          </Link>
          <span className="text-slate-300">&bull;</span>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 shadow-2xs transition-colors disabled:opacity-50"
          >
            {downloadingPdf ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span>Download Official PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Hero Application Banner */}
      <section className="no-print relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-indigo-50/80 p-5 sm:p-6 shadow-2xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100/80 px-2.5 py-0.5 text-[11px] font-semibold text-blue-800">
              <FileCheck className="h-3 w-3" /> Official Leave Application
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#182848]">
              {application.applicationId}
            </h1>
            <p className="text-xs text-slate-600">
              Submitted on {formatDateTime(application.submittedAt)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {application.status === 'Approved' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-bold text-emerald-800 shadow-2xs border border-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Approved by Administration
              </span>
            )}
            {application.status === 'Pending' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3.5 py-1 text-xs font-bold text-amber-800 shadow-2xs border border-amber-200">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                Pending Administrative Review
              </span>
            )}
            {application.status === 'Rejected' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3.5 py-1 text-xs font-bold text-rose-800 shadow-2xs border border-rose-200">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                Declined Request
              </span>
            )}
          </div>
        </div>
      </section>

      {/* 3. Four Pastel KPI Cards */}
      <section className="no-print grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          tone="blue"
          icon={Calendar}
          label="Leave Period"
          subtitle={`${formatDate(application.startDate)} → ${formatDate(application.endDate)}`}
          value={`${application.requestedPolicyDays}d`}
        />
        <StatCard
          tone="green"
          icon={CheckCircle2}
          label="Approved Days"
          subtitle="Policy Count"
          value={application.status === 'Approved' ? application.requestedPolicyDays : 0}
        />
        <StatCard
          tone="amber"
          icon={CalendarDays}
          label="Calendar Days"
          subtitle="Full Duration"
          value={application.requestedCalendarDays}
        />
        <StatCard
          tone={application.status === 'Approved' ? 'green' : application.status === 'Rejected' ? 'rose' : 'amber'}
          icon={Clock}
          label="Current Status"
          subtitle={application.status === 'Pending' ? 'In Review' : 'Processed'}
          value={application.status}
        />
      </section>

      {/* 4. Decision Alert Card (if decided) */}
      {application.status !== 'Pending' && (
        <section
          className={`no-print rounded-2xl border p-5 shadow-2xs ${
            application.status === 'Approved'
              ? 'border-emerald-200 bg-emerald-50/80 text-emerald-900'
              : 'border-rose-200 bg-rose-50/80 text-rose-900'
          }`}
        >
          <div className="flex items-start gap-3">
            {application.status === 'Approved' ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="mt-0.5 h-5 w-5 text-rose-600 shrink-0" />
            )}
            <div className="space-y-1 text-xs sm:text-sm">
              <p className="font-bold">
                Decision Notice: {application.status} on {formatDateTime(application.decisionAt)}
              </p>
              {application.rejectionReason && (
                <p className="text-xs">
                  <strong>Reason for rejection:</strong> {application.rejectionReason}
                </p>
              )}
              {application.decisionNote && (
                <p className="text-xs">
                  <strong>Administrative Note:</strong> {application.decisionNote}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 5. Purpose of Leave Box */}
      <section className="no-print rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Reason &amp; Purpose of Absence
        </h2>
        <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
          {application.purpose}
        </p>
      </section>

      {/* 6. Letter View Component */}
      <LetterView
        content={letter?.content}
        onDownloadPdf={handleDownloadPdf}
        downloading={downloadingPdf}
      />
    </div>
  );
}
