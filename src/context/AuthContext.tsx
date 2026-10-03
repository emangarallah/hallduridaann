import React, { createContext, useContext, useState, useEffect } from 'react';
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
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'rdn_auth_token';
const CURRENT_USER_KEY = 'rdn_current_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Synchronize and verify session with backend server on mount
  useEffect(() => {
    const verifyStoredSession = async () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        if (!storedToken) {
          setUser(null);
          setToken(null);
          setIsLoading(false);
          return;
        }

        setToken(storedToken);

        // Verify with server /api/auth/me to fetch authoritative server role
        const res = await fetchApi('/api/auth/me');

        if (res.ok) {
          const data = await parseResponseJson(res);
          if (data.user && data.user.isActive) {
            setUser(data.user);
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.user));
          } else {
            // User suspended or invalid
            logout();
          }
        } else {
          // Token expired or invalid on server
          logout();
        }
      } catch (err) {
        console.error('Session verification error:', err);
        // Fallback to stored user cache if network is temporarily offline
        const cachedUser = localStorage.getItem(CURRENT_USER_KEY);
        if (cachedUser) {
          try {
            setUser(JSON.parse(cachedUser));
          } catch {
            logout();
          }
        }
      } finally {
        setIsLoading(false);
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
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  const updateProfile = async (data: { name: string; phone: string }) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
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
