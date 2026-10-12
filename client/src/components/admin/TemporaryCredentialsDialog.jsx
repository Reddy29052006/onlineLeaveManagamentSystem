import { KeyRound } from 'lucide-react';

export default function TemporaryCredentialsDialog({ open, user, temporaryPassword, onClose }) {
  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <KeyRound className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Account created
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Temporary credentials are shown only once. The account is set to
              require a password change on first login.
            </p>
          </div>
        </div>

        <dl className="mt-5 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Username</dt>
            <dd className="font-semibold text-slate-800">{user.username}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Email</dt>
            <dd className="font-semibold text-slate-800">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">
              Temporary password
            </dt>
            <dd className="font-mono font-semibold text-slate-800">
              {temporaryPassword}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}