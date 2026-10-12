import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200';

export default function LeaveDecisionDialog({
  open,
  mode,
  application,
  busy = false,
  error = null,
  onClose,
  onSubmit,
}) {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [localError, setLocalError] = useState('');

  const isReject = mode === 'reject';

  useEffect(() => {
    if (open) {
      setReason('');
      setNote('');
      setLocalError('');
    }
  }, [open, mode]);

  if (!open) return null;

  const serverFieldError = (field) => {
    const detail = (error?.details || []).find((item) => item.field === field);
    return detail?.message;
  };

  function handleSubmit(event) {
    event.preventDefault();
    if (isReject && !reason.trim()) {
      setLocalError('A rejection reason is required.');
      return;
    }
    setLocalError('');
    onSubmit({
      rejectionReason: isReject ? reason.trim() : undefined,
      decisionNote: note.trim() ? note.trim() : undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              isReject ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
            }`}
          >
            {isReject ? (
              <XCircle className="h-5 w-5" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            )}
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {isReject ? 'Reject application?' : 'Approve application?'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {application?.applicationId} · {application?.applicantNameSnapshot} ·{' '}
              {application?.startDate} → {application?.endDate}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {isReject && (
            <div>
              <label htmlFor="rejectionReason" className="mb-1 block text-sm font-medium text-slate-700">
                Rejection reason <span className="text-red-500">*</span>
              </label>
              <textarea
                id="rejectionReason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
                placeholder="Explain why this leave request is rejected"
                className={inputClass}
              />
              {(localError || serverFieldError('rejectionReason')) && (
                <span role="alert" className="mt-1 block text-xs text-red-600">
                  {localError || serverFieldError('rejectionReason')}
                </span>
              )}
            </div>
          )}

          <div>
            <label htmlFor="decisionNote" className="mb-1 block text-sm font-medium text-slate-700">
              Note (optional)
            </label>
            <textarea
              id="decisionNote"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              placeholder="Add an internal note for this decision"
              className={inputClass}
            />
            {serverFieldError('decisionNote') && (
              <span role="alert" className="mt-1 block text-xs text-red-600">
                {serverFieldError('decisionNote')}
              </span>
            )}
          </div>

          {error?.message && (
            <p
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              {error.message}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                isReject
                  ? 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-400'
                  : 'bg-green-600 hover:bg-green-700 focus-visible:ring-green-400'
              }`}
            >
              {busy ? 'Working…' : isReject ? 'Reject application' : 'Approve application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
