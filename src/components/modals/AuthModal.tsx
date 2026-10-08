import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  Sparkles,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useRegisterCustomerMutation, useLoginCustomerMutation } from '../../hooks/useCustomerBookingQuery';
import { User } from '../../types';
import { fetchApi, parseResponseJson, formatErrorMessage } from '../../utils/apiConfig';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: User) => void;
  onOpenAdminLogin?: () => void;
  onNavigateToReset?: (token: string) => void;
  initialTab?: 'login' | 'register';
  initialEmail?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenAdminLogin,
  onNavigateToReset,
  initialTab = 'login',
  initialEmail = ''
}) => {
  const { setAuthUser } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const registerMutation = useRegisterCustomerMutation();
  const loginMutation = useLoginCustomerMutation();

  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>(initialTab);
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState(initialEmail);
  const [loginPass, setLoginPass] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regPassConfirm, setRegPassConfirm] = useState('');

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotResetUrl, setForgotResetUrl] = useState<string | null>(null);
  const [forgotResetToken, setForgotResetToken] = useState<string | null>(null);
  const [forgotCopied, setForgotCopied] = useState(false);

  const [error, setError] = useState('');
  const [registeredSuccessNotice, setRegisteredSuccessNotice] = useState<string | null>(null);
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [registerSubmitting, setRegisterSubmitting] = useState(false);
  const loginSubmitLock = useRef(false);
  const registerSubmitLock = useRef(false);

  useEffect(() => {
    if (isOpen) {
      if (initialTab) setTab(initialTab);
      if (initialEmail) setLoginEmail(initialEmail);
      setError('');
      setRegisteredSuccessNotice(null);
      setLoginSubmitting(false);
      setRegisterSubmitting(false);
      loginSubmitLock.current = false;
      registerSubmitLock.current = false;
    }
  }, [isOpen, initialTab, initialEmail]);

  if (!isOpen) return null;

  const isLoginSubmitting = loginSubmitting || loginMutation.isPending;
  const isRegisterSubmitting = registerSubmitting || registerMutation.isPending;

  const handleLoginSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();

    // Lock immediately on the first click. React state updates are asynchronous,
    // so the ref prevents duplicate login requests during the same event loop tick.
    if (loginSubmitLock.current) return;
    loginSubmitLock.current = true;
    setLoginSubmitting(true);
    setError('');

    try {
      if (!loginEmail.trim() || !loginPass) {
        throw new Error('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      }

      const data = await loginMutation.mutateAsync({
        email: loginEmail.trim(),
        password: loginPass
      });

      setAuthUser(data.user, data.token);
      // Fast welcome toast that disappears quickly in 1.5s
      showSuccess(`مرحباً بك مجدداً، ${data.user.name}`, 1500);
      onClose();
      if (onSuccess) onSuccess(data.user);
    } catch (err: any) {
      const msg = formatErrorMessage(err, 'حدث خطأ أثناء تسجيل الدخول: تحقق من البريد الإلكتروني وكلمة المرور');
      setError(msg);
      showError(msg);
    } finally {
      loginSubmitLock.current = false;
      setLoginSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Lock immediately on the first click. React state alone is asynchronous,
    // so the ref prevents a second request even during the same event loop tick.
    if (registerSubmitLock.current) return;
    registerSubmitLock.current = true;
    setRegisterSubmitting(true);
    setError('');

    try {
      if (!regName.trim()) throw new Error('يرجى إدخال الاسم الكامل');
      if (!regEmail.includes('@')) throw new Error('يرجى إدخال بريد إلكتروني صحيح');
      if (!regPhone.trim()) throw new Error('يرجى إدخال رقم الهاتف');
      if (regPass.length < 6) throw new Error('كلمة المرور يجب أن لا تقل عن 6 أحرف أو أرقام');
      if (regPass !== regPassConfirm) throw new Error('كلمة المرور وتأكيدها غير متطابقين');

      await registerMutation.mutateAsync({
        name: regName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        password: regPass
      });

      // Requirement 2: Instant immediate transfer to login form with zero delay
      setTab('login');
      setLoginEmail(regEmail.trim());
      setLoginPass('');
      setRegPass('');
      setRegPassConfirm('');
      setRegisteredSuccessNotice('تم إنشاء حسابك بنجاح! تفضل بإدخال كلمة المرور لتسجيل الدخول فوراً.');
      showSuccess('تم إنشاء حسابك بنجاح! تم توجيهك فوراً إلى صفحة تسجيل الدخول.', 2500);
      window.history.pushState(null, '', '/login');
    } catch (err: any) {
      const code = err?.code;
      const returnedEmail = err?.email || regEmail.trim();

      // Case 2: Email and phone belong to the same existing user
      if (code === 'ACCOUNT_EXISTS') {
        const msg = 'لديك حساب مسجل بالفعل، سيتم تحويلك إلى تسجيل الدخول.';
        showInfo(msg);
        setError(msg);
        setTab('login');
        setLoginEmail(returnedEmail);
        window.history.pushState(null, '', '/login');
        return;
      }

      // Case 1: Email already registered
      if (code === 'EMAIL_EXISTS' || (err.message && err.message.includes('البريد الإلكتروني مسجل'))) {
        const msg = 'هذا البريد الإلكتروني مسجل بالفعل، يرجى تسجيل الدخول.';
        showError(msg);
        setError(msg);
        setTab('login');
        setLoginEmail(returnedEmail);
        window.history.pushState(null, '', '/login');
        return;
      }

      // Case 4: Phone already registered
      if (code === 'PHONE_EXISTS' || (err.message && err.message.includes('رقم الهاتف مسجل'))) {
        const msg = 'رقم الهاتف مسجل بالفعل.';
        showError(msg);
        setError(msg);
        return;
      }

      const msg = formatErrorMessage(err, 'حدث خطأ أثناء إنشاء الحساب');
      setError(msg);
      showError(msg);
    } finally {
      registerSubmitLock.current = false;
      setRegisterSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = forgotEmail.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }

    setForgotLoading(true);
    setError('');

    try {
      const res = await fetchApi('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail })
      });

      const data = await parseResponseJson(res);

      if (!res.ok) {
        throw new Error(formatErrorMessage(data?.error || data, 'تعذر إرسال طلب استعادة كلمة المرور'));
      }

      setForgotSent(true);
      if (data.resetUrl) setForgotResetUrl(data.resetUrl);
      if (data.token) setForgotResetToken(data.token);
    } catch (err: any) {
      setError(formatErrorMessage(err, 'حدث خطأ أثناء معالجة الطلب'));
    } finally {
      setForgotLoading(false);
    }
  };

  const handleCopyForgotLink = () => {
    if (!forgotResetUrl) return;
    const fullUrl = `${window.location.origin}${forgotResetUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setForgotCopied(true);
    setTimeout(() => setForgotCopied(false), 2000);
  };

  const handleOpenResetPage = () => {
    onClose();
    if (forgotResetToken && onNavigateToReset) {
      onNavigateToReset(forgotResetToken);
    } else if (forgotResetUrl) {
      window.history.pushState(null, '', forgotResetUrl);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const navigateToAdminLogin = () => {
    onClose();
    if (onOpenAdminLogin) {
      onOpenAdminLogin();
    } else {
      window.history.pushState(null, '', '/admin/login');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-md bg-[#11141c] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-950/20 text-right overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gold Glow Top Border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white font-serif-ar">
            {tab === 'login' && 'تسجيل الدخول'}
            {tab === 'register' && 'إنشاء حساب جديد'}
            {tab === 'forgot' && 'استعادة كلمة المرور'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            قاعة ذو ريدان للأفراح والمناسبات - صنعاء
          </p>
        </div>

        {/* Tabs */}
        {tab !== 'forgot' && (
          <div className="grid grid-cols-2 p-1 bg-[#0b0e16] rounded-xl mb-6 border border-slate-800">
            <button
              type="button"
              onClick={() => { setTab('login'); setError(''); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                tab === 'login'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              onClick={() => { setTab('register'); setError(''); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                tab === 'register'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              إنشاء حساب جديد
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        {tab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {registeredSuccessNotice && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2 animate-fadeIn">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{registeredSuccessNotice}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#0b0e16] border border-slate-700 rounded-xl py-2.5 px-3 pl-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  dir="ltr"
                  required
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  كلمة المرور
                </label>
                <button
                  type="button"
                  onClick={() => { setTab('forgot'); setError(''); }}
                  className="text-[11px] text-amber-400 hover:underline"
                >
                  نسيت كلمة المرور؟
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0b0e16] border border-slate-700 rounded-xl py-2.5 px-3 pl-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  dir="ltr"
                  required
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoginSubmitting}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-bold text-sm shadow-lg shadow-amber-500/20 transition-colors disabled:opacity-50 cursor-pointer touch-manipulation"
            >
              {loginSubmitting || loginMutation.isPending ? 'جاري التحقق وتسجيل الدخول...' : 'تسجيل الدخول'}
            </button>

            {/* Instant single-click switch to Register */}
            <div className="text-center pt-1 pb-1">
              <span className="text-xs text-slate-400">ليس لديك حساب بعد؟ </span>
              <button
                type="button"
                onClick={() => { setTab('register'); setError(''); }}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 hover:underline cursor-pointer transition-colors"
              >
                إنشاء حساب جديد فوراً ←
              </button>
            </div>

            {/* Clear Admin Login Button (Requirement 2) */}
            <div className="pt-4 border-t border-slate-800 text-center space-y-2">
              <p className="text-[11px] text-slate-400">هل أنت من طاقم إدارة القاعة؟</p>
              <button
                type="button"
                onClick={navigateToAdminLogin}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 hover:from-amber-500/20 hover:to-amber-500/30 border border-amber-500/40 rounded-xl text-xs text-amber-300 font-bold transition-all flex items-center justify-center gap-2 group shadow-sm cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>دخول الإدارة (Admin Login) ←</span>
              </button>
            </div>
          </form>
        )}

        {/* Register Form */}
        {tab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                الاسم الكامل
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="محمد أحمد الآنسي"
                  className="w-full bg-[#0b0e16] border border-slate-700 rounded-xl py-2 px-3 pl-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  required
                />
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full bg-[#0b0e16] border border-slate-700 rounded-xl py-2 px-3 pl-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  dir="ltr"
                  required
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                رقم الهاتف (واتساب)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="+967 771 234 567"
                  className="w-full bg-[#0b0e16] border border-slate-700 rounded-xl py-2 px-3 pl-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  dir="ltr"
                  required
                />
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  كلمة المرور
                </label>
                <input
                  type="password"
                  value={regPass}
                  onChange={(e) => setRegPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0b0e16] border border-slate-700 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  dir="ltr"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  تأكيد الكلمة
                </label>
                <input
                  type="password"
                  value={regPassConfirm}
                  onChange={(e) => setRegPassConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0b0e16] border border-slate-700 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300">
              * يتم إنشاء الحساب تلقائياً بصلاحية <strong>عميل (CUSTOMER)</strong> في قاعدة البيانات لحجز ومتابعة المناسبات.
            </div>

            <button
              type="submit"
              disabled={isRegisterSubmitting}
              className="w-full mt-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm shadow-lg shadow-amber-500/20 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {registerSubmitting || registerMutation.isPending ? 'جاري إنشاء الحساب...' : 'تأكيد وإنشاء الحساب'}
            </button>

            {/* Instant single-click switch to Login */}
            <div className="text-center pt-1 pb-1">
              <span className="text-xs text-slate-400">لديك حساب مسجل بالفعل؟ </span>
              <button
                type="button"
                onClick={() => { setTab('login'); setError(''); }}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 hover:underline cursor-pointer transition-colors"
              >
                تسجيل الدخول الآن ←
              </button>
            </div>

            {/* Clear Admin Login Button (Requirement 2) */}
            <div className="pt-3 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={navigateToAdminLogin}
                className="w-full py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-xs text-amber-300 font-bold transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>دخول الإدارة (Admin Login) ←</span>
              </button>
            </div>
          </form>
        )}

        {/* Forgot Form */}
        {tab === 'forgot' && (
          <div className="space-y-4">
            {forgotSent ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-3">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">تم إرسال رابط الاستعادة</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  إذا كان البريد (<strong className="text-amber-300 font-mono" dir="ltr">{forgotEmail}</strong>) مسجلاً لدينا، فقد تم إنشاء رابط آمن مؤقت لإعادة تعيين كلمة المرور فوراً.
                </p>

                {/* Direct Interactive Link */}
                {forgotResetUrl && (
                  <div className="pt-2 p-3 rounded-2xl bg-[#161c29] border border-amber-500/40 space-y-2.5 text-right">
                    <div className="text-[11px] text-amber-300 font-semibold flex items-center justify-between">
                      <span>رابط إعادة التعيين المباشر:</span>
                      <span className="text-[10px] text-slate-400">صالح لمدة 30 دقيقة</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleOpenResetPage}
                        className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>فتح صفحة تعيين كلمة المرور فوراً</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyForgotLink}
                        className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all flex items-center justify-center gap-1 cursor-pointer"
                        title="نسخ الرابط"
                      >
                        {forgotCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{forgotCopied ? 'تم النسخ' : 'نسخ'}</span>
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => { setTab('login'); setForgotSent(false); setForgotResetUrl(null); }}
                  className="mt-3 text-xs text-amber-400 hover:underline inline-block cursor-pointer"
                >
                  العودة لتسجيل الدخول
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    البريد الإلكتروني المسجل في الحساب
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="customer@dhuraydan.com"
                      className="w-full bg-[#0b0e16] border border-slate-700 rounded-xl py-2.5 px-3 pl-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                      dir="ltr"
                      required
                    />
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    لن يتم كشف أي معلومات عن الحساب لمنع محاولات التخمين.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {forgotLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>جاري المعالجة...</span>
                      </>
                    ) : (
                      <span>إرسال رابط الاستعادة</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTab('login'); setError(''); }}
                    className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
