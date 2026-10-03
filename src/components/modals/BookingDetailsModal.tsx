import React, { useState } from 'react';
import {
  X,
  Printer,
  Calendar,
  Clock,
  Users,
  MapPin,
  CheckCircle2,
  Clock3,
  XCircle,
  AlertTriangle,
  Sparkles,
  Phone,
  Mail,
  ShieldCheck,
  Star
} from 'lucide-react';
import { Booking, HallSettings } from '../../types';
import { cancelBooking } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface BookingDetailsModalProps {
  booking: Booking | null;
  settings: HallSettings | null;
  onClose: () => void;
  onBookingUpdated?: () => void;
  onOpenReviewModal?: (booking: Booking) => void;
}

export const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({
  booking,
  settings,
  onClose,
  onBookingUpdated,
  onOpenReviewModal,
}) => {
  const { user, isAdmin } = useAuth();
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCancelBooking = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في إلغاء طلب هذا الحجز؟')) return;
    setCancelling(true);
    setError('');
    try {
      await cancelBooking(booking.id, user?.id || booking.userId);
      if (onBookingUpdated) onBookingUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'فشل إلغاء الحجز');
    } finally {
      setCancelling(false);
    }
  };

  const statusConfig = {
    pending: { label: 'قيد المراجعة والاعتماد', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', icon: Clock3 },
    confirmed: { label: 'حجز مؤكد ومعتمد', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', icon: CheckCircle2 },
    rejected: { label: 'طلب حجز مرفوض', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30', icon: XCircle },
    cancelled: { label: 'حجز ملغي', color: 'text-slate-400 bg-slate-500/10 border-slate-500/30', icon: AlertTriangle },
    completed: { label: 'مناسبة مكتملة بنجاح', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', icon: Sparkles },
  }[booking.status];

  const StatusIcon = statusConfig.icon;

  const eventTypeLabels: Record<string, string> = {
    wedding: 'حفل زفاف وأفراح',
    graduation: 'حفل تخرج وتكريم',
    conference: 'مؤتمر / ندوة علمية',
    family: 'مناسبة عائلية / خطوبة',
    condolence: 'مجلس عزاء واستقبال',
    party: 'حفلة خاصة',
    other: 'مناسبة أخرى',
  };

  const timeSlotLabels: Record<string, string> = {
    morning: 'الفترة الصباحية (09:00 ص - 02:00 م)',
    evening: 'الفترة المسائية (04:00 م - 10:30 م)',
    full_day: 'يوم كامل متواصل (09:00 ص - 11:00 م)',
  };

  const sectionLabels: Record<string, string> = {
    men: 'قسم الرجال فقط',
    women: 'قسم النساء فقط',
    both: 'القاعة كاملة (قسم الرجال + قسم النساء)',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#121622] rounded-2xl border border-amber-500/30 shadow-2xl p-6 sm:p-8 my-8 text-right overflow-hidden">
        {/* Printable Header - Visible during Print */}
        <div className="border-b border-slate-700/80 pb-4 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-serif-ar">
                {settings?.hallName || 'قاعة ذو ريدان للأفراح والمناسبات'}
              </h3>
              <p className="text-xs text-slate-400">
                سند حجز إلكتروني رسمي ومفصل
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 no-print">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a2233] hover:bg-[#253047] text-amber-300 text-xs font-semibold border border-amber-500/30 transition-colors"
              title="طباعة سند الحجز"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة السند</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Voucher Status & Code Card */}
        <div className="bg-[#0b0e16] p-4 rounded-xl border border-slate-800 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[11px] text-slate-400 block mb-0.5">رقم السند المرجعي:</span>
            <span className="text-base sm:text-lg font-mono font-bold text-amber-400 tracking-wider">
              {booking.bookingCode}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusConfig.color}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              <span>{statusConfig.label}</span>
            </span>
          </div>
        </div>

        {/* Core Event Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-6">
          <div className="p-3.5 bg-[#161c2b] rounded-xl border border-slate-800/80 space-y-2">
            <h4 className="font-bold text-white border-b border-slate-700/60 pb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>تفاصيل الموعد والمناسبة</span>
            </h4>
            <div className="space-y-1.5 text-slate-300">
              <p><span className="text-slate-400">نوع المناسبة:</span> <span className="font-semibold text-white">{eventTypeLabels[booking.eventType] || booking.eventType}</span></p>
              <p><span className="text-slate-400">تاريخ المناسبة:</span> <span className="font-semibold text-white font-mono">{booking.eventDate}</span></p>
              <p><span className="text-slate-400">فترة الحجز:</span> <span className="text-amber-300">{timeSlotLabels[booking.timeSlot]}</span></p>
              <p><span className="text-slate-400">قسم القاعة:</span> <span className="text-white">{sectionLabels[booking.hallSection]}</span></p>
              <p><span className="text-slate-400">العدد المتوقع:</span> <span className="text-white">{booking.guestCount} ضيف</span></p>
            </div>
          </div>

          <div className="p-3.5 bg-[#161c2b] rounded-xl border border-slate-800/80 space-y-2">
            <h4 className="font-bold text-white border-b border-slate-700/60 pb-1.5 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-amber-400" />
              <span>بيانات صاحب الحجز</span>
            </h4>
            <div className="space-y-1.5 text-slate-300">
              <p><span className="text-slate-400">الاسم:</span> <span className="font-semibold text-white">{booking.customerName}</span></p>
              <p><span className="text-slate-400">الهاتف:</span> <span className="font-mono text-white" dir="ltr">{booking.customerPhone}</span></p>
              <p><span className="text-slate-400">البريد:</span> <span className="font-mono text-white" dir="ltr">{booking.customerEmail}</span></p>
              <p><span className="text-slate-400">تاريخ الطلب:</span> <span className="font-mono text-slate-400">{new Date(booking.createdAt).toLocaleDateString('ar-YE')}</span></p>
            </div>
          </div>
        </div>

        {/* Selected Package & Services */}
        <div className="bg-[#161c2b] rounded-xl border border-slate-800/80 p-4 mb-6 text-xs">
          <h4 className="font-bold text-white border-b border-slate-700/60 pb-2 mb-3 flex items-center justify-between">
            <span>الباقة والخدمات المشمولة</span>
            <span className="text-amber-400 font-semibold">{booking.packageName || 'حجز مخصص'}</span>
          </h4>

          <div className="space-y-2">
            <div className="flex justify-between items-center py-1 border-b border-slate-800 text-slate-300">
              <span>سعر الباقة الأساسية ({booking.packageName || 'القاعة'}):</span>
              <span className="font-mono font-bold text-white">
                {booking.packagePrice?.toLocaleString('ar-YE')} ريال يمني
              </span>
            </div>

            {booking.addons && booking.addons.length > 0 && (
              <div className="pt-2">
                <span className="text-slate-400 font-medium block mb-1.5">الخدمات والتجهيزات الإضافية المختارة:</span>
                <div className="space-y-1 pr-2">
                  {booking.addons.map((add, idx) => (
                    <div key={idx} className="flex justify-between items-center text-slate-300 text-[11px]">
                      <span>+ {add.serviceName}</span>
                      <span className="font-mono text-slate-200">
                        {add.price?.toLocaleString('ar-YE')} ريال
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total */}
            <div className="mt-3 pt-3 border-t border-slate-700 flex justify-between items-center text-sm font-bold text-white">
              <span className="text-amber-300">إجمالي تكلفة الحجز:</span>
              <span className="text-lg font-mono text-amber-400 font-black">
                {booking.totalPrice?.toLocaleString('ar-YE')} ريال يمني
              </span>
            </div>
          </div>
        </div>

        {/* Notes / Admin Remarks */}
        {(booking.notes || booking.adminNotes || booking.rejectionReason) && (
          <div className="bg-[#0b0e16] p-3.5 rounded-xl border border-slate-800 mb-6 text-xs space-y-2">
            {booking.notes && (
              <p className="text-slate-300">
                <strong className="text-slate-400 ml-1">ملاحظات العميل:</strong>
                {booking.notes}
              </p>
            )}
            {booking.adminNotes && (
              <p className="text-amber-200">
                <strong className="text-amber-400 ml-1">ملاحظات الإدارة:</strong>
                {booking.adminNotes}
              </p>
            )}
            {booking.rejectionReason && (
              <p className="text-rose-300">
                <strong className="text-rose-400 ml-1">سبب تعذر الحجز:</strong>
                {booking.rejectionReason}
              </p>
            )}
          </div>
        )}

        {/* Location & Terms notice */}
        <div className="p-3 bg-[#111624] rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <p className="flex items-center gap-1.5 text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>{settings?.address || 'شارع الحصبة، جوار اللجنة الدائمة للمؤتمر الشعبي العام، صنعاء، اليمن'}</span>
          </p>
          <p>
            * يعتبر هذا السند إشعار حجز إلكتروني. لتثبيت الموعد النهائي ودفع العربون، يرجى مراجعة إدارة القاعة أو التواصل على {settings?.phonePrimary || '+967 777 123 456'}.
          </p>
        </div>

        {/* Actions for customer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 no-print">
          <div>
            {booking.status === 'completed' && onOpenReviewModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenReviewModal(booking);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-colors"
              >
                <Star className="w-4 h-4 fill-black" />
                <span>تقييم تجربة القاعة</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {(booking.status === 'pending' || (isAdmin && booking.status === 'confirmed')) && (
              <button
                onClick={handleCancelBooking}
                disabled={cancelling}
                className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30 transition-colors disabled:opacity-50"
              >
                {cancelling ? 'جاري الإلغاء...' : 'إلغاء هذا الحجز'}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
