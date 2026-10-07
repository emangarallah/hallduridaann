import React, { useState, useCallback, useMemo } from 'react';
import {
  Calendar,
  Phone,
  MessageCircle,
  User as UserIcon,
  Shield,
  Menu,
  X,
  Bell,
  CheckCircle2,
  Sparkles,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GlobalToggleBar } from './GlobalToggleBar';
import { useHallSettingsQuery } from '../../hooks/useHallDataQuery';
import {
  useNotificationsQuery,
  useMarkNotificationReadOptimisticMutation
} from '../../hooks/useCustomerBookingQuery';
import { AppNotification, HallSettings } from '../../types';

export interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openAuthModal: (tab?: 'login' | 'register') => void;
}

const NavbarComponent: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, openAuthModal }) => {
  const { user, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [badgeDismissedLocally, setBadgeDismissedLocally] = useState(false);

  // TanStack Query with staleTime (5 mins) for shared cached hall settings
  const { data: settings } = useHallSettingsQuery();

  // TanStack Query for Live Notifications with automatic polling and cache management
  const { data: notifications = [] } = useNotificationsQuery(user?.id, isAdmin);
  const markReadMutation = useMarkNotificationReadOptimisticMutation();

  const unreadCount = badgeDismissedLocally ? 0 : notifications.filter(n => !n.isRead).length;

  const handleToggleNotifications = useCallback(() => {
    setNotificationsOpen(prev => {
      const next = !prev;
      if (next) {
        // Optimistic State Update: immediately zero out badge counter on clicking the bell icon
        setBadgeDismissedLocally(true);
      }
      return next;
    });
  }, []);

  const handleNotificationClick = useCallback((notif: AppNotification) => {
    // 1. Instantly update React Query Cache with onMutate (zeroes badge & dismisses in 0ms)
    setBadgeDismissedLocally(true);
    markReadMutation.mutate(notif.id);
    setNotificationsOpen(false);

    // 2. Navigate immediately
    if (isAdmin) {
      setCurrentTab('admin');
    } else {
      setCurrentTab('account');
    }
  }, [isAdmin, markReadMutation, setCurrentTab]);

  const navLinks = useMemo(() => [
    { id: 'home', label: 'الرئيسية' },
    { id: 'about', label: 'عن القاعة' },
    { id: 'services', label: 'الخدمات' },
    { id: 'packages', label: 'الباقات' },
    { id: 'gallery', label: 'المعرض' },
    { id: 'booking', label: 'احجز القاعة', highlight: true },
    { id: 'reviews', label: 'التقييمات' },
    { id: 'contact', label: 'تواصل معنا' },
  ], []);

  return (
    <header className="sticky top-0 z-40 bg-[#0b0d13]/90 backdrop-blur-md border-b border-[#232a3b]">
      {/* Top Banner with Yemeni contact details and Role Switcher */}
      <div className="bg-[#121622] text-xs text-slate-300 py-1.5 px-4 border-b border-[#1c2233]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-amber-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>مفتوحة 24/7 للمناسبات والأفراح</span>
            </span>
            <span className="hidden sm:inline text-slate-400">|</span>
            <a
              href={`tel:${settings?.phonePrimary || '+967777123456'}`}
              className="hidden sm:flex items-center gap-1 hover:text-amber-300 transition-colors"
              dir="ltr"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>{settings?.phonePrimary || '+967 777 123 456'}</span>
            </a>
            <span className="hidden md:inline text-slate-500">·</span>
            <span className="hidden md:inline text-slate-400">
              شارع الحصبة، جوار اللجنة الدائمة، صنعاء
            </span>
          </div>

            {/* Quick Demo Switcher & WhatsApp & Global Toggle */}
            <div className="flex items-center gap-2 sm:gap-3">
              <GlobalToggleBar variant="inline" />

              <a
                href={`https://wa.me/${settings?.whatsappNumber?.replace(/[^0-9]/g, '') || '967777123456'}?text=${encodeURIComponent('السلام عليكم، أود الاستفسار عن حجز قاعة ذو ريدان للأفراح')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>واتساب سريع</span>
              </a>

              {user ? (
                <div className="flex items-center gap-1.5 text-[11px]">
                  {isAdmin ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                      <Shield className="w-3 h-3 text-amber-400" />
                      <span>مدير النظام (ADMIN)</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/40">
                      <UserIcon className="w-3 h-3 text-blue-400" />
                      <span>عميل (CUSTOMER)</span>
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-[11px] text-slate-400 bg-[#1a2030] px-2 py-0.5 rounded border border-slate-700/60">
                  زائر غير مسجل
                </span>
              )}
            </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <div
            onClick={() => setCurrentTab('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#d4af37] via-[#aa820a] to-[#594204] p-0.5 shadow-lg shadow-amber-900/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0b0d13] rounded-[10px] flex items-center justify-center border border-amber-400/30">
                <Sparkles className="w-6 h-6 text-amber-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-white font-serif-ar">
                  قاعة ذو ريدان
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  صنعاء
                </span>
              </div>
              <p className="text-[11px] text-amber-200/60 font-light">
                للأفراح والمناسبات والمؤتمرات
              </p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
            {navLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`px-3 py-2 rounded-lg transition-all ${
                  item.highlight
                    ? currentTab === item.id
                      ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                      : 'bg-amber-500/10 text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-black font-semibold'
                    : currentTab === item.id
                    ? 'text-amber-300 bg-[#161c29]'
                    : 'text-slate-300 hover:text-amber-200 hover:bg-[#121622]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* User Controls & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Bell */}
            {user && (
              <div className="relative">
                <button
                  type="button"
                  onClick={handleToggleNotifications}
                  className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-[#161c29] transition-colors relative cursor-pointer"
                  title="الإشعارات"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notificationsOpen && (
                  <div className="absolute left-0 sm:right-auto sm:left-0 mt-2 w-80 sm:w-96 bg-[#121622] rounded-xl border border-slate-800 shadow-2xl z-50 overflow-hidden">
                    <div className="p-3 bg-[#181f30] border-b border-slate-800 flex items-center justify-between">
                      <span className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-amber-400" />
                        <span>الإشعارات</span>
                      </span>
                      <span className="text-xs text-slate-400">
                        {unreadCount} غير مقروء
                      </span>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400">
                          لا توجد إشعارات حالياً
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-3 cursor-pointer transition-colors hover:bg-[#1a2133] ${
                              !notif.isRead ? 'bg-amber-500/5' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-xs font-semibold text-white">
                                {notif.title}
                              </h4>
                              {!notif.isRead && (
                                <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 mt-1"></span>
                              )}
                            </div>
                            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                              {notif.message}
                            </p>
                            <span className="text-[10px] text-slate-500 mt-1 block">
                              {new Date(notif.createdAt).toLocaleDateString('ar-YE', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Session Action */}
            {user ? (
              <div className="flex items-center gap-2">
                {isAdmin ? (
                  <button
                    onClick={() => setCurrentTab('admin')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      currentTab === 'admin'
                        ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-md shadow-amber-500/20'
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/40 hover:bg-amber-500 hover:text-black'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>لوحة الإدارة</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentTab('account')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      currentTab === 'account'
                        ? 'bg-amber-500 text-black border-amber-400 font-bold'
                        : 'bg-[#181f30] text-slate-200 border-slate-700 hover:border-amber-400/50'
                    }`}
                  >
                    <UserIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>حسابي</span>
                  </button>
                )}

                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-[#181f30]"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentTab('admin-login')}
                  className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all cursor-pointer"
                  title="تسجيل دخول إدارة القاعة"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>دخول الإدارة</span>
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold bg-[#161c29] hover:bg-[#1f2738] text-amber-300 border border-amber-500/30 hover:border-amber-400 transition-all cursor-pointer"
                  title="تسجيل الدخول"
                >
                  <UserIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span>تسجيل الدخول</span>
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal('register')}
                  className="flex items-center gap-1 px-3.5 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                  title="إنشاء حساب جديد"
                >
                  <span>إنشاء حساب</span>
                </button>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-[#161c29]"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-amber-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden relative z-40 bg-[#0d1017] border-b border-slate-800 px-4 pt-3 pb-6 space-y-2 animate-fadeIn">
          {navLinks.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-right px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                currentTab === item.id
                  ? 'bg-amber-500 text-black font-bold'
                  : 'text-slate-300 hover:bg-[#161c29]'
              }`}
            >
              {item.label}
            </button>
          ))}

          <div className="py-2 px-3 rounded-lg bg-[#141a27] border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-300 font-medium">الوضع الليلي والنهاري</span>
            <GlobalToggleBar variant="inline" />
          </div>

          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            {user ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#141a27] text-xs">
                  <div>
                    <p className="font-bold text-white">{user.name}</p>
                    <p className="text-slate-400">{user.email}</p>
                    <span className="text-[10px] text-amber-400 font-mono mt-0.5 block">
                      {isAdmin ? 'مدير النظام (ADMIN)' : 'عميل (CUSTOMER)'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="px-2.5 py-1 text-red-400 bg-red-500/10 rounded hover:bg-red-500/20 cursor-pointer"
                  >
                    خروج
                  </button>
                </div>

                {isAdmin ? (
                  <button
                    onClick={() => {
                      setCurrentTab('admin');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-2.5 rounded-lg text-xs font-bold bg-amber-500 text-black flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Shield className="w-4 h-4" />
                    <span>لوحة تحكم الإدارة</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setCurrentTab('account');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-2.5 rounded-lg text-xs font-semibold bg-[#181f30] text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-amber-400" />
                    <span>حسابي (العميل)</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openAuthModal('login');
                    }}
                    className="py-2.5 rounded-lg text-xs font-bold bg-[#181f30] hover:bg-[#222b42] text-amber-300 border border-amber-500/30 text-center flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>تسجيل الدخول</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openAuthModal('register');
                    }}
                    className="py-2.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <span>إنشاء حساب</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setCurrentTab('admin-login');
                  }}
                  className="w-full py-2.5 rounded-lg text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>دخول الإدارة</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export const Navbar = React.memo(NavbarComponent);
