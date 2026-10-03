import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Crown,
  Layers,
  Phone,
  Mail,
  User,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Booking,
  EventType,
  HallPackage,
  HallService,
  HallSettings,
  TimeSlot
} from '../types';
import { checkBookingConflict, createBooking, getBookings } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface BookingPageProps {
  packages: HallPackage[];
  services: HallService[];
  settings: HallSettings | null;
  preselectedPackage?: HallPackage | null;
  setCurrentTab: (tab: string) => void;
  openAuthModal: () => void;
  onBookingCreated?: (booking: Booking) => void;
}

export const BookingPage: React.FC<BookingPageProps> = ({
  packages,
  services,
  settings,
  preselectedPackage,
  setCurrentTab,
  openAuthModal,
  onBookingCreated,
}) => {
  const { user } = useAuth();

  // Wizard Steps: 1: Event & Date, 2: Package & Services, 3: Contact & Review, 4: Success
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [eventType, setEventType] = useState<EventType>('wedding');
  
  // Set default event date to 14 days in future
  const defaultFutureDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  };

  const [eventDate, setEventDate] = useState<string>(defaultFutureDate());
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('evening');
  const [hallSection, setHallSection] = useState<'men' | 'women' | 'both'>('both');
  const [guestCount, setGuestCount] = useState<number>(500);

  // Selected Package
  const [selectedPkgId, setSelectedPkgId] = useState<string>(
    preselectedPackage ? preselectedPackage.id : (packages[1]?.id || packages[0]?.id || '')
  );

  // Selected Add-ons
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Contact Info
  const [contactName, setContactName] = useState(user?.name || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [contactEmail, setContactEmail] = useState(user?.email || '');

  // Conflict Checking State
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);
  const [conflictResult, setConflictResult] = useState<{ hasConflict: boolean; message?: string }>({ hasConflict: false });
  const [allConfirmedBookings, setAllConfirmedBookings] = useState<Booking[]>([]);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [submitError, setSubmitError] = useState('');

  // Update contact fields if user logs in
  useEffect(() => {
    if (user) {
      if (!contactName) setContactName(user.name);
      if (!contactPhone) setContactPhone(user.phone);
      if (!contactEmail) setContactEmail(user.email);
    }
  }, [user]);

  // If preselected package changes
  useEffect(() => {
    if (preselectedPackage) {
      setSelectedPkgId(preselectedPackage.id);
    }
  }, [preselectedPackage]);

  // Load existing bookings for calendar visibility
  useEffect(() => {
    getBookings().then((list) => {
      setAllConfirmedBookings(list.filter((b) => b.status === 'confirmed'));
    });
  }, []);

  // Run conflict check whenever date, timeSlot or section changes
  useEffect(() => {
    if (!eventDate) return;
    setIsCheckingConflict(true);
    checkBookingConflict(eventDate, timeSlot, hallSection)
      .then((res) => {
        setConflictResult(res);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setIsCheckingConflict(false);
      });
  }, [eventDate, timeSlot, hallSection]);

  const selectedPkg = packages.find((p) => p.id === selectedPkgId);
  const pkgPrice = selectedPkg?.price || 0;

  const chosenAddonsList = services.filter((s) => selectedAddons.includes(s.id));
  const addonsTotal = chosenAddonsList.reduce((sum, s) => sum + (s.price || 0), 0);
  const grandTotal = pkgPrice + addonsTotal;

  const toggleAddon = (serviceId: string) => {
    setSelectedAddons((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleNextStep = () => {
    setSubmitError('');
    if (currentStep === 1) {
      if (conflictResult.hasConflict) {
        setSubmitError('لا يمكنك المتابعة لأن الموعد المختار محجوز مسبقاً. يرجى اختيار تاريخ أو فترة أخرى.');
        return;
      }
      if (!eventDate) {
        setSubmitError('يرجى اختيار تاريخ المناسبة');
        return;
      }
      setCurrentStep(2);
      window.scrollTo({ top: 100, behavior: 'smooth' });
    } else if (currentStep === 2) {
      if (!selectedPkgId) {
        setSubmitError('يرجى اختيار إحدى الباقات للمتابعة');
        return;
      }
      setCurrentStep(3);
      window.scrollTo({ top: 100, behavior: 'smooth' });
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!user) {
      openAuthModal();
      return;
    }

    if (!contactName.trim() || !contactPhone.trim()) {
      setSubmitError('يرجى إكمال بيانات الاسم ورقم الهاتف للتواصل');
      return;
    }

    setIsSubmitting(true);

    try {
      const newBkg = await createBooking({
        userId: user.id,
        customerName: contactName.trim(),
        customerEmail: contactEmail.trim() || user.email,
        customerPhone: contactPhone.trim(),
        eventType,
        eventDate,
        timeSlot,
        guestCount,
        hallSection,
        packageId: selectedPkg?.id,
        packageName: selectedPkg?.name,
        packagePrice: pkgPrice,
        addons: chosenAddonsList.map((a) => ({
          serviceId: a.id,
          serviceName: a.name,
          price: a.price,
        })),
        totalPrice: grandTotal,
        notes: notes.trim(),
      });

      setCreatedBooking(newBkg);
      setCurrentStep(4);
      if (onBookingCreated) onBookingCreated(newBkg);

      // Trigger Confetti Celebration!
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    } catch (err: any) {
      setSubmitError(err.message || 'حدث خطأ أثناء إرسال طلب الحجز');
    } finally {
      setIsSubmitting(false);
    }
  };

  const eventTypeLabels: Record<EventType, string> = {
    wedding: 'حفل زواج وأفراح',
    graduation: 'حفل تخرج أكاديمي',
    conference: 'مؤتمر / ندوة رسمية',
    family: 'مناسبة عائلية / خطوبة',
    condolence: 'مجلس عزاء واستقبال',
    party: 'حفلة خاصة',
    other: 'مناسبة أخرى',
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>نظام الحجز الإلكتروني المباشر</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white font-serif-ar">
          حجز قاعة ذو ريدان للأفراح والمناسبات
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 font-light">
          خطوات بسيطة ومرنة لحجز القاعة والتحقق الفوري من توفر المواعيد بدون تضارب
        </p>
      </div>

      {/* Steps Progress Indicator */}
      <div className="bg-[#121622] p-4 rounded-2xl border border-slate-800">
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          {[
            { step: 1, title: '1. الموعد والنوع' },
            { step: 2, title: '2. الباقة والتجهيزات' },
            { step: 3, title: '3. التأكيد والتواصل' },
            { step: 4, title: '4. اكتمال الطلب' },
          ].map((s) => (
            <div
              key={s.step}
              className={`py-2 px-1 rounded-xl transition-colors font-bold ${
                currentStep === s.step
                  ? 'bg-amber-500 text-black shadow-md'
                  : currentStep > s.step
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-[#0a0d14] text-slate-500'
              }`}
            >
              <span>{s.title}</span>
            </div>
          ))}
        </div>
      </div>

      {submitError && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          <span>{submitError}</span>
        </div>
      )}

      {/* STEP 1: Event Type, Date & Time Slots */}
      {currentStep === 1 && (
        <div className="bg-[#121622] rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-8 animate-fadeIn">
          
          {/* 1. Event Type Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center text-xs font-black">1</span>
              <span>اختر نوع المناسبة</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(Object.keys(eventTypeLabels) as EventType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setEventType(type)}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-right ${
                    eventType === type
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md shadow-amber-950/30'
                      : 'bg-[#0a0d14] border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {eventTypeLabels[type]}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Date Selection & Conflict Warning */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center text-xs font-black">2</span>
              <span>تاريخ المناسبة (تحقق فوري من عدم التضارب)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  اختر تاريخ المناسبة
                </label>
                <input
                  type="date"
                  value={eventDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
                  required
                />
              </div>

              {/* Real-time Conflict Alert Status */}
              <div className="flex items-center">
                {isCheckingConflict ? (
                  <div className="p-3 bg-slate-800/50 rounded-xl text-xs text-slate-400 flex items-center gap-2 w-full">
                    <span className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></span>
                    <span>جاري التحقق من الموعد...</span>
                  </div>
                ) : conflictResult.hasConflict ? (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-start gap-2 w-full">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-red-400">تنبيه تعارض في الموعد!</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed">
                        {conflictResult.message}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2 w-full">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-bold text-emerald-400">الموعد متاح للحجز!</p>
                      <p className="text-[11px] text-slate-300">
                        التاريخ المختار شاغر في هذه الفترة ومتاح لتأكيد حجزك.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. Time Slot / Period */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center text-xs font-black">3</span>
              <span>فترة الحجز والوقت</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'morning' as TimeSlot,
                  title: 'الفترة الصباحية',
                  time: '09:00 ص - 02:00 م',
                  desc: 'مناسبة لحفلات التخرج، المؤتمرات، وندوات الصباح.',
                },
                {
                  id: 'evening' as TimeSlot,
                  title: 'الفترة المسائية (الأكثر طلباً)',
                  time: '04:00 م - 10:30 م',
                  desc: 'المثالية لحفلات الزفاف والأعراس والاحتفالات الكبرى.',
                },
                {
                  id: 'full_day' as TimeSlot,
                  title: 'يوم كامل متواصل',
                  time: '09:00 ص - 11:00 م',
                  desc: 'حجز القاعة طوال اليوم لكامل الفعاليات المتواصلة.',
                },
              ].map((slot) => (
                <div
                  key={slot.id}
                  onClick={() => setTimeSlot(slot.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    timeSlot === slot.id
                      ? 'bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-950/30'
                      : 'bg-[#0a0d14] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{slot.title}</span>
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-xs font-mono text-amber-400 block mb-2">{slot.time}</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{slot.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Section & Guest Count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
            <div>
              <label className="block text-xs font-bold text-white mb-2">
                قسم القاعة المطلوب:
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { id: 'both', label: 'القاعة كاملة (رجال + نساء)' },
                  { id: 'men', label: 'قسم الرجال فقط' },
                  { id: 'women', label: 'قسم النساء فقط' },
                ].map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setHallSection(sec.id as any)}
                    className={`p-2.5 rounded-xl border text-[11px] font-bold transition-colors ${
                      hallSection === sec.id
                        ? 'bg-amber-500 text-black border-amber-400'
                        : 'bg-[#0a0d14] text-slate-300 border-slate-800 hover:text-white'
                    }`}
                  >
                    {sec.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white mb-2">
                العدد التقديري للضيوف ({guestCount} ضيف):
              </label>
              <input
                type="range"
                min="100"
                max="1500"
                step="50"
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-mono">
                <span>100 ضيف</span>
                <span className="text-amber-400 font-bold">{guestCount} ضيف</span>
                <span>1,500 ضيف</span>
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={handleNextStep}
              disabled={conflictResult.hasConflict}
              className="px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>متابعة لاختيار الباقة والتجهيزات</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* STEP 2: Package Selection & Add-ons */}
      {currentStep === 2 && (
        <div className="bg-[#121622] rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-8 animate-fadeIn">
          
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-amber-400" />
              <span>اختر باقة المناسبة الأساسية</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPkgId(pkg.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    selectedPkgId === pkg.id
                      ? 'bg-amber-500/15 border-amber-400 shadow-xl shadow-amber-950/40 relative scale-102'
                      : 'bg-[#0a0d14] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {pkg.badge && (
                    <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black">
                      {pkg.badge}
                    </span>
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-white font-serif-ar">{pkg.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{pkg.description}</p>
                    
                    <div className="my-3 text-base font-black text-amber-400 font-mono">
                      {pkg.price.toLocaleString('ar-YE')} <span className="text-xs text-slate-300 font-sans">ريال</span>
                    </div>

                    <ul className="space-y-1 text-[11px] text-slate-300">
                      {pkg.features.slice(0, 3).map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 text-center">
                    <span
                      className={`text-xs font-bold ${
                        selectedPkgId === pkg.id ? 'text-amber-400' : 'text-slate-500'
                      }`}
                    >
                      {selectedPkgId === pkg.id ? '✓ الباقة المختارة' : 'تحديد هذه الباقة'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add-on Services Checklist */}
          <div className="pt-6 border-t border-slate-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <span>الخدمات والتجهيزات الإضافية (اختياري)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                حدد أي خدمات إضافية ترغب بإضافتها لحجزك، وسيتم احتساب التكلفة تلقائياً
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {services.map((srv) => {
                const isSelected = selectedAddons.includes(srv.id);
                return (
                  <div
                    key={srv.id}
                    onClick={() => toggleAddon(srv.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/50'
                        : 'bg-[#0a0d14] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="mt-1 accent-amber-500 rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{srv.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{srv.description}</p>
                      <span className="text-xs font-mono font-bold text-amber-400 mt-1 block">
                        +{srv.price ? srv.price.toLocaleString('ar-YE') : 0} ريال
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Special Notes */}
          <div className="pt-4 border-t border-slate-800">
            <label className="block text-xs font-bold text-white mb-1.5">
              ملاحظات أو طلبات خاصة للمناسبة
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="مثال: نرغب بدخول العريس في تمام الساعة 5:30 مساءً، ترتيب خاص بالضيافة..."
              className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Running Total & Actions */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="text-right">
              <span className="text-xs text-slate-400 block">إجمالي التكلفة التقديرية:</span>
              <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                {grandTotal.toLocaleString('ar-YE')} <span className="text-xs text-slate-300 font-sans">ريال يمني</span>
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                العودة للخطوة السابقة
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <span>متابعة لتأكيد بيانات الحجز</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* STEP 3: Review & Customer Contact */}
      {currentStep === 3 && (
        <form onSubmit={handleFormSubmit} className="bg-[#121622] rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-8 animate-fadeIn">
          
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>مراجعة تفاصيل طلب الحجز</span>
            </h3>
            <p className="text-xs text-slate-400">
              يرجى مراجعة التفاصيل أدناه والتأكد من صحة بيانات التواصل ليتمكن كادر القاعة من الاتصال بك
            </p>
          </div>

          {/* Itemized Summary Card */}
          <div className="bg-[#0a0d14] rounded-2xl border border-slate-800 p-5 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-800">
              <div className="space-y-1 text-slate-300">
                <p><span className="text-slate-400">نوع المناسبة:</span> <span className="font-bold text-white">{eventTypeLabels[eventType]}</span></p>
                <p><span className="text-slate-400">تاريخ الحجز:</span> <span className="font-mono text-amber-400 font-bold">{eventDate}</span></p>
                <p><span className="text-slate-400">فترة الحجز:</span> <span className="text-white">{timeSlot === 'morning' ? 'صباحية' : timeSlot === 'evening' ? 'مسائية' : 'يوم كامل'}</span></p>
              </div>

              <div className="space-y-1 text-slate-300">
                <p><span className="text-slate-400">قسم القاعة:</span> <span className="text-white">{hallSection === 'both' ? 'كاملة (رجال + نساء)' : hallSection === 'men' ? 'قسم الرجال' : 'قسم النساء'}</span></p>
                <p><span className="text-slate-400">العدد المتوقع:</span> <span className="text-white">{guestCount} ضيف</span></p>
                <p><span className="text-slate-400">الباقة المختارة:</span> <span className="font-bold text-amber-300">{selectedPkg?.name}</span></p>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-slate-300">
                <span>سعر الباقة ({selectedPkg?.name}):</span>
                <span className="font-mono font-bold text-white">{pkgPrice.toLocaleString('ar-YE')} ريال</span>
              </div>

              {chosenAddonsList.map((a) => (
                <div key={a.id} className="flex justify-between items-center text-slate-400 text-[11px]">
                  <span>+ {a.name}</span>
                  <span className="font-mono">{a.price?.toLocaleString('ar-YE')} ريال</span>
                </div>
              ))}

              <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-sm font-bold text-white">
                <span className="text-amber-300">الإجمالي الكلي للحجز:</span>
                <span className="text-xl font-mono text-amber-400 font-black">
                  {grandTotal.toLocaleString('ar-YE')} ريال يمني
                </span>
              </div>
            </div>
          </div>

          {/* Contact Information Fields */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white">بيانات التواصل لتأكيد الحجز</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  الاسم الكامل
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="اسم صاحب الحجز"
                    className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl py-2 px-3 pl-8 text-xs text-white focus:outline-none focus:border-amber-400"
                    required
                  />
                  <User className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  رقم الهاتف (اليمن)
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+967 77..."
                    className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl py-2 px-3 pl-8 text-xs text-white focus:outline-none focus:border-amber-400"
                    dir="ltr"
                    required
                  />
                  <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl py-2 px-3 pl-8 text-xs text-white focus:outline-none focus:border-amber-400"
                    dir="ltr"
                  />
                  <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>

            {!user && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center justify-between">
                <span>يُفضل تسجيل الدخول لتتمكن من متابعة وإدارة حجزك لاحقاً</span>
                <button
                  type="button"
                  onClick={openAuthModal}
                  className="px-3 py-1 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400"
                >
                  دخول سريع
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-800 flex justify-between items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              العودة لتعديل الباقة
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs sm:text-sm shadow-xl shadow-amber-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'جاري إرسال طلب الحجز...' : 'تأكيد وإرسال طلب الحجز الآن'}</span>
            </button>
          </div>

        </form>
      )}

      {/* STEP 4: Success & Confirmation */}
      {currentStep === 4 && createdBooking && (
        <div className="bg-[#121622] rounded-3xl border border-emerald-500/30 p-6 sm:p-10 text-center space-y-6 animate-scaleUp">
          
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
              تم استلام طلبكم بنجاح
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-serif-ar">
              تهانينا! تم تسجيل طلب الحجز بقاعة ذو ريدان
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
              تم تسجيل حجزك برقم مرجعي، وحالته الحالية <strong>قيد المراجعة (Pending)</strong>. ستقوم إدارة القاعة بالتواصل معكم لتثبيت الموعد واستكمال الإجراءات.
            </p>
          </div>

          {/* Booking Code Card */}
          <div className="p-4 bg-[#0a0d14] rounded-2xl border border-slate-800 max-w-md mx-auto">
            <span className="text-xs text-slate-400 block mb-1">الرقم المرجعي للحجز:</span>
            <span className="text-2xl font-mono font-black text-amber-400 tracking-wider">
              {createdBooking.bookingCode}
            </span>
            <p className="text-[11px] text-slate-400 mt-2">
              تاريخ المناسبة: <strong className="text-white">{createdBooking.eventDate}</strong> | الفترة: <strong className="text-white">{createdBooking.timeSlot}</strong>
            </p>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setCurrentTab('account')}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md transition-colors"
            >
              عرض حجزك وسند الطباعة في حسابي
            </button>
            <button
              onClick={() => {
                setCurrentStep(1);
                setCreatedBooking(null);
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
            >
              حجز موعد آخر
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
