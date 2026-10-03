import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';
import { fetchApi, parseResponseJson, formatErrorMessage } from '../../utils/apiConfig';

interface AdminLoginPageProps {
  onSuccess: (user: User) => void;
  setCurrentTab: (tab: string) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onSuccess,
  setCurrentTab,
}) => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in as ADMIN
  if (user && user.role === 'ADMIN') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#121622] rounded-2xl border border-amber-500/30 p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white font-serif-ar">أنت مسجل الدخول بالفعل كمدير</h2>
          <p className="text-xs text-slate-300">
            مرحباً بك <strong className="text-amber-300">{user.name}</strong>. يمكنك الانتقال مباشرة إلى لوحة التحكم.
          </p>
          <button
            onClick={() => {
              setCurrentTab('admin');
              window.history.pushState(null, '', '/admin');
            }}
            className="w-full py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 shadow-md"
          >
            الانتقال إلى لوحة تحكم الإدارة
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!email.trim() || !password) {
        throw new Error('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      }

      const res = await fetchApi('/api/auth/admin-login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          password
        })
      });

      const data = await parseResponseJson(res);

      if (!res.ok) {
        throw new Error(formatErrorMessage(data?.error || data, 'فشل تسجيل الدخول كمدير'));
      }

      const authenticatedUser: User = data.user;
      const authToken: string = data.token;

      // Persist in localStorage and update app state
      localStorage.setItem('rdn_auth_token', authToken);
      localStorage.setItem('rdn_current_user', JSON.stringify(authenticatedUser));
      document.cookie = `rdn_auth_token=${authToken}; path=/; max-age=604800; SameSite=Lax`;

      onSuccess(authenticatedUser);
    } catch (err: any) {
      setError(formatErrorMessage(err, 'حدث خطأ أثناء تسجيل الدخول'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="relative max-w-md w-full bg-[#121622] rounded-3xl border border-amber-500/30 p-8 shadow-2xl shadow-black/80 space-y-6 overflow-hidden">
        {/* Top Gold Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600"></div>

        {/* Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-950/30">
            <ShieldCheck className="w-9 h-9 text-amber-300" />
          </div>
          <span className="text-[11px] font-mono text-amber-400/90 tracking-widest uppercase block">
            ADMINISTRATOR PORTAL
          </span>
          <h1 className="text-2xl font-bold text-white font-serif-ar">
            دخول إدارة قاعة ذو ريدان
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            هذه البوابة مخصصة حصرياً لمدير النظام (ADMIN). يتطلب الدخول صلاحيات الإدارة الكاملة.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {/* Form: Email + Password + Login */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              البريد الإلكتروني للإدارة
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@dhuraydan.com"
                required
                dir="ltr"
                className="w-full bg-[#0a0d14] border border-slate-700/80 rounded-xl py-3 px-3.5 pl-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                dir="ltr"
                className="w-full bg-[#0a0d14] border border-slate-700/80 rounded-xl py-3 px-3.5 pl-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-sm shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isLoading ? (
              <span>جاري التحقق من الصلاحيات...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>تسجيل الدخول (Login)</span>
              </>
            )}
          </button>
        </form>

        {/* Back Link */}
        <div className="pt-2 border-t border-slate-800/80 text-center">
          <button
            onClick={() => {
              setCurrentTab('home');
              window.history.pushState(null, '', '/');
            }}
            className="text-xs text-slate-400 hover:text-amber-400 inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>العودة إلى موقع القاعة الرئيسي</span>
          </button>
        </div>
      </div>
    </div>
  );
};
