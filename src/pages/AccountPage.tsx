import React, { useState, useEffect } from 'react';
import {
  User,
  Calendar,
  Bell,
  Lock,
  LogOut,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Sparkles,
  ChevronLeft,
  Printer,
  Star,
  Eye
} from 'lucide-react';
import { Booking, AppNotification } from '../types';
import { getBookings, getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface AccountPageProps {
  onOpenBookingDetails: (booking: Booking) => void;
  onOpenReviewModal: (booking: Booking) => void;
  setCurrentTab: (tab: string) => void;
  openAuthModal: () => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({
  onOpenBookingDetails,
  onOpenReviewModal,
  setCurrentTab,
  openAuthModal,
}) => {
  const { user, logout, updateProfile } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'bookings' | 'profile' | 'notifications'>('bookings');

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit profile form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Change password form
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone);
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const allBookings = await getBookings();
      setBookings(allBookings.filter((b) => b.userId === user.id));
      const notifs = await getNotifications(user.id, user.role === 'ADMIN');
      setNotifications(notifs);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await updateProfile({ name: name.trim(), phone: phone.trim() });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 6) return;
    setPassSuccess(true);
    setCurrentPass('');
    setNewPass('');
    setTimeout(() => setPassSuccess(false), 3000);
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    await markNotificationRead(notif.id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
    );
    if (notif.bookingId) {
      const b = bookings.find((x) => x.id === notif.bookingId);
      if (b) onOpenBookingDetails(b);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllNotificationsRead(user.id, user.role === 'ADMIN');
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white font-serif-ar">يرجى تسجيل الدخول لعرض حسابك</h2>
        <p className="text-xs text-slate-400">
          سجل دخولك لتتمكن من تتبع حجوزاتك، تفاصيل المواعيد، الإشعارات وتعديل بيانات ملفك الشخصي.
        </p>
        <button
          onClick={openAuthModal}
          className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-md transition-colors"
        >
          تسجيل الدخول / إنشاء حساب
        </button>
      </div>
    );
  }

  const statusBadges: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: 'قيد المراجعة', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', icon: Clock },
    confirmed: { label: 'مؤكد ومعتمد', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', icon: CheckCircle2 },
    rejected: { label: 'مرفوض', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30', icon: XCircle },
    cancelled: { label: 'ملغي', color: 'text-slate-400 bg-slate-500/10 border-slate-500/30', icon: AlertTriangle },
    completed: { label: 'مكتمل', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', icon: Sparkles },
  };

  const unreadNotifs = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Account Header */}
      <div className="bg-[#121622] rounded-3xl border border-slate-800 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-right">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-black flex items-center justify-center text-xl font-black shadow-lg">
            {user.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white font-serif-ar">{user.name}</h1>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold">
                {user.role === 'ADMIN' ? 'مدير القاعة' : 'عميل معتمد'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono" dir="ltr">
              {user.email} · {user.phone}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentTab('booking')}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-md transition-colors"
          >
            حجز جديد
          </button>
          <button
            onClick={logout}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>خروج</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex bg-[#121622] p-1.5 rounded-2xl border border-slate-800 text-xs">
        <button
          onClick={() => setActiveSubTab('bookings')}
          className={`flex-1 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'bookings'
              ? 'bg-amber-500 text-black shadow'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>حجوزاتي ({bookings.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('notifications')}
          className={`flex-1 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'notifications'
              ? 'bg-amber-500 text-black shadow'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>الإشعارات {unreadNotifs > 0 && `(${unreadNotifs})`}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('profile')}
          className={`flex-1 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'profile'
              ? 'bg-amber-500 text-black shadow'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          <span>الملف الشخصي والأمان</span>
        </button>
      </div>

      {/* Subtab 1: My Bookings */}
      {activeSubTab === 'bookings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white font-serif-ar">سجل حجوزات القاعة</h3>
            <span className="text-xs text-slate-400">إجمالي {bookings.length} حجز</span>
          </div>

          {bookings.length === 0 ? (
            <div className="bg-[#121622] rounded-3xl border border-slate-800 p-12 text-center space-y-4">
              <Calendar className="w-12 h-12 text-slate-600 mx-auto" />
              <h4 className="text-base font-bold text-white">لا توجد حجوزات مسجلة حتى الآن</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                يمكنك الآن استكشاف المواعيد الشاغرة وتقديم طلب حجز لمناسبتك القادمة في قاعة ذو ريدان.
              </p>
              <button
                onClick={() => setCurrentTab('booking')}
                className="px-6 py-2.5 rounded-xl bg-amber-500 text-black text-xs font-bold hover:bg-amber-400"
              >
                احجز القاعة الآن
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const badge = statusBadges[booking.status] || statusBadges.pending;
                const StatusIcon = badge.icon;

                return (
                  <div
                    key={booking.id}
                    className="p-5 rounded-2xl bg-[#121622] border border-slate-800 hover:border-amber-500/30 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-400">
                          {booking.bookingCode}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white">
                        {booking.packageName || 'حجز قاعة مخصص'}
                      </h4>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1 text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          <span>{booking.eventDate}</span>
                        </span>
                        <span>·</span>
                        <span>{booking.timeSlot === 'morning' ? 'صباحية' : booking.timeSlot === 'evening' ? 'مسائية' : 'يوم كامل'}</span>
                        <span>·</span>
                        <span>{booking.guestCount} ضيف</span>
                        <span>·</span>
                        <span className="font-mono font-bold text-amber-300">
                          {booking.totalPrice?.toLocaleString('ar-YE')} ريال
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
                      {booking.status === 'completed' && (
                        <button
                          onClick={() => onOpenReviewModal(booking)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>تقييم التجربة</span>
                        </button>
                      )}

                      <button
                        onClick={() => onOpenBookingDetails(booking)}
                        className="px-4 py-2 rounded-xl bg-[#182133] hover:bg-[#222d44] text-white text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>تفاصيل وسند الحجز</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Subtab 2: Notifications */}
      {activeSubTab === 'notifications' && (
        <div className="bg-[#121622] rounded-3xl border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white font-serif-ar">مركز الإشعارات</h3>
            {unreadNotifs > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-amber-400 hover:underline"
              >
                تحديد الكل كمقروء
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              لا توجد إشعارات مسجلة.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 cursor-pointer hover:bg-[#182133] transition-colors rounded-xl ${
                    !notif.isRead ? 'bg-amber-500/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      )}
                      <span>{notif.title}</span>
                    </h4>
                    <span className="text-[10px] text-slate-500">
                      {new Date(notif.createdAt).toLocaleDateString('ar-YE', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {notif.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subtab 3: Profile Settings & Security */}
      {activeSubTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Edit Profile */}
          <div className="bg-[#121622] rounded-3xl border border-slate-800 p-6 space-y-4">
            <h3 className="text-base font-bold text-white font-serif-ar pb-2 border-b border-slate-800">
              تعديل بيانات الملف الشخصي
            </h3>

            {saveSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400">
                تم حفظ التعديلات بنجاح!
              </div>
            )}

            <form onSubmit={handleProfileSave} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full bg-[#0a0d14]/50 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-400 cursor-not-allowed"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">رقم الهاتف</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
                  dir="ltr"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-colors"
              >
                حفظ التعديلات
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-[#121622] rounded-3xl border border-slate-800 p-6 space-y-4">
            <h3 className="text-base font-bold text-white font-serif-ar pb-2 border-b border-slate-800">
              تغيير كلمة المرور
            </h3>

            {passSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400">
                تم تحديث كلمة المرور بنجاح!
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">كلمة المرور الحالية</label>
                <input
                  type="password"
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">كلمة المرور الجديدة</label>
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="6 أحرف على الأقل"
                  className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
              >
                تحديث كلمة المرور
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
