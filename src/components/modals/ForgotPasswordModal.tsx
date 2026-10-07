import React, { useState } from 'react';
import {
  X,
  Mail,
  KeyRound,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { fetchApi, parseResponseJson, formatErrorMessage } from '../../utils/apiConfig';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  onNavigateToReset?: (token: string) => void;
  source?: 'admin' | 'customer';
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  initialEmail = '',
  onNavigateToReset,
  source = 'customer'
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetchApi('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail })
      });

      const data = await parseResponseJson(res);

      if (!res.ok) {
        throw new Error(formatErrorMessage(data?.error || data, 'تعذر إرسال طلب استعادة كلمة المرور'));
      }

      setIsSuccess(true);
      if (data.resetUrl) setResetUrl(data.resetUrl);
      if (data.token) setResetToken(data.token);
    } catch (err: any) {
      setError(formatErrorMessage(err, 'حدث خطأ أثناء معالجة الطلب'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!resetUrl) return;
    const fullUrl = `${window.location.origin}${resetUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenReset = () => {
    onClose();
    if (resetToken && onNavigateToReset) {
      onNavigateToReset(resetToken);
    } else if (resetUrl) {
      window.history.pushState(null, '', resetUrl);
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
          className="absolute top-5 left-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
            <KeyRound className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white font-serif-ar">
            استعادة كلمة المرور
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {source === 'admin' ? 'بوابة إدارة قاعة ذو ريدان' : 'حساب عميل قاعة ذو ريدان'}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-white">تم إرسال رابط الاستعادة</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                إذا كان البريد الإلكتروني (<strong className="text-amber-300 font-mono" dir="ltr">{email}</strong>) مسجلاً لدينا،
                فقد تم إنشاء رابط آمن ومشفر لإعادة تعيين كلمة المرور فوراً.
              </p>
            </div>

            {/* Direct action button to open reset page */}
            {resetUrl && (
              <div className="pt-2 p-3 rounded-2xl bg-[#161c29] border border-amber-500/40 space-y-2.5 text-right">
                <div className="text-[11px] text-amber-300 font-semibold flex items-center justify-between">
                  <span>رابط إعادة التعيين المباشر:</span>
                  <span className="text-[10px] text-slate-400">صالح لمدة 30 دقيقة</span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleOpenReset}
                    className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>فتح صفحة تعيين كلمة المرور فوراً</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all flex items-center justify-center gap-1 cursor-pointer"
                    title="نسخ الرابط"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            >
              العودة لتسجيل الدخول
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                البريد الإلكتروني المسجل في الحساب
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#0b0e16] border border-slate-700 rounded-xl py-2.5 px-3 pl-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                  dir="ltr"
                  required
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                سنرسل لك رابطاً آمناً مؤقتاً لتغيير كلمة المرور دون كشف معلومات الحساب.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
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
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
