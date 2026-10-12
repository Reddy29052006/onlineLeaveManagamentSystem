import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Calendar,
  FilePlus,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext.jsx';
import { ROLE_LABELS } from '../routes/roleHome.js';
import NotificationBell from '../components/NotificationBell.jsx';
import LeaveHubLogo from '../components/LeaveHubLogo.jsx';

function getInitials(name = '') {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ApplicantLayout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const base = `/${user?.role || ''}`;

  const navItems = [
    { to: base, label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: `${base}/apply`, label: 'Apply Leave', icon: FilePlus, end: false },
    { to: `${base}/history`, label: 'Leave History', icon: ListChecks, end: false },
    { to: `${base}/calendar`, label: 'Calendar', icon: Calendar, end: false },
    { to: '/change-password', label: 'Security & Password', icon: KeyRound, end: false },
  ];

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Handle ESC key to close mobile drawer
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  return (
    <div className="flex min-h-screen bg-[#f4f7fc] text-slate-800">
      {/* Desktop Dark Navy Sidebar */}
      <aside className="no-print hidden lg:flex w-64 shrink-0 flex-col justify-between bg-[#132238] text-slate-300">
        <div>
          {/* Sidebar Header: Logo */}
          <div className="border-b border-slate-700/50 p-5">
            <Link to={base} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-lg">
              <LeaveHubLogo light={true} />
            </Link>
          </div>

          {/* Sidebar Nav */}
          <nav className="space-y-1.5 p-4" aria-label="Desktop applicant navigation">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
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
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-rose-500/10 hover:text-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>Sign out</span>
            </button>
          </nav>
        </div>

        {/* Motivational Sidebar Footer Tagline */}
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

      {/* Mobile Responsive Navigation Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true" aria-label="Mobile navigation">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="relative z-10 flex w-72 flex-col justify-between bg-[#132238] text-slate-300 shadow-2xl transition-transform animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex items-center justify-between border-b border-slate-700/50 p-5">
                <Link to={base} onClick={() => setMobileOpen(false)}>
                  <LeaveHubLogo light={true} />
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close navigation menu"
                  className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <nav className="space-y-1.5 p-4" aria-label="Mobile navigation">
                {navItems.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={() => setMobileOpen(false)}
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
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                >
                  <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>Sign out</span>
                </button>
              </nav>
            </div>

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
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="no-print sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-xs">
          <div className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
            {/* Left: Mobile Hamburger & Breadcrumbs */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation menu"
                className="inline-flex lg:hidden items-center justify-center rounded-xl p-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>

              <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-600">
                <Link to={base} className="text-blue-600 hover:text-blue-700 font-semibold">
                  Home
                </Link>
                <Link to={`${base}/apply`} className="hover:text-slate-900 transition-colors">
                  Apply Leave
                </Link>
                <Link to={`${base}/history`} className="hover:text-slate-900 transition-colors">
                  Leave History
                </Link>
                <Link to={`${base}/calendar`} className="hover:text-slate-900 transition-colors">
                  Calendar &amp; Events
                </Link>
              </nav>

              <div className="flex md:hidden items-center">
                <span className="font-bold text-slate-900">LeaveHub</span>
              </div>
            </div>

            {/* Right: Notifications & User Profile */}
            <div className="flex items-center gap-3 sm:gap-4">
              <NotificationBell />

              {/* User Avatar with Initials */}
              <div className="flex items-center gap-3 border-l border-slate-200 pl-3 sm:pl-4">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white shadow-sm ring-2 ring-blue-100 text-xs sm:text-sm">
                  {getInitials(user?.name)}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold leading-tight text-slate-900">
                    {user?.name || 'User'}
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
        <main className="flex-1 p-4 sm:p-6 md:p-8">
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
              <span className="hover:text-slate-700 cursor-pointer">Help &amp; Support</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
