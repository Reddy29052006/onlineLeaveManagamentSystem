import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CalendarClock,
  CheckCircle2,
  FileCheck,
  FilePlus,
  FileText,
  Info,
  Loader2,
  Send,
} from 'lucide-react';
import { calendarApi } from '../../services/calendarApi.js';
import { leavesApi } from '../../services/leavesApi.js';
import { settingsApi } from '../../services/settingsApi.js';
import { useAuth } from '../../features/auth/AuthContext.jsx';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(isoStr) {
  if (!isoStr) return '—';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(isoStr));
  } catch {
    return isoStr;
  }
}

function joinParts(parts) {
  return parts.filter((part) => part && String(part).trim()).join(', ');
}

/**
 * Mirrors the server's `describeApplicant` so the live preview matches the
 * formal letter that is actually generated and stored on submission.
 */
function describeApplicant(user) {
  if (!user) return 'the applicant';
  if (user.role === 'student') {
    const program = joinParts([user.course, user.department]);
    const secondary = joinParts([
      user.year ? `Year ${user.year}` : '',
      user.section ? `Section ${user.section}` : '',
    ]);
    const affiliation = joinParts([program, secondary]);
    const tail = affiliation ? ` from ${affiliation}` : '';
    return `${user.name}, student (ID: ${user.studentId || 'N/A'})${tail}`;
  }

  const designationDept = joinParts([
    user.designation,
    user.department ? `${user.department} Department` : '',
  ]);
  const tail = designationDept ? `, ${designationDept}` : '';
  return `${user.name}, teacher (ID: ${user.teacherId || 'N/A'})${tail}`;
}

const DEFAULT_INSTITUTION_NAME = 'Online Leave Management Institution';

const LEAVE_TYPES = [
  { id: 'Casual Leave', label: 'Casual Leave', hint: 'Short absence for routine or casual reasons' },
  { id: 'Medical Leave', label: 'Medical / Sick', hint: 'Health, hospital, or doctor recommended rest' },
  { id: 'Academic / Duty', label: 'Academic / On Duty', hint: 'Seminars, examinations, conferences, or official duty' },
  { id: 'Personal Leave', label: 'Personal / Urgent', hint: 'Family affairs, domestic matters, or emergency' },
];

const PRESET_REASONS = [
  'Medical appointment and physician recommended rest',
  'Family function and urgent personal obligation',
  'Attending academic workshop and research seminar',
  'Urgent personal travel to native hometown',
];

function WarningList({ warnings }) {
  if (!warnings || warnings.length === 0) {
    return (
      <p className="flex items-center gap-2 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
        No holiday or weekend overlaps detected for this date range.
      </p>
    );
  }
  return (
    <ul className="space-y-1.5">
      {warnings.map((warning) => (
        <li key={warning} className="flex items-start gap-2 text-xs font-medium text-amber-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden="true" />
          <span>{warning}</span>
        </li>
      ))}
    </ul>
  );
}

