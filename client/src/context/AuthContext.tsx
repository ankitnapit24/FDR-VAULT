import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';
import { User, UserRole } from '../types/index.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem('fdrvault_user') || localStorage.getItem('fdrflow_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('fdrvault_token') || localStorage.getItem('fdrflow_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function verifyAuth() {
      const storedToken = localStorage.getItem('fdrvault_token') || localStorage.getItem('fdrflow_token');
      if (!storedToken) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (res.data.success && res.data.user) {
          setUser(res.data.user);
          localStorage.setItem('fdrvault_user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        setUser(null);
        setToken(null);
        localStorage.removeItem('fdrvault_token');
        localStorage.removeItem('fdrvault_user');
        localStorage.removeItem('fdrflow_token');
        localStorage.removeItem('fdrflow_user');
      } finally {
        setIsLoading(false);
      }
    }

    verifyAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const res = await api.post('/auth/login', { email, password: pass });
      if (res.data.success) {
        const { token: receivedToken, user: receivedUser } = res.data;
        setToken(receivedToken);
        setUser(receivedUser);
        localStorage.setItem('fdrvault_token', receivedToken);
        localStorage.setItem('fdrvault_user', JSON.stringify(receivedUser));
        return { success: true };
      }
      return { success: false, message: res.data.message || 'Login failed.' };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login error occurred. Check credentials.',
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore logout network errors
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('fdrvault_token');
      localStorage.removeItem('fdrvault_user');
      localStorage.removeItem('fdrflow_token');
      localStorage.removeItem('fdrflow_user');
      window.location.href = '/login';
    }
  };

  const hasRole = (...roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
