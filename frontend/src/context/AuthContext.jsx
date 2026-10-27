import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authAPI } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // verifying stored token

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('ct_token');
    const storedUser = localStorage.getItem('ct_user');
    if (token && storedUser) {
      try {
        const u = JSON.parse(storedUser);
        setUser(u);
        connectSocket(token);
      } catch {
        localStorage.removeItem('ct_token');
        localStorage.removeItem('ct_user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const res = await authAPI.login(email, password);
      const { token, user: u } = res.data.data;
      localStorage.setItem('ct_token', token);
      localStorage.setItem('ct_user', JSON.stringify(u));
      setUser(u);
      connectSocket(token);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Check your credentials.';
      return { success: false, error: message };
    }
  }, []);

  const register = useCallback(async (data) => {
    try {
      const res = await authAPI.register(data);
      // We don't automatically log them in per requirements: "allow the user to log in using their new credentials"
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed.';
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ct_token');
    localStorage.removeItem('ct_user');
    disconnectSocket();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