export default function LeaveApplyPage() {
  const { user } = useAuth();
  const location = useLocation();
  const isTeacherRoute = location.pathname.startsWith('/teacher');
  const isStudent = !isTeacherRoute && user?.role !== 'teacher';
  const base = isTeacherRoute ? '/teacher' : '/student';

  const [step, setStep] = useState('form');
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [errors, setErrors] = useState({});
  const [institutionName, setInstitutionName] = useState(DEFAULT_INSTITUTION_NAME);

  const [range, setRange] = useState(null);
  const [rangeLoading, setRangeLoading] = useState(false);
  const [rangeError, setRangeError] = useState('');

  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState(null);

  const debounceRef = useRef(null);

  useEffect(() => {
    let active = true;
    settingsApi
      .getSettings()
      .then((response) => {
        if (!active) return;
        const name = response.data?.settings?.institutionName;
        if (name) setInstitutionName(name);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const loadRange = useCallback(async (start, end) => {
    setRangeLoading(true);
    setRangeError('');
    try {
      const response = await calendarApi.checkRange(start, end);
      setRange(response.data.range);
    } catch (err) {
      setRange(null);
      setRangeError(err.message || 'Unable to check this date range.');
    } finally {
      setRangeLoading(false);
    }
  }, []);

  useEffect(() => {
    if (step !== 'form') return undefined;
    setRange(null);
    setRangeError('');
    if (!startDate || !endDate || endDate < startDate) return undefined;

    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => loadRange(startDate, endDate), 350);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [startDate, endDate, step, loadRange]);

  function validateForm() {
    const next = {};
    if (!startDate) next.startDate = 'Start date is required';
    if (!endDate) next.endDate = 'End date is required';
    if (startDate && endDate && endDate < startDate) {
      next.endDate = 'End date cannot be earlier than start date';
    }
    if (!purpose.trim()) {
      next.purpose = 'Purpose of leave is required';
    } else if (purpose.trim().length < 5) {
      next.purpose = 'Please provide at least 5 characters explaining your reason';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function goToReview(event) {
    event.preventDefault();
    setSubmitError('');
    if (!validateForm()) return;
    setStep('review');
  }

  async function submit() {
    setBusy(true);
    setSubmitError('');
    try {
      // Append leave type to purpose if not explicitly included
      const fullPurpose = `[${leaveType}] ${purpose.trim()}`;
      const response = await leavesApi.submit({
        startDate,
        endDate,
        purpose: fullPurpose,
      });
      setResult(response.data);
      setStep('success');
    } catch (err) {
      setSubmitError(err.message || 'Unable to submit the leave application.');
    } finally {
      setBusy(false);
    }
  }

  function resetAll() {
    setStep('form');
    setLeaveType('Casual Leave');
    setStartDate('');
    setEndDate('');
    setPurpose('');
    setErrors({});
    setRange(null);
    setRangeError('');
    setSubmitError('');
    setResult(null);
  }

  // SUCCESS STEP VIEW
  if (step === 'success' && result) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50/80 to-white p-8 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-2xs mb-4">
            <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-950">
            Application Submitted Successfully!
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-emerald-800">
            Your official leave application has been registered into the institutional records and is queued for review.
          </p>

          <div className="mt-5 inline-flex flex-col items-center rounded-xl border border-emerald-200/80 bg-white px-6 py-3 shadow-2xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
              Official Application ID
            </span>
            <span className="mt-0.5 font-mono text-2xl font-extrabold text-[#182848]">
              {result.application.applicationId}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Application Summary
          </h2>
          <dl className="grid grid-cols-2 gap-4 text-xs sm:text-sm sm:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="text-[11px] font-medium text-slate-400 uppercase">From Date</dt>
              <dd className="mt-0.5 font-semibold text-slate-800">{formatDate(result.application.startDate)}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="text-[11px] font-medium text-slate-400 uppercase">To Date</dt>
              <dd className="mt-0.5 font-semibold text-slate-800">{formatDate(result.application.endDate)}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="text-[11px] font-medium text-slate-400 uppercase">Calendar Days</dt>
              <dd className="mt-0.5 font-semibold text-slate-800">{result.range.calendarDays}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="text-[11px] font-medium text-slate-400 uppercase">Leave Days</dt>
              <dd className="mt-0.5 font-semibold text-emerald-700">{result.range.policyDays}</dd>
            </div>
          </dl>

          {result.warnings?.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5">
              <WarningList warnings={result.warnings} />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Link
            to={`${base}/applications/${result.application._id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
          >
            <FileText className="h-4 w-4" />
            View Application &amp; Formal Letter
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetAll}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Apply Another
            </button>
            <Link
              to={base}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // REVIEW STEP VIEW
  if (step === 'review') {
    return (
      <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
        <button
          type="button"
          onClick={() => setStep('form')}
          disabled={busy}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Edit Application Details
        </button>

        <section className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                Review Your Leave Application
              </h1>
              <p className="mt-0.5 text-xs text-slate-500">
                Please verify all details before submitting. Your formal letter will be stamped and sent for approval.
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {leaveType}
            </span>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
            <div className="rounded-xl bg-slate-50 p-3.5">
              <dt className="text-slate-400 font-medium uppercase text-[11px]">Start Date</dt>
              <dd className="mt-1 font-semibold text-slate-800">{formatDate(startDate)}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3.5">
              <dt className="text-slate-400 font-medium uppercase text-[11px]">End Date</dt>
              <dd className="mt-1 font-semibold text-slate-800">{formatDate(endDate)}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3.5">
              <dt className="text-slate-400 font-medium uppercase text-[11px]">Total Leave Days</dt>
              <dd className="mt-1 font-semibold text-emerald-700">
                {range ? `${range.policyDays} Day${range.policyDays === 1 ? '' : 's'}` : '—'}
              </dd>
            </div>
          </dl>

          <div className="rounded-xl bg-slate-50 p-4 space-y-1">
            <dt className="text-[11px] font-semibold text-slate-400 uppercase">Reason &amp; Purpose</dt>
            <dd className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
              {purpose.trim()}
            </dd>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Info className="h-4 w-4 text-blue-600" aria-hidden="true" />
              Calendar Validation &amp; Academic Schedule
            </p>
            <WarningList warnings={range?.warnings} />
          </div>
        </section>

        {submitError && (
          <div
            role="alert"
            className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs sm:text-sm font-medium text-rose-700 shadow-2xs"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setStep('form')}
            disabled={busy}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
          >
            Back to Edit
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            {busy ? 'Submitting Application…' : 'Confirm & Submit Application'}
          </button>
        </div>
      </div>
    );
  }

  // STEP: 'form' - 2-Column Responsive Layout
  const charCount = purpose.length;

  return (
    <div className="space-y-6">
      {/* 1. Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-indigo-50/80 p-5 sm:p-6 shadow-2xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="max-w-xl space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100/80 px-3 py-0.5 text-xs font-semibold text-blue-800">
              <FilePlus className="h-3.5 w-3.5" /> Leave Application Portal
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#182848]">
              Apply for Leave
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-600">
              Fill in your leave dates, choose the category, state your reason, and preview your formal application letter before submission.
            </p>
          </div>

          <div className="flex shrink-0 items-center">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200/70 bg-white/90 px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs">
              <Calendar className="h-3.5 w-3.5 text-blue-600" />
              Today: {formatDate(todayIso())}
            </span>
          </div>
        </div>
      </section>

      {/* 2. Main 2-Column Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Form Controls (7 cols) */}
        <form onSubmit={goToReview} className="space-y-5 lg:col-span-7" noValidate>
          {/* Card 1: Leave Category Selection */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              1. Select Leave Category
            </label>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {LEAVE_TYPES.map((t) => {
                const isSelected = leaveType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setLeaveType(t.id)}
                    className={`flex flex-col items-center justify-center rounded-xl p-3 text-center transition-all ${
                      isSelected
                        ? 'border-2 border-blue-600 bg-blue-50/80 text-blue-900 shadow-2xs'
                        : 'border border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold">{t.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Category hint:{' '}
              <span className="text-blue-700 font-semibold">
                {LEAVE_TYPES.find((t) => t.id === leaveType)?.hint}
              </span>
            </p>
          </div>

          {/* Card 2: Date Picker Range */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              2. Choose Leave Period
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="startDate" className="mb-1 block text-xs font-semibold text-slate-700">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs sm:text-sm text-slate-800 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                {errors.startDate && (
                  <span className="mt-1 block text-[11px] font-medium text-rose-600">
                    {errors.startDate}
                  </span>
                )}
              </div>

              <div>
                <label htmlFor="endDate" className="mb-1 block text-xs font-semibold text-slate-700">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs sm:text-sm text-slate-800 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                {errors.endDate && (
                  <span className="mt-1 block text-[11px] font-medium text-rose-600">
                    {errors.endDate}
                  </span>
                )}
              </div>
            </div>

            {/* Calendar Check Status Card */}
            {startDate && endDate && endDate >= startDate ? (
              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <CalendarClock className="h-4 w-4 text-blue-600" />
                    Calculated Leave Days:
                  </span>
                  {rangeLoading ? (
                    <span className="flex items-center gap-1 text-slate-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking dates…
                    </span>
                  ) : range ? (
                    <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {range.policyDays} policy day{range.policyDays === 1 ? '' : 's'} ({range.calendarDays} calendar)
                    </span>
                  ) : null}
                </div>

                {range && <WarningList warnings={range.warnings} />}
                {rangeError && (
                  <p className="text-xs text-rose-600 font-medium">{rangeError}</p>
                )}
              </div>
            ) : null}
          </div>

          {/* Card 3: Purpose / Reason Textarea */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="purpose" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                3. Purpose of Leave <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {charCount} characters
              </span>
            </div>

            <textarea
              id="purpose"
              rows={4}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="State the clear reason for your leave request (e.g. medical illness, family emergency, academic conference)…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs sm:text-sm text-slate-800 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            {errors.purpose && (
              <span className="block text-[11px] font-medium text-rose-600">
                {errors.purpose}
              </span>
            )}

            {/* Quick Suggestion Chips */}
            <div className="space-y-1.5 pt-1">
              <p className="text-[11px] font-semibold text-slate-500">
                Quick Reason Suggestions:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_REASONS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setPurpose(preset)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 transition-colors"
            >
              <FileCheck className="h-4 w-4" />
              Review &amp; Submit Request
            </button>
          </div>
        </form>

        {/* Right Column: Live Formal Letter Preview (5 cols) */}
        <aside className="lg:col-span-5">
          <div className="sticky top-6 rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
            {/* Sheet Header Banner */}
            <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800">
                  Live Formal Letter Preview
                </span>
              </div>
              <span className="rounded-full bg-blue-100/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-800">
                Draft Watermark
              </span>
            </div>

            {/* Sheet Body (Simulated Formal Document) */}
            <div className="relative p-6 sm:p-7 font-serif text-slate-800 text-xs sm:text-sm leading-relaxed space-y-4 bg-white min-h-[460px]">
              {/* Institution Header */}
              <div className="text-center border-b border-slate-200 pb-3 space-y-0.5 font-sans">
                <h3 className="text-xs sm:text-sm font-extrabold tracking-wider text-slate-900 uppercase">
                  {institutionName}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Academic Institution &bull; Official Student &amp; Faculty Services
                </p>
                <p className="text-[10px] text-slate-400">
                  Date: {formatDate(todayIso())}
                </p>
              </div>

              {/* Addressee */}
              <div className="space-y-0.5 font-sans text-xs text-slate-700">
                <p>To</p>
                <p className="font-semibold text-slate-900">The Administrator</p>
                <p>{institutionName}</p>
              </div>

              {/* Subject */}
              <div className="font-sans font-bold text-xs text-slate-900 bg-slate-50 p-2 rounded border border-slate-100">
                Subject: Request for Leave
              </div>

              {/* Salutation */}
              <p className="font-sans text-xs">Respected Sir/Madam,</p>

              {/* Letter Content Preview */}
              <div className="font-sans text-xs text-slate-700 space-y-2 leading-normal">
                <p>
                  I am {describeApplicant(user)}. I kindly request leave from{' '}
                  <span className="font-semibold text-slate-900">
                    {startDate ? formatDate(startDate) : '[start date]'}
                  </span>{' '}
                  to{' '}
                  <span className="font-semibold text-slate-900">
                    {endDate ? formatDate(endDate) : '[end date]'}
                  </span>{' '}
                  due to{' '}
                  <span className="font-semibold text-slate-900">
                    {purpose.trim() ? `[${leaveType}] ${purpose.trim()}` : 'your stated reason'}
                  </span>
                  .
                </p>

                <p>I request you to kindly consider and approve my leave application.</p>

                <p>Thank you for your consideration.</p>
              </div>

              {/* Sign-off */}
              <div className="pt-4 font-sans text-xs text-slate-800 space-y-0.5 border-t border-slate-100">
                <p>Yours sincerely,</p>
                <p className="font-bold text-slate-900">{user?.name || 'Applicant Name'}</p>
                <p className="font-mono text-[11px] text-slate-500">
                  {(isStudent ? user?.studentId : user?.teacherId) || 'N/A'}
                </p>
                <p className="text-[11px] text-slate-500">{formatDate(todayIso())}</p>
              </div>

              {/* Draft Watermark Badge */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03]">
                <span className="text-6xl font-black uppercase tracking-widest text-slate-900 rotate-[-25deg]">
                  LEAVEHUB DRAFT
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
