import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Info,
  Loader2,
  Send,
} from 'lucide-react';
import { calendarApi } from '../../services/calendarApi.js';
import { leavesApi } from '../../services/leavesApi.js';
import { useAuth } from '../../features/auth/AuthContext.jsx';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200';

function Field({ id, label, required, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {error && (
        <span role="alert" className="mt-1 block text-xs text-red-600">
          {error}
        </span>
      )}
    </div>
  );
}

function WarningList({ warnings }) {
  if (!warnings || warnings.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-green-700">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        No weekend or holiday conflicts for this range.
      </p>
    );
  }
  return (
    <ul className="space-y-1">
      {warnings.map((warning) => (
        <li key={warning} className="flex items-start gap-2 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{warning}</span>
        </li>
      ))}
    </ul>
  );
}

export default function LeaveApplyPage() {
  const { user } = useAuth();
  const base = `/${user?.role || ''}`;

  const [step, setStep] = useState('form');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [errors, setErrors] = useState({});

  const [range, setRange] = useState(null);
  const [rangeLoading, setRangeLoading] = useState(false);
  const [rangeError, setRangeError] = useState('');

  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState(null);

  const debounceRef = useRef(null);

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
    debounceRef.current = window.setTimeout(() => loadRange(startDate, endDate), 400);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [startDate, endDate, step, loadRange]);

  function validateForm() {
    const next = {};
    if (!startDate) next.startDate = 'Start date is required';
    if (!endDate) next.endDate = 'End date is required';
    if (startDate && endDate && endDate < startDate) {
      next.endDate = 'End date cannot be before the start date';
    }
    if (!purpose.trim()) {
      next.purpose = 'Purpose is required';
    } else if (purpose.trim().length < 5) {
      next.purpose = 'Please provide at least 5 characters';
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
      const response = await leavesApi.submit({
        startDate,
        endDate,
        purpose: purpose.trim(),
      });
      setResult(response.data);
      setStep('success');
    } catch (err) {
      setSubmitError(err.message || 'Unable to submit the application.');
    } finally {
      setBusy(false);
    }
  }

  function resetAll() {
    setStep('form');
    setStartDate('');
    setEndDate('');
    setPurpose('');
    setErrors({});
    setRange(null);
    setRangeError('');
    setSubmitError('');
    setResult(null);
  }

  if (step === 'success' && result) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" aria-hidden="true" />
          <h1 className="mt-3 text-lg font-semibold text-green-900">
            Application submitted
          </h1>
          <p className="mt-1 text-sm text-green-800">
            Your leave request was saved and is pending review.
          </p>
          <p className="mt-4 text-xs uppercase tracking-wide text-green-700">
            Application ID
          </p>
          <p className="text-2xl font-bold tracking-wide text-green-900">
            {result.application.applicationId}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">From</dt>
              <dd className="font-medium">{result.application.startDate}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">To</dt>
              <dd className="font-medium">{result.application.endDate}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Calendar days</dt>
              <dd className="font-medium">{result.range.calendarDays}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Leave days</dt>
              <dd className="font-medium">{result.range.policyDays}</dd>
            </div>
          </dl>
          {result.warnings?.length > 0 && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <WarningList warnings={result.warnings} />
            </div>
          )}
        </div>

        <div className="no-print flex flex-wrap gap-3">
          <Link
            to={`${base}/applications/${result.application._id}`}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            View application &amp; letter
          </Link>
          <button
            type="button"
            onClick={resetAll}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Submit another
          </button>
          <Link
            to={base}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (step === 'review') {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <button
          type="button"
          onClick={() => setStep('form')}
          disabled={busy}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Edit details
        </button>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">Review your request</h1>
          <p className="mt-1 text-sm text-slate-500">
            Confirm the details below. The formal letter is generated when you submit.
          </p>

          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
              <dt className="text-slate-500">Start date</dt>
              <dd className="font-medium">{startDate}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
              <dt className="text-slate-500">End date</dt>
              <dd className="font-medium">{endDate}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
              <dt className="text-slate-500">Requested leave days</dt>
              <dd className="font-medium">
                {range ? range.policyDays : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Purpose</dt>
              <dd className="mt-1 whitespace-pre-wrap font-medium">{purpose.trim()}</dd>
            </div>
          </dl>

          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <Info className="h-4 w-4" aria-hidden="true" />
              Calendar warnings
            </p>
            <WarningList warnings={range?.warnings} />
          </div>
        </section>

        {submitError && (
          <p
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            {submitError}
          </p>
        )}

        <div className="no-print flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setStep('form')}
            disabled={busy}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            {busy ? 'Submitting…' : 'Submit application'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={goToReview} className="mx-auto max-w-2xl space-y-5" noValidate>
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Apply for leave</h1>
        <p className="text-sm text-slate-500">
          Choose your dates and describe the reason for your leave.
        </p>
      </div>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="startDate" label="Start date" required error={errors.startDate}>
            <input
              id="startDate"
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field id="endDate" label="End date" required error={errors.endDate}>
            <input
              id="endDate"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <Field id="purpose" label="Purpose" required error={errors.purpose}>
          <textarea
            id="purpose"
            rows={4}
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Briefly describe the reason for your leave"
            className={inputClass}
          />
        </Field>

        <p className="text-xs text-slate-400">Today is {todayIso()}.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
          <CalendarClock className="h-4 w-4" aria-hidden="true" />
          Calendar check
        </p>

        {!startDate || !endDate || endDate < startDate ? (
          <p className="text-sm text-slate-500">
            Select a valid date range to see weekend and holiday warnings.
          </p>
        ) : rangeLoading ? (
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Checking your dates…
          </p>
        ) : rangeError ? (
          <p className="flex items-center gap-2 text-sm text-red-600">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            {rangeError}
          </p>
        ) : range ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Requested leave days:{' '}
              <span className="font-semibold text-slate-800">{range.policyDays}</span>{' '}
              ({range.calendarDays} calendar day{range.calendarDays === 1 ? '' : 's'})
            </p>
            <WarningList warnings={range.warnings} />
          </div>
        ) : null}
      </section>

      <div className="no-print flex justify-end">
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          Review request
        </button>
      </div>
    </form>
  );
}
