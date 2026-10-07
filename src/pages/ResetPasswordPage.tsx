import React, { useState, useEffect } from 'react';
import {
  Lock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  User,
  ArrowRight,
  RefreshCw,
  KeyRound,
  ShieldAlert
} from 'lucide-react';
import { fetchApi, parseResponseJson, formatErrorMessage } from '../utils/apiConfig';

interface ResetPasswordPageProps {
  initialToken?: string;
  setCurrentTab: (tab: string) => void;
  openAuthModal?: (tab?: 'login' | 'register') => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({
  initialToken,
  setCurrentTab,
  openAuthModal
}) => {
  const [token, setToken] = useState<string>(() => {
    if (initialToken) return initialToken;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('token') || '';
    } catch {
      return '';
    }
  });

  const [isVerifying, setIsVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenError, setTokenError] = useState('');
  const [userInfo, setUserInfo] = useState<{
    name?: string;
    emailMasked?: string;
    role?: 'ADMIN' | 'CUSTOMER';
  } | null>(null);

  // Form states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [userRoleAfterReset, setUserRoleAfterReset] = useState<'ADMIN' | 'CUSTOMER'>('CUSTOMER');

  // Verify token on mount or token change
  useEffect(() => {
    let isMounted = true;

    const verifyToken = async () => {
      if (!token) {
        if (isMounted) {
          setIsVerifying(false);
          setTokenValid(false);
          setTokenError('لم يتم العثور على رمز إعادة التعيين في الرابط. يرجى التأكد من نسخ الرابط كاملاً.');
        }
        return;
      }

      setIsVerifying(true);
      setTokenError('');

      try {
        const res = await fetchApi(`/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
        const data = await parseResponseJson(res);

        if (!isMounted) return;

        if (res.ok && data.valid) {
          setTokenValid(true);
          setUserInfo({
            name: data.name,
            emailMasked: data.emailMasked,
            role: data.role
          });
          setUserRoleAfterReset(data.role || 'CUSTOMER');
        } else {
          setTokenValid(false);
          setTokenError(formatErrorMessage(data?.error || data, 'رابط إعادة التعيين غير صالح أو انتهت صلاحيته (المدة 30 دقيقة).'));
        }
      } catch (err: any) {
        if (!isMounted) return;
        setTokenValid(false);
        setTokenError(formatErrorMessage(err, 'تعذر التحقق من رمز إعادة التعيين.'));
      } finally {
        if (isMounted) setIsVerifying(false);
      }
    };

    verifyToken();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Password strength calculations
  const calculateStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'فارغة', color: 'bg-slate-700', textCol: 'text-slate-400' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 1, label: 'ضعيفة', color: 'bg-red-500', textCol: 'text-red-400' };
    if (score === 2) return { score: 2, label: 'مقبولة', color: 'bg-amber-500', textCol: 'text-amber-400' };
    if (score <= 4) return { score: 3, label: 'جيدة', color: 'bg-emerald-500', textCol: 'text-emerald-400' };
    return { score: 4, label: 'قوية جداً', color: 'bg-emerald-400', textCol: 'text-emerald-300' };
  };

  const strength = calculateStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (newPassword.length < 8) {
      setSubmitError('كلمة المرور يجب أن لا تقل عن 8 أحرف أو أرقام لضمان الأمان.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setSubmitError('كلمة المرور وتأكيدها غير متطابقين.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetchApi('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token,
          newPassword,
          confirmPassword
        })
      });

      const data = await parseResponseJson(res);

      if (!res.ok) {
        throw new Error(formatErrorMessage(data?.error || data, 'فشل تغيير كلمة المرور'));
      }

      setIsSuccess(true);
      if (data.role) {
        setUserRoleAfterReset(data.role);
      }
    } catch (err: any) {
      setSubmitError(formatErrorMessage(err, 'حدث خطأ أثناء تغيير كلمة المرور'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToLogin = () => {
    if (userRoleAfterReset === 'ADMIN') {
      setCurrentTab('admin-login');
      window.history.pushState(null, '', '/admin/login');
    } else {
      setCurrentTab('home');
      window.history.pushState(null, '', '/login');
      if (openAuthModal) {
        openAuthModal('login');
      }
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 py-12">
      <div className="relative max-w-lg w-full bg-[#121622] rounded-3xl border border-amber-500/30 p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6 overflow-hidden">
        {/* Top Gold Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600"></div>

        {/* Header Icon */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-md">
            <KeyRound className="w-8 h-8" />
          </div>
          <span className="text-[11px] font-mono text-amber-400/90 tracking-widest uppercase block">
            SECURE PASSWORD RECOVERY
          </span>
          <h1 className="text-2xl font-bold text-white font-serif-ar">
            إعادة تعيين كلمة المرور
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
            منظومة الأمان وحماية الحسابات - قاعة ذو ريدان للأفراح والمناسبات
          </p>
        </div>

        {/* Loading State */}
        {isVerifying && (
          <div className="py-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-300 font-medium">
              جاري التحقق من صلاحية رمز إعادة التعيين المشفر...
            </p>
          </div>
        )}

        {/* Invalid Token Screen */}
        {!isVerifying && tokenValid === false && (
          <div className="space-y-6 py-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-base font-bold text-white">الرابط غير صالح أو منتهي الصلاحية</h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                {tokenError || 'انتهت صلاحية هذا الرابط (صلاحية الروابط 30 دقيقة لأسباب أمنية)، أو تم استخدامه مسبقاً.'}
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  setCurrentTab('home');
                  window.history.pushState(null, '', '/login');
                  if (openAuthModal) openAuthModal('login');
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                طلب رابط جديد (تسجيل الدخول)
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentTab('admin-login');
                  window.history.pushState(null, '', '/admin/login');
                }}
                className="py-3 px-4 rounded-xl bg-[#1a2030] hover:bg-[#242c42] text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
              >
                بوابة الإدارة
              </button>
            </div>
          </div>
        )}

        {/* Success Screen */}
        {!isVerifying && isSuccess && (
          <div className="space-y-6 py-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/40">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white font-serif-ar">تم تغيير كلمة المرور بنجاح!</h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                تم تحديث كلمة المرور وتشفيرها بنجاح في قاعدة البيانات. يمكنك الآن تسجيل الدخول فوراً باستخدام كلمة المرور الجديدة.
              </p>
            </div>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                نوع الحساب المُحدَّث:{' '}
                <strong>{userRoleAfterReset === 'ADMIN' ? 'مدير النظام (ADMIN)' : 'عميل (CUSTOMER)'}</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={handleGoToLogin}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>
                {userRoleAfterReset === 'ADMIN'
                  ? 'الانتقال إلى تسجيل دخول الإدارة (Admin Login)'
                  : 'الانتقال إلى تسجيل الدخول (Login)'}
              </span>
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
          </div>
        )}

        {/* Password Reset Form */}
        {!isVerifying && tokenValid && !isSuccess && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* User Target Badge */}
            {userInfo && (
              <div className="p-3.5 rounded-2xl bg-[#0b0e16] border border-amber-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                    {userInfo.role === 'ADMIN' ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="font-bold text-white">{userInfo.name || 'مستخدم النظام'}</div>
                    <div className="text-[11px] text-slate-400 font-mono" dir="ltr">{userInfo.emailMasked}</div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    userInfo.role === 'ADMIN'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  }`}
                >
                  {userInfo.role === 'ADMIN' ? 'إدارة القاعة' : 'عميل'}
                </span>
              </div>
            )}

            {submitError && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{submitError}</span>
              </div>
            )}

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                كلمة المرور الجديدة
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  dir="ltr"
                  minLength={8}
                  className="w-full bg-[#0a0d14] border border-slate-700/80 rounded-xl py-3 px-3.5 pl-20 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all font-mono"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-9 top-3 text-slate-400 hover:text-white p-0.5 cursor-pointer"
                  title={showPassword ? 'إخفاء' : 'إظهار'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {newPassword && (
                <div className="mt-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">قوة كلمة المرور:</span>
                    <span className={`font-bold ${strength.textCol}`}>{strength.label}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 h-1.5">
                    <div className={`rounded-full transition-all ${strength.score >= 1 ? strength.color : 'bg-slate-800'}`}></div>
                    <div className={`rounded-full transition-all ${strength.score >= 2 ? strength.color : 'bg-slate-800'}`}></div>
                    <div className={`rounded-full transition-all ${strength.score >= 3 ? strength.color : 'bg-slate-800'}`}></div>
                    <div className={`rounded-full transition-all ${strength.score >= 4 ? strength.color : 'bg-slate-800'}`}></div>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    يجب أن تحتوي على 8 أحرف على الأقل، ويفضل مزيج من الأرقام والحروف والرموز.
                  </p>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                تأكيد كلمة المرور الجديدة
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  dir="ltr"
                  minLength={8}
                  className="w-full bg-[#0a0d14] border border-slate-700/80 rounded-xl py-3 px-3.5 pl-20 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all font-mono"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute left-9 top-3 text-slate-400 hover:text-white p-0.5 cursor-pointer"
                  title={showConfirmPassword ? 'إخفاء' : 'إظهار'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[11px] text-red-400 mt-1">كلمتا المرور غير متطابقتين بعد</p>
              )}
              {confirmPassword && newPassword === confirmPassword && (
                <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>كلمتا المرور متطابقتان</span>
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || newPassword.length < 8 || newPassword !== confirmPassword}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-sm shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري تشفير وحفظ كلمة المرور...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>تأكيد وحفظ كلمة المرور الجديدة</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
