import {
  CalendarCheck,
  GraduationCap,
  LogOut,
  ShieldCheck,
  UserCog,
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext.jsx';
import { ROLE_LABELS } from '../routes/roleHome.js';

const ROLE_ICON = {
  admin: UserCog,
  teacher: GraduationCap,
  student: CalendarCheck,
};

export default function DashboardPage() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const Icon = ROLE_ICON[user.role] || ShieldCheck;

  return (
    <main className="min-h-full bg-slate-50 px-4 py-10 text-slate-800">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">
                {ROLE_LABELS[user.role]} dashboard
              </h1>
              <p className="text-sm text-slate-500">Welcome, {user.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-medium text-slate-900">
            <ShieldCheck className="h-5 w-5 text-slate-500" aria-hidden="true" />
            Signed in
          </h2>
          <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Name</dt>
              <dd className="font-semibold text-slate-800">{user.name}</dd>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Role</dt>
              <dd className="font-semibold text-slate-800">
                {ROLE_LABELS[user.role]}
              </dd>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Email</dt>
              <dd className="font-semibold text-slate-800">{user.email}</dd>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Username</dt>
              <dd className="font-semibold text-slate-800">{user.username}</dd>
            </div>
          </dl>
          <p className="mt-6 text-sm text-slate-500">
            Leave features arrive in later stages.
          </p>
        </section>
      </div>
    </main>
  );
}
