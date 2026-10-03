import React from 'react';
import { ShieldAlert, ArrowRight, Home, User, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Forbidden403PageProps {
  setCurrentTab: (tab: string) => void;
  openAuthModal: () => void;
}

export const Forbidden403Page: React.FC<Forbidden403PageProps> = ({
  setCurrentTab,
  openAuthModal,
}) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-[#121622] rounded-3xl border border-red-500/30 p-8 text-center space-y-6 shadow-2xl shadow-red-950/20">
        
        {/* Shield Icon */}
        <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto shadow-lg">
          <ShieldAlert className="w-10 h-10 animate-pulse" />
        </div>

        {/* Status Code & Title */}
        <div className="space-y-2">
          <span className="text-3xl font-black font-mono text-red-500 tracking-wider">
            403 FORBIDDEN
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-serif-ar">
            عذراً، لا تمتلك صلاحية الوصول لهذه الصفحة
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
            لوحة تحكم الإدارة ومسارات <span className="font-mono text-amber-400">/admin/*</span> مخصصة حصرياً لمدير النظام (ADMIN). حسابك الحالي مسجل كـ <strong className="text-white">عميل (CUSTOMER)</strong> ولا يملك صلاحيات الإدارة.
          </p>
        </div>

        {/* Current user badge */}
        {user && (
          <div className="p-3 bg-[#0a0d14] rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <div className="text-right">
              <span className="text-slate-300 font-bold block">{user.name}</span>
              <span className="text-[11px] font-mono">{user.email}</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 font-semibold text-[10px]">
              الدور: {user.role}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => {
              setCurrentTab('home');
              window.history.pushState(null, '', '/');
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>العودة للرئيسية</span>
          </button>

          <button
            onClick={() => {
              setCurrentTab('account');
              window.history.pushState(null, '', '/account');
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#182133] hover:bg-[#222d44] text-white font-semibold text-xs border border-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4 text-amber-400" />
            <span>لوحة حسابي (العميل)</span>
          </button>

          <button
            onClick={() => {
              logout();
              openAuthModal();
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 font-semibold text-xs border border-red-500/30 transition-colors flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>دخول بحساب مدير</span>
          </button>
        </div>

      </div>
    </div>
  );
};
