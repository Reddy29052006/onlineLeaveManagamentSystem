import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { EVENT_TYPE_CONFIG } from '../../utils/calendarUtils.js';

const TYPE_OPTIONS = [
  { value: 'public_holiday', label: 'Public Holiday' },
  { value: 'institution_holiday', label: 'Institution Holiday' },
  { value: 'academic_event', label: 'Academic Event' },
  { value: 'weekend_override', label: 'Weekend Override' },
];

export default function EventFormDialog({
  open,
  editing = null,
  initialDate = '',
  busy = false,
  error = null,
  onClose,
  onSubmit,
}) {
  const isEdit = Boolean(editing);

  const [name, setName] = useState('');
  const [type, setType] = useState('public_holiday');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name || '');
      setType(editing.type || 'public_holiday');
      setStartDate(editing.startDate || '');
      setEndDate(editing.endDate || '');
      setDescription(editing.description || '');
      setIsActive(editing.isActive !== false);
    } else {
      setName('');
      setType('public_holiday');
      setStartDate(initialDate || '');
      setEndDate(initialDate || '');
      setDescription('');
      setIsActive(true);
    }
    setFieldErrors({});
  }, [open, editing, initialDate]);

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();
    const errors = {};
    if (!name.trim()) errors.name = 'Event name is required';
    if (!startDate) errors.startDate = 'Start date is required';
    if (endDate && endDate < startDate) errors.endDate = 'End date cannot be before start date';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    onSubmit({
      name: name.trim(),
      type,
      startDate,
      endDate: endDate || startDate,
      description: description.trim(),
      isActive,
    });
  }

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEdit ? 'Edit Calendar Event' : 'Add Calendar Event'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error.message || 'An error occurred'}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-700">
              Event Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Gandhi Jayanti, Midterm Exams"
              maxLength={150}
              required
              className={`${inputClass} mt-1`}
            />
            {fieldErrors.name && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-700">
              Event Type <span className="text-red-500">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={`${inputClass} mt-1`}
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-700">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (!endDate || endDate < e.target.value) {
                    setEndDate(e.target.value);
                  }
                }}
                required
                className={`${inputClass} mt-1`}
              />
              {fieldErrors.startDate && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.startDate}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-700">
                End Date (Inclusive)
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`${inputClass} mt-1`}
              />
              {fieldErrors.endDate && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.endDate}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-700">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details about this event or holiday…"
              rows={3}
              maxLength={500}
              className={`${inputClass} mt-1 resize-none`}
            />
          </div>

          {isEdit && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Active on academic calendar</span>
            </label>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
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
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
