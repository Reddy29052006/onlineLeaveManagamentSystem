import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Clock,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext.jsx';
import { homePathForRole, ROLE_LABELS } from '../routes/roleHome.js';

const REQUIREMENTS = [
  { key: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  {
    key: 'cases',
    label: 'Upper & lowercase letters',
    test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p),
  },
  { key: 'number', label: 'At least one number', test: (p) => /\d/.test(p) },
  {
    key: 'symbol',
    label: 'At least one symbol',
    test: (p) => /[^A-Za-z0-9]/.test(p),
  },
];

const STRENGTH_LEVELS = [
  { label: 'Very weak', color: 'bg-rose-500', text: 'text-rose-600' },
  { label: 'Weak', color: 'bg-rose-500', text: 'text-rose-600' },
  { label: 'Fair', color: 'bg-amber-500', text: 'text-amber-600' },
  { label: 'Good', color: 'bg-blue-500', text: 'text-blue-600' },
  { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600' },
];

function getInitials(name = '') {
  if (!name) return 'U';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
  onCapsLock,
  rightSlot,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
        </label>
        {rightSlot}
      </div>
      <div className="group relative">
        <Lock
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500"
          aria-hidden="true"
        />
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyUp={(event) => onCapsLock?.(event.getModifierState('CapsLock'))}
          onKeyDown={(event) => onCapsLock?.(event.getModifierState('CapsLock'))}
          onBlur={() => onCapsLock?.(false)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-11 text-sm text-slate-800 shadow-2xs outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-slate-800">
          {value || '—'}
        </p>
      </div>
    </div>
  );
}

export default function ChangePasswordPage() {
  const { user, changePassword, logout } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [capsLock, setCapsLock] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const requirementState = useMemo(
    () => REQUIREMENTS.map((item) => ({ ...item, met: item.test(newPassword) })),
    [newPassword]
  );
  const metCount = requirementState.filter((item) => item.met).length;
  const strength = STRENGTH_LEVELS[metCount];
  const passwordsMatch =
    confirmPassword.length > 0 && confirmPassword === newPassword;
  const passwordsMismatch =
    confirmPassword.length > 0 && confirmPassword !== newPassword;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword) {
      setError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from the current password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setSubmitting(true);
    const enforced = Boolean(user?.mustChangePassword);
    try {
      await changePassword(currentPassword, newPassword);
      if (enforced) {
        navigate(homePathForRole(user?.role), { replace: true });
        return;
      }
      setSuccess('Your password has been updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Unable to change password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/60 px-4 py-8 text-slate-800 sm:px-6 lg:px-10">
      <div className="no-print mx-auto mb-6 flex max-w-6xl items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(homePathForRole(user?.role))}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900 hover:shadow-2xs"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to dashboard
        </button>
        <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
          <ShieldCheck className="h-4 w-4 text-emerald-500" aria-hidden="true" />
          Secured session
        </span>
      </div>

      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25">
              <Fingerprint className="h-7 w-7" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Security &amp; Settings
              </h1>
              <p className="text-sm text-slate-500">
                Manage your account credentials and review sign-in activity.
              </p>
            </div>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Account protected
          </span>
        </header>

        {user?.mustChangePassword && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" aria-hidden="true" />
            <div>
              <p className="font-semibold">Password update required</p>
              <p className="text-amber-700">
                For your security you must set a new password before you can
                continue using LeaveHub.
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left column: account + security overview */}
          <div className="space-y-6 lg:col-span-2">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="h-20 bg-gradient-to-r from-[#132238] to-blue-700" />
              <div className="-mt-9 px-6 pb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-xl font-bold text-blue-700 shadow-md ring-4 ring-white">
                  {getInitials(user?.name)}
                </div>
                <div className="mt-3">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {user?.name || 'User'}
                  </h2>
                  <p className="text-sm text-slate-500">{user?.email}</p>
                </div>
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  {ROLE_LABELS[user?.role] || user?.role || 'Member'}
                </span>

                <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
                  <InfoRow icon={UserIcon} label="Username" value={user?.username} />
                  <InfoRow icon={Mail} label="Email address" value={user?.email} />
                </div>
              </div>
            </section>
          </div>

          {/* Right column: change password */}
          <div className="lg:col-span-3">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <header className="mb-6 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600">
                  <KeyRound className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Change password
                  </h2>
                  <p className="text-sm text-slate-500">
                    Choose a strong password to keep your account safe.
                  </p>
                </div>
              </header>

              {error && (
                <p
                  role="alert"
                  className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {error}
                </p>
              )}

              {success && (
                <p
                  role="status"
                  className="mb-5 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
                >
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {success}
                </p>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <PasswordField
                  id="currentPassword"
                  label="Current password"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  autoComplete="current-password"
                  placeholder="Enter your current password"
                  onCapsLock={setCapsLock}
                />

                {capsLock && (
                  <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                    <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
                    Caps Lock is on.
                  </p>
                )}

                <div>
                  <PasswordField
                    id="newPassword"
                    label="New password"
                    value={newPassword}
                    onChange={setNewPassword}
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                    onCapsLock={setCapsLock}
                  />

                  {/* Strength meter */}
                  <div className="mt-3">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">
                        Password strength
                      </span>
                      {newPassword && (
                        <span className={`text-xs font-semibold ${strength.text}`}>
                          {strength.label}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      {REQUIREMENTS.map((_, index) => (
                        <span
                          key={index}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            index < metCount ? strength.color : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Requirements checklist */}
                  <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                    {requirementState.map((item) => (
                      <li
                        key={item.key}
                        className={`flex items-center gap-2 text-xs font-medium transition-colors ${
                          item.met ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-full transition-colors ${
                            item.met
                              ? 'bg-emerald-100 text-emerald-600'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          <Check className="h-2.5 w-2.5" aria-hidden="true" />
                        </span>
                        {item.label}
                      </li>
                    ))}
                  </ul>
                </div>

                <PasswordField
                  id="confirmPassword"
                  label="Confirm new password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  autoComplete="new-password"
                  placeholder="Re-enter your new password"
                  onCapsLock={setCapsLock}
                  rightSlot={
                    confirmPassword && (
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold ${
                          passwordsMatch ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {passwordsMatch ? (
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        {passwordsMatch ? 'Passwords match' : 'Do not match'}
                      </span>
                    )
                  }
                />

                <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                    )}
                    {submitting ? 'Saving…' : 'Update password'}
                  </button>

                  <button
                    type="button"
                    onClick={logout}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              </form>

              <p className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-5 text-xs text-slate-400">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                Forgot your current password? Contact your administrator to reset it.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
