import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { fieldErrors } from '../../utils/fieldErrors.js';

function emptyForm() {
  return {
    name: '',
    email: '',
    username: '',
    department: '',
    phone: '',
    password: '',
    studentId: '',
    course: '',
    year: '',
    section: '',
    teacherId: '',
    designation: '',
  };
}

function formFromUser(user) {
  const form = emptyForm();
  for (const key of Object.keys(form)) {
    if (user[key] !== undefined) form[key] = user[key];
  }
  return form;
}

const inputClass = (invalid) =>
  `w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 ${
    invalid
      ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
      : 'border-slate-300 focus:border-blue-500 focus:ring-blue-200'
  }`;

function Field({ label, required, invalid, message, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
      {invalid && <span className="mt-1 block text-xs text-red-600">{message}</span>}
    </label>
  );
}

export default function UserFormDialog({
  open,
  role,
  editing,
  busy,
  error,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(emptyForm());

  useEffect(() => {
    if (open) {
      setForm(editing ? formFromUser(editing) : emptyForm());
    }
  }, [open, role, editing]);

  if (!open) return null;

  const isStudent = role === 'student';
  const title = editing
    ? `Edit ${isStudent ? 'student' : 'teacher'}`
    : `Add ${isStudent ? 'student' : 'teacher'}`;
  const errors = fieldErrors(error?.details);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  function handleSubmit(event) {
    event.preventDefault();
    const payload = { ...form };
    if (!payload.password) delete payload.password;
    onSubmit(payload);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && !error.details?.length && (
          <p
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error.message}
          </p>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
          <Field label="Full name" required invalid={!!errors.name} message={errors.name}>
            <input type="text" value={form.name} onChange={set('name')} className={inputClass(!!errors.name)} autoComplete="off" />
          </Field>

          <Field label="Department" required={!isStudent} invalid={!!errors.department} message={errors.department}>
            <input type="text" value={form.department} onChange={set('department')} className={inputClass(!!errors.department)} />
          </Field>

          {isStudent ? (
            <>
              <Field label="Student ID" required invalid={!!errors.studentId} message={errors.studentId}>
                <input type="text" value={form.studentId} onChange={set('studentId')} className={inputClass(!!errors.studentId)} autoComplete="off" />
              </Field>
              <Field label="Course" invalid={!!errors.course} message={errors.course}>
                <input type="text" value={form.course} onChange={set('course')} className={inputClass(!!errors.course)} />
              </Field>
              <Field label="Year" invalid={!!errors.year} message={errors.year}>
                <input type="text" value={form.year} onChange={set('year')} className={inputClass(!!errors.year)} />
              </Field>
              <Field label="Section" invalid={!!errors.section} message={errors.section}>
                <input type="text" value={form.section} onChange={set('section')} className={inputClass(!!errors.section)} />
              </Field>
            </>
          ) : (
            <>
              <Field label="Teacher ID" required invalid={!!errors.teacherId} message={errors.teacherId}>
                <input type="text" value={form.teacherId} onChange={set('teacherId')} className={inputClass(!!errors.teacherId)} autoComplete="off" />
              </Field>
              <Field label="Designation" required invalid={!!errors.designation} message={errors.designation}>
                <input type="text" value={form.designation} onChange={set('designation')} className={inputClass(!!errors.designation)} />
              </Field>
            </>
          )}

          <Field label="Email" required invalid={!!errors.email} message={errors.email}>
            <input type="email" value={form.email} onChange={set('email')} className={inputClass(!!errors.email)} autoComplete="off" />
          </Field>

          <Field label="Username" required invalid={!!errors.username} message={errors.username}>
            <input type="text" value={form.username} onChange={set('username')} className={inputClass(!!errors.username)} autoComplete="off" />
          </Field>

          <Field label="Phone" invalid={!!errors.phone} message={errors.phone}>
            <input type="text" value={form.phone} onChange={set('phone')} className={inputClass(!!errors.phone)} autoComplete="off" />
          </Field>

          {!editing && (
            <div className="sm:col-span-2">
              <Field label="Initial password" invalid={!!errors.password} message={errors.password}>
                <input type="text" value={form.password} onChange={set('password')} className={inputClass(!!errors.password)} autoComplete="new-password" />
              </Field>
              <p className="mt-1 text-xs text-slate-500">
                Leave blank to generate a secure temporary password (shown once).
              </p>
            </div>
          )}

          <div className="mt-2 flex justify-end gap-3 sm:col-span-2">
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
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}