import { Navigate, Route, Routes } from 'react-router-dom';
import NotFoundPage from '../pages/NotFoundPage.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import ChangePasswordPage from '../pages/ChangePasswordPage.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
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
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
