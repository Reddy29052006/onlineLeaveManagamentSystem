import { Navigate, Route, Routes } from 'react-router-dom';
import NotFoundPage from '../pages/NotFoundPage.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import ChangePasswordPage from '../pages/ChangePasswordPage.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';
import AdminHome from '../pages/admin/AdminHome.jsx';
import AdminUsersPage from '../pages/admin/AdminUsersPage.jsx';
import AdminUserDetailPage from '../pages/admin/AdminUserDetailPage.jsx';
import AdminApplicationsPage from '../pages/admin/AdminApplicationsPage.jsx';
import AdminApplicationDetailPage from '../pages/admin/AdminApplicationDetailPage.jsx';
import AdminCalendarPage from '../pages/admin/AdminCalendarPage.jsx';
import AdminSettingsPage from '../pages/admin/AdminSettingsPage.jsx';
import ApplicantLayout from '../layouts/ApplicantLayout.jsx';
import LeaveApplyPage from '../pages/student/LeaveApplyPage.jsx';
import LeaveHistoryPage from '../pages/student/LeaveHistoryPage.jsx';
import ApplicationDetailPage from '../pages/student/ApplicationDetailPage.jsx';
import SharedCalendarPage from '../pages/calendar/SharedCalendarPage.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import FullPageSpinner from '../components/FullPageSpinner.jsx';
import { useAuth } from '../features/auth/AuthContext.jsx';
import { homePathForRole } from './roleHome.js';

function RootRedirect() {
  const { user, initializing } = useAuth();
  if (initializing) return <FullPageSpinner />;
  return (
    <Navigate to={user ? homePathForRole(user.role) : '/login'} replace />
  );
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminHome />} />
        <Route path="applications" element={<AdminApplicationsPage />} />
        <Route
          path="applications/:id"
          element={<AdminApplicationDetailPage />}
        />
        <Route path="calendar" element={<AdminCalendarPage />} />
        <Route path="students" element={<AdminUsersPage role="student" />} />
        <Route
          path="students/:id"
          element={<AdminUserDetailPage role="student" />}
        />
        <Route path="teachers" element={<AdminUsersPage role="teacher" />} />
        <Route
          path="teachers/:id"
          element={<AdminUserDetailPage role="teacher" />}
        />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <ApplicantLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="apply" element={<LeaveApplyPage />} />
        <Route path="history" element={<LeaveHistoryPage />} />
        <Route path="calendar" element={<SharedCalendarPage />} />
        <Route path="applications/:id" element={<ApplicationDetailPage />} />
      </Route>

      <Route
        path="/teacher"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <ApplicantLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="apply" element={<LeaveApplyPage />} />
        <Route path="history" element={<LeaveHistoryPage />} />
        <Route path="calendar" element={<SharedCalendarPage />} />
        <Route path="applications/:id" element={<ApplicationDetailPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
