import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, Radio, X } from 'lucide-react';
import { notificationsApi } from '../services/notificationsApi.js';
import { useAuth } from '../features/auth/AuthContext.jsx';
import { wsClient } from '../services/websocket.js';

function formatTime(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return '';
  }
}

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const base = `/${user?.role || ''}`;

  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null); // Real-time floating toast
  const containerRef = useRef(null);

  const loadUnread = useCallback(async () => {
    try {
      const response = await notificationsApi.unreadCount();
      setUnread(response.data.unreadCount || 0);
    } catch {
      /* ignore */
    }
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await notificationsApi.list({ limit: 15 });
      setItems(response.data.items || []);
      setUnread(response.data.unreadCount || 0);
    } catch (err) {
      setError(err.message || 'Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUnread();
    const id = window.setInterval(loadUnread, 60000);
    return () => window.clearInterval(id);
  }, [loadUnread]);

  // WebSocket real-time subscription for live notifications
  useEffect(() => {
    // 1. Personal notification received
    const unsubNotification = wsClient.subscribe('notification:new', (notification) => {
      setUnread((count) => count + 1);
      setItems((prev) => {
        const filtered = prev.filter((item) => item._id !== notification._id);
        return [notification, ...filtered];
      });

      // Show live toast for 6 seconds
      setToast({
        id: notification._id || Date.now(),
        title: notification.title,
        message: notification.message,
        application: notification.application,
        link: notification.application
          ? `${base}/applications/${notification.application}`
          : null,
      });
    });

    // 2. Admin broadcast for new leave submissions
    const unsubAdmin = wsClient.subscribe('application:submitted', (data) => {
      if (user?.role === 'admin') {
        setToast({
          id: Date.now(),
          title: `New leave request: ${data.applicationId}`,
          message: `${data.applicantName} (${data.applicantRole}) submitted a leave application for ${data.startDate} → ${data.endDate}.`,
          link: '/admin/applications',
        });
      }
    });

    return () => {
      unsubNotification();
      unsubAdmin();
    };
  }, [user, base]);

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!open) return;
    loadList();
  }, [open, loadList]);

  useEffect(() => {
    function onClick(event) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    function onKey(event) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  async function markOneRead(notification) {
    if (notification.readAt) {
      navigateLink(notification);
      return;
    }
    try {
      await notificationsApi.markRead(notification._id);
      setItems((prev) =>
        prev.map((item) =>
          item._id === notification._id ? { ...item, readAt: new Date().toISOString() } : item
        )
      );
      setUnread((u) => Math.max(0, u - 1));
      navigateLink(notification);
    } catch {
      navigateLink(notification);
    }
  }

  function navigateLink(notification) {
    setOpen(false);
    if (notification.application) {
      navigate(`${base}/applications/${notification.application}`);
    }
  }

  async function markAll() {
    try {
      await notificationsApi.markAllRead();
      setItems((prev) => prev.map((item) => ({ ...item, readAt: new Date().toISOString() })));
      setUnread(0);
    } catch (err) {
      setError(err.message || 'Unable to mark all read.');
    }
  }

  return (
    <>
      <div className="relative" ref={containerRef}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="relative flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 transition-colors"
          aria-label="Notifications"
          title="Notifications (Live WebSocket)"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unread > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1 text-xs font-semibold text-white animate-pulse">
              {unread > 99 ? '99+' : unread}
            </span>
          ) : (
            <span
              className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-500"
              title="Live connected"
            />
          )}
        </button>

        {open && (
          <div className="absolute right-0 z-50 mt-2 w-80 sm:w-96 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5 bg-slate-50">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-slate-800">Notifications</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] font-medium text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live
                </span>
              </div>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={markAll}
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <p className="px-4 py-6 text-center text-sm text-slate-500">Loading notifications…</p>
              ) : error ? (
                <p className="px-4 py-3 text-sm text-red-600">{error}</p>
              ) : items.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-500">
                  <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-slate-300" />
                  No notifications yet.
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {items.map((notification) => (
                    <li key={notification._id}>
                      <button
                        type="button"
                        onClick={() => markOneRead(notification)}
                        className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                          !notification.readAt ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-900 line-clamp-1">
                            {notification.title}
                          </span>
                          {!notification.readAt && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                          )}
                        </div>
                        <span className="text-xs text-slate-600 line-clamp-2">{notification.message}</span>
                        <span className="text-[11px] text-slate-400">
                          {formatTime(notification.createdAt)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Real-time Floating Notification Toast */}
      {toast && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-4 right-4 z-50 flex max-w-sm items-start gap-3 rounded-2xl border border-blue-200 bg-white p-4 shadow-2xl ring-1 ring-blue-500/20 transition-all animate-in fade-in slide-in-from-bottom-5"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Radio className="h-4 w-4 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-slate-900">{toast.title}</h4>
            <p className="mt-0.5 text-xs text-slate-600">{toast.message}</p>
            {toast.link && (
              <button
                type="button"
                onClick={() => {
                  setToast(null);
                  navigate(toast.link);
                }}
                className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
              >
                View details →
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </aside>
      )}
    </>
  );
}
