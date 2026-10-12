import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  CalendarCheck,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Lock,
  LogIn,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext.jsx';
import FullPageSpinner from '../components/FullPageSpinner.jsx';
import { homePathForRole } from '../routes/roleHome.js';

const DEMO_PROFILES = [
  {
    role: 'student',
    label: 'Student Portal',
    icon: GraduationCap,
    identifier: 'student1',
    password: 'Demo@12345',
    hint: 'Enter Student Roll Number or University Email',
  },
  {
    role: 'teacher',
    label: 'Teacher / Faculty',
    icon: Users,
    identifier: 'teacher1',
    password: 'Demo@12345',
    hint: 'Enter Faculty Employee ID or Academic Email',
  },
  {
    role: 'admin',
    label: 'Administrator',
    icon: ShieldCheck,
    identifier: 'admin',
    password: 'Admin@12345',
    hint: 'Enter Administrative Username or Email',
  },
];

export default function LoginPage() {
  const { user, initializing, login } = useAuth();
  const [selectedRole, setSelectedRole] = useState('student');
  const [identifier, setIdentifier] = useState('student1');
  const [password, setPassword] = useState('Demo@12345');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (initializing) {
    return <FullPageSpinner label="Checking your session…" />;
  }

  if (user) {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }

  function handleSelectRole(roleItem) {
    setSelectedRole(roleItem.role);
    setIdentifier(roleItem.identifier);
    setPassword(roleItem.password);
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(identifier.trim(), password);
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  }

  const activeRoleData = DEMO_PROFILES.find((p) => p.role === selectedRole) || DEMO_PROFILES[0];
  const ActiveIcon = activeRoleData.icon;

  return (
    <main className="flex min-h-full items-center justify-center bg-[#f4f7fc] px-4 py-12 text-slate-800">
      <div className="w-full max-w-lg space-y-6">
        {/* Header Branding */}
        <header className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#132238] text-blue-400 shadow-md border border-slate-700/40">
            <CalendarCheck className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#132238]">
            Online Leave Management System
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500">
            Official Institutional Portal &bull; Student &amp; Faculty Services
          </p>
        </header>

        {/* Card Container */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
          {/* Role Persona Tabs */}
          <div className="border-b border-slate-100 bg-slate-50/70 p-2">
            <div className="grid grid-cols-3 gap-1.5">
              {DEMO_PROFILES.map((p) => {
                const isSelected = selectedRole === p.role;
                const IconComponent = p.icon;
                return (
                  <button
                    key={p.role}
                    type="button"
                    onClick={() => handleSelectRole(p)}
                    className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-1 text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-[#132238] text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-200/70'
                    }`}
                  >
                    <IconComponent className="h-3.5 w-3.5" />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4" noValidate>
            <div className="flex items-center gap-2 rounded-xl bg-blue-50/70 p-3 text-xs text-blue-900 border border-blue-100">
              <ActiveIcon className="h-4 w-4 text-blue-700 shrink-0" />
              <span>
                Signing in to <strong className="font-bold">{activeRoleData.label}</strong>. {activeRoleData.hint}.
              </span>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs sm:text-sm text-rose-700 shadow-2xs"
              >
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {/* Identifier input */}
            <div>
              <label htmlFor="identifier" className="mb-1 block text-xs font-semibold text-slate-700">
                Email or Username / Roll Number
              </label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  autoComplete="username"
                  required
                  placeholder="e.g. student1, teacher1, or admin"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3 text-xs sm:text-sm text-slate-900 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <label htmlFor="password" className="mb-1 block text-xs font-semibold text-slate-700">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-10 text-xs sm:text-sm text-slate-900 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 px-4 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                )}
                {submitting ? 'Authenticating…' : `Sign in as ${activeRoleData.label}`}
              </button>
            </div>
          </form>

          {/* Quick Demo Accounts Selection Footer */}
          <div className="border-t border-slate-100 bg-slate-50/50 p-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Quick Test Autofill
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_PROFILES.map((p) => (
                <button
                  key={p.role}
                  type="button"
                  onClick={() => handleSelectRole(p)}
                  className="rounded-lg border border-slate-200 bg-white py-1.5 px-2 text-[11px] font-semibold text-slate-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors shadow-2xs text-center"
                >
                  {p.role.charAt(0).toUpperCase() + p.role.slice(1)} Demo
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <p className="text-center text-[11px] text-slate-400">
          Protected by HTTPS encryption and role-based access control.
        </p>
      </div>
    </main>
  );
}
