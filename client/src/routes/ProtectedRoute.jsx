import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext.jsx';
import FullPageSpinner from '../components/FullPageSpinner.jsx';
import { homePathForRole } from './roleHome.js';

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return <FullPageSpinner label="Checking your session…" />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // System Administrators can view student and teacher sections for administrative inspection
    if (user.role === 'admin' && (allowedRoles.includes('student') || allowedRoles.includes('teacher'))) {
      return children;
    }
    return <Navigate to={homePathForRole(user.role)} replace />;
  }

  return children;
}
