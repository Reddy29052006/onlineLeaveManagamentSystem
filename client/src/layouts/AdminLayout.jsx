import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  Calendar,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext.jsx';
import { ROLE_LABELS } from '../routes/roleHome.js';
import NotificationBell from '../components/NotificationBell.jsx';
import LeaveHubLogo from '../components/LeaveHubLogo.jsx';

function getInitials(name = '') {
  if (!name) return 'AD';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/applications', label: 'Leave Requests', icon: FileText, end: false },
  { to: '/admin/calendar', label: 'Academic Calendar', icon: Calendar, end: false },
  { to: '/admin/students', label: 'Students', icon: GraduationCap, end: false },
  { to: '/admin/teachers', label: 'Teachers', icon: Users, end: false },
  { to: '/change-password', label: 'Security & Settings', icon: Settings, end: false },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-[#f4f7fc] text-slate-800">
      {/* Dark Navy Sidebar */}
      <aside className="no-print flex w-64 shrink-0 flex-col justify-between bg-[#132238] text-slate-300">
        <div>
          {/* Sidebar Header: Logo */}
          <div className="border-b border-slate-700/50 p-5">
            <Link to="/admin" className="block">
              <LeaveHubLogo light={true} />
            </Link>
          </div>

          {/* Sidebar Nav */}
          <nav className="space-y-1.5 p-4">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            ))}

            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
            >
              <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>Sign out</span>
            </button>
          </nav>
        </div>

        {/* Motivational Sidebar Footer */}
        <div className="p-6">
          <div className="rounded-xl border border-slate-700/40 bg-slate-800/40 p-4 text-center">
            <p className="text-xs italic tracking-wide text-slate-300 font-serif">
              &ldquo;Plan your time,
              <br />
              Build your future&rdquo;
            </p>
            <div className="mx-auto mt-2 h-0.5 w-10 rounded-full bg-blue-500" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="no-print sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-xs">
          <div className="flex items-center justify-between gap-4 px-6 py-3.5">
            {/* Top Navigation */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <Link to="/admin" className="text-blue-600 hover:text-blue-700 font-semibold">
                Admin Console
              </Link>
              <Link to="/admin/applications" className="hover:text-slate-900 transition-colors">
                Review Leaves
              </Link>
              <Link to="/admin/calendar" className="hover:text-slate-900 transition-colors">
                Academic Calendar
              </Link>
              <Link to="/admin/students" className="hover:text-slate-900 transition-colors">
                Students
              </Link>
              <Link to="/admin/teachers" className="hover:text-slate-900 transition-colors">
                Teachers
              </Link>
            </nav>

            <div className="flex md:hidden items-center">
              <span className="font-bold text-slate-900">LeaveHub Admin</span>
            </div>

            {/* Right: Notifications & User Profile */}
            <div className="flex items-center gap-4">
              <NotificationBell />

              {/* User Avatar with Initials */}
              <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white shadow-sm ring-2 ring-blue-100">
                  {getInitials(user?.name)}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold leading-tight text-slate-900">
                    {user?.name || 'Administrator'}
                  </p>
                  <p className="text-xs font-medium text-slate-500">
                    {ROLE_LABELS[user?.role] || user?.role}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Route Body */}
        <main className="flex-1 p-6 md:p-8">
          <Outlet />
        </main>

        {/* Global Footer */}
        <footer className="no-print border-t border-slate-200 bg-white px-6 py-4 text-xs text-slate-500">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>&copy; {new Date().getFullYear()} LeaveHub. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="hover:text-slate-700 cursor-pointer">Privacy Policy</span>
              <span>&bull;</span>
              <span className="hover:text-slate-700 cursor-pointer">Terms of Service</span>
              <span>&bull;</span>
              <span className="hover:text-slate-700 cursor-pointer">Administrative Help</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}