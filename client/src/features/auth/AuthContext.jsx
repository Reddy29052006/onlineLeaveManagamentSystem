import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { apiClient, onUnauthorized } from '../../services/apiClient.js';
import { wsClient } from '../../services/websocket.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await apiClient.get('/auth/me');
      setUser(response.data.user);
      return response.data.user;
    } catch {
      setUser(null);
      return null;
    } finally {
      setInitializing(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const unsubscribe = onUnauthorized(() => setUser(null));
    return unsubscribe;
  }, [refresh]);

  // Connect or disconnect real-time WebSocket on user change
  useEffect(() => {
    if (user) {
      wsClient.connect(user);
    } else {
      wsClient.disconnect();
    }
    return () => {
      // wsClient cleanup handled in disconnect
    };
  }, [user]);

  const login = useCallback(async (identifier, password) => {
    const response = await apiClient.post('/auth/login', { identifier, password });
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      /* ignore network/CSRF errors on logout */
    } finally {
      wsClient.disconnect();
      setUser(null);
    }
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    const response = await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const value = useMemo(
    () => ({ user, initializing, login, logout, changePassword, refresh }),
    [user, initializing, login, logout, changePassword, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
