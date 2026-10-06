import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { User, UserRole } from '../types';
import { fetchApi, parseResponseJson, formatErrorMessage } from '../utils/apiConfig';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
  token: string | null;
  login: (email: string, pass?: string) => Promise<User>;
  register: (name: string, email: string, phone: string, pass?: string) => Promise<User>;
  logout: () => void;
  updateProfile: (data: { name: string; phone: string }) => Promise<void>;
  setAuthUser: (authUser: User, authToken: string) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'rdn_auth_token';
const CURRENT_USER_KEY = 'rdn_current_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  // Instant synchronous initialization from cache to prevent navigation latency
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem(CURRENT_USER_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  // Background revalidation with authoritative server session
  useEffect(() => {
    const verifyStoredSession = async () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        if (!storedToken) {
          setUser(null);
          setToken(null);
          queryClient.setQueryData(['authUser'], null);
          return;
        }

        setToken(storedToken);

        // Verify with server /api/auth/me in background
        const res = await fetchApi('/api/auth/me');

        if (res.ok) {
          const data = await parseResponseJson(res);
          if (data.user && data.user.isActive) {
            setUser(data.user);
            queryClient.setQueryData(['authUser'], data.user);
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.user));
          } else {
            logout();
          }
        } else {
          logout();
        }
      } catch (err) {
        console.warn('Session verification fallback to cache:', err);
      }
    };

    verifyStoredSession();
  }, []);

  const login = async (email: string, pass?: string): Promise<User> => {
    const res = await fetchApi('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim(),
        password: pass || (email.includes('admin') ? 'admin123456' : 'user123456')
      })
    });

    const data = await parseResponseJson(res);

    if (!res.ok) {
      throw new Error(formatErrorMessage(data?.error || data, 'فشل تسجيل الدخول: تحقق من البريد الإلكتروني وكلمة المرور'));
    }

    const authenticatedUser: User = data.user;
    const authToken: string = data.token || `token_${authenticatedUser.id}`;

    setUser(authenticatedUser);
    setToken(authToken);
    queryClient.setQueryData(['authUser'], authenticatedUser);
    localStorage.setItem(TOKEN_KEY, authToken);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(authenticatedUser));

    return authenticatedUser;
  };

  const register = async (name: string, email: string, phone: string, pass?: string): Promise<User> => {
    const res = await fetchApi('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: pass || 'user123456'
      })
    });

    const data = await parseResponseJson(res);

    if (!res.ok) {
      throw new Error(formatErrorMessage(data?.error || data, 'فشل إنشاء الحساب'));
    }

    // Role is strictly CUSTOMER from server
    const newUser: User = data.user;
    const authToken: string = data.token || `token_${newUser.id}`;

    setUser(newUser);
    setToken(authToken);
    queryClient.setQueryData(['authUser'], newUser);
    localStorage.setItem(TOKEN_KEY, authToken);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));

    return newUser;
  };

  const logout = () => {
    try {
      if (token) {
        fetchApi('/api/auth/logout', {
          method: 'POST'
        }).catch(() => {});
      }
    } catch {}

    setUser(null);
    setToken(null);
    queryClient.setQueryData(['authUser'], null);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  const updateProfile = async (data: { name: string; phone: string }) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    queryClient.setQueryData(['authUser'], updated);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
  };

  const setAuthUser = (authUser: User, authToken: string) => {
    setUser(authUser);
    setToken(authToken);
    queryClient.setQueryData(['authUser'], authUser);
    localStorage.setItem(TOKEN_KEY, authToken);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(authUser));
    document.cookie = `${TOKEN_KEY}=${authToken}; path=/; max-age=604800; SameSite=Lax`;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        isCustomer: user?.role === 'CUSTOMER',
        token,
        login,
        register,
        logout,
        updateProfile,
        setAuthUser,
        isLoading,
      }}
    >
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
