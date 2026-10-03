import React, { useState } from 'react';
import {
  Calendar,
  Sparkles,
  Star,
  MapPin,
  Clock,
  Users,
  ShieldCheck,
  ChevronLeft,
  Phone,
  MessageCircle,
  ExternalLink,
  Volume2,
  Tv,
  Flame,
  Award,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { HallSettings, HallPackage, HallService, GalleryItem, Review } from '../types';

interface HomePageProps {
  settings: HallSettings | null;
  packages: HallPackage[];
  services: HallService[];
  gallery: GalleryItem[];
  reviews: Review[];
  setCurrentTab: (tab: string) => void;
  onSelectPackageForBooking: (pkg: HallPackage) => void;
  onOpenLightbox: (item: GalleryItem) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  settings,
  packages,
  services,
  gallery,
  reviews,
  setCurrentTab,
  onSelectPackageForBooking,
  onOpenLightbox,
}) => {
  const [selectedEventType, setSelectedEventType] = useState('all');

  const eventTypes = [
    { id: 'wedding', title: 'الأعراس وحفلات الزفاف', icon: '💍', desc: 'أجواء أسطورية بزفات ملكية وكوشة بتصاميم عصرية فخمة.' },
    { id: 'graduation', title: 'حفلات التخرج الأكاديمية', icon: '🎓', desc: 'مدرج تكريم للطلاب الخريجين ومنصات لكبار الضيوف والعمداء.' },
    { id: 'conference', title: 'المؤتمرات وورش العمل', icon: '🏛️', desc: 'شاشات LED بدقة 4K وأنظمة صوت وترجمة وتغطية بث مباشر.' },
    { id: 'family', title: 'المناسبات العائلية والخطوبة', icon: '🎉', desc: 'جلسات راقية وضيافة يمنية وعربية تسعد ضيوفكم.' },
    { id: 'condolence', title: 'مراسيم العزاء والاستقبال', icon: '🕊️', desc: 'سعة رحبة واستيعاب للأعداد الغفيرة مع هدوء وتنظيم كامل.' },
  ];

  return (
    <div className="space-y-20 pb-16">
      
      {/* 1. Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with Dark Vignette */}
        <div className="absolute inset-0 z-0">
          <img
            src={settings?.heroImageUrl || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1920&q=80'}
            alt="قاعة ذو ريدان للأفراح والمناسبات بصنعاء"
            className="w-full h-full object-cover object-center scale-105 transform motion-safe:animate-pulse/20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d13] via-[#0b0d13]/80 to-[#0b0d13]/50"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-[#0b0d13]"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center pt-16">
          
          {/* Notice pill */}
          {settings?.heroNotice && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs mb-6 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{settings.heroNotice}</span>
            </div>
          )}

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white font-serif-ar tracking-tight leading-tight mb-4 drop-shadow-md">
            {settings?.heroHeadline || 'قاعة ذو ريدان للأفراح والمناسبات'}
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-200 max-w-3xl mx-auto font-light leading-relaxed mb-8 drop-shadow">
            {settings?.heroSubheadline || 'صرح المناسبات الأرقى في صنعاء – سعة رحبة، أحدث تقنيات الإضاءة والصوت، وكوشات ملكية تجعل من مناسبتك ذكرى لا تُنسى.'}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => setCurrentTab('booking')}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-sm sm:text-base shadow-xl shadow-amber-600/30 transition-all hover:scale-105 flex items-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              <span>احجز القاعة الآن</span>
            </button>

            <button
              onClick={() => setCurrentTab('packages')}
              className="px-6 py-3.5 rounded-xl bg-[#141a27]/80 hover:bg-[#1f283d] text-amber-300 border border-amber-500/40 text-sm sm:text-base font-bold transition-all backdrop-blur-md flex items-center gap-2"
            >
              <span>استكشف الباقات والأسعار</span>
            </button>

            <button
              onClick={() => setCurrentTab('gallery')}
              className="px-6 py-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-white border border-slate-700 text-sm sm:text-base font-semibold transition-all backdrop-blur-md"
            >
              شاهد المعرض
            </button>
          </div>

          {/* Social Proof Stats Bar */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto">
            <div className="p-3.5 rounded-2xl bg-[#121622]/80 backdrop-blur-md border border-slate-800/80 text-center">
              <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
                <Star className="w-4 h-4 fill-amber-400" />
                <span className="text-lg font-bold text-white">4.4</span>
              </div>
              <p className="text-[11px] text-slate-400">
                1,182 تقييم Google Maps
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#121622]/80 backdrop-blur-md border border-slate-800/80 text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-400 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-lg font-bold text-white">24/7</span>
              </div>
              <p className="text-[11px] text-slate-400">
                مفتوحة على مدار الساعة
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#121622]/80 backdrop-blur-md border border-slate-800/80 text-center">
              <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-lg font-bold text-white">1,500+</span>
              </div>
              <p className="text-[11px] text-slate-400">
                سعة استيعاب كبرى للضيوف
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#121622]/80 backdrop-blur-md border border-slate-800/80 text-center">
              <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-lg font-bold text-white">صنعاء</span>
              </div>
              <p className="text-[11px] text-slate-400">
                شارع الحصبة الحيوي
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. About Hall Highlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-[#121622] via-[#0f121b] to-[#121622] rounded-3xl border border-amber-500/20 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-400">
                <Sparkles className="w-4 h-4" />
                <span>عراقة المكان وفخامة الاستقبال</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-bold text-white font-serif-ar leading-snug">
                قاعة ذو ريدان.. عنوان الفخامة والتميز لمناسباتكم في العاصمة صنعاء
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed">
                تعد قاعة ذو ريدان من أبرز وأرقى قاعات الأفراح والمؤتمرات في صنعاء. تم تصميمها بمواصفات هندسية فريدة لتمنح الحضور أقصى درجات الراحة مع أسقف عالية وديكورات ملوكية وإضاءة ثريات كريستال ساحرة.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>تكييف مركزي متواصل بمولدات احتياطية</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>أحدث أنظمة الصوت الرقمية والمكسر المباشر</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>شاشات LED عملاقة 4K لنقل الحفل</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>مواقف سيارات واسعة ومحروسة ومجانية</span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-4">
                <button
                  onClick={() => setCurrentTab('about')}
                  className="px-5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-colors flex items-center gap-2"
                >
                  <span>تعرف على مرافق وتجهيزات القاعة</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Visual Collage */}
            <div className="relative">
              <div className="rounded-2xl overflow-hidden border border-amber-500/30 shadow-2xl aspect-4/3 relative">
                <img
                  src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80"
                  alt="كوشة العروس بقاعة ذو ريدان"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 right-4 left-4 p-3 bg-black/75 backdrop-blur-md rounded-xl border border-amber-500/30 text-white text-xs">
                  <p className="font-bold text-amber-300">أجنحة وكوشات ملكية مصممة خصيصاً</p>
                  <p className="text-[11px] text-slate-300">مع ممرات شرف مضيئة ومؤثرات ضوئية سينمائية</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Events Hosted Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-xs font-bold text-amber-400 tracking-wider">
            خدمات متكاملة لكل مناسبة
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-serif-ar mt-1">
            المناسبات التي تستضيفها قاعة ذو ريدان
          </h2>
          <p className="text-xs text-slate-400 mt-2 max-w-xl mx-auto">
            تجهيزات مرنة ومدروسة تناسب كافة الفعاليات العائلية والوطنية والرسمية
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {eventTypes.map((ev) => (
            <div
              key={ev.id}
              className="p-6 rounded-2xl bg-[#121622] border border-slate-800/80 hover:border-amber-500/40 transition-all hover:-translate-y-1 shadow-lg group"
            >
              <div className="text-3xl mb-3">{ev.icon}</div>
              <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                {ev.title}
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {ev.desc}
              </p>
              <button
                onClick={() => setCurrentTab('booking')}
                className="mt-4 text-xs font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform"
              >
                <span>احجز موعد لهذه المناسبة</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Packages Spotlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-bold text-amber-400 tracking-wider">
              باقات حصرية متكاملة
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-serif-ar mt-1">
              باقات قاعة ذو ريدان للأفراح والمناسبات
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              اختر الباقة الأنسب لمناسبتك مع إمكانية إضافة خدمات وتجهيزات مخصصة
            </p>
          </div>

          <button
            onClick={() => setCurrentTab('packages')}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 self-start sm:self-auto"
          >
            <span>عرض تفاصيل ومقارنة جميع الباقات</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages.slice(0, 3).map((pkg) => (
            <div
              key={pkg.id}
              className={`rounded-2xl p-6 bg-[#121622] border transition-all flex flex-col justify-between ${
                pkg.isPopular
                  ? 'border-amber-500 shadow-xl shadow-amber-950/30 relative'
                  : 'border-slate-800 hover:border-amber-500/40'
              }`}
            >
              {pkg.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-black text-[11px] font-black shadow-md">
                  {pkg.badge}
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-white font-serif-ar">{pkg.name}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{pkg.description}</p>

                <div className="my-5 p-3.5 rounded-xl bg-[#0a0d14] border border-slate-800 text-center">
                  <div className="text-2xl font-bold text-amber-400 font-mono">
                    {pkg.price.toLocaleString('ar-YE')} <span className="text-xs text-slate-300">ريال يمني</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    (ما يعادل حوالي ${pkg.priceUsd} دولار أمريكي)
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <p className="text-xs font-semibold text-slate-300">{pkg.guestCapacityText}</p>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {pkg.features.slice(0, 5).map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <button
                onClick={() => onSelectPackageForBooking(pkg)}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 ${
                  pkg.isPopular
                    ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
                    : 'bg-[#182133] hover:bg-amber-500 hover:text-black text-amber-300 border border-amber-500/30'
                }`}
              >
                <span>حجز هذه الباقة</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Services Highlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-bold text-amber-400 tracking-wider">
              أحدث التقنيات والضيافة
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-serif-ar mt-1">
              خدمات وتجهيزات قاعة ذو ريدان
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              نوفر لك كل متطلبات المناسبة تحت سقف واحد بكفاءة عالية
            </p>
          </div>

          <button
            onClick={() => setCurrentTab('services')}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 self-start sm:self-auto"
          >
            <span>تصفح جميع الخدمات والأسعار</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.slice(0, 4).map((srv) => (
            <div
              key={srv.id}
              className="rounded-2xl bg-[#121622] border border-slate-800 overflow-hidden hover:border-amber-500/40 transition-all group flex flex-col justify-between"
            >
              <div className="h-40 overflow-hidden relative">
                <img
                  src={srv.imageUrl}
                  alt={srv.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] text-amber-300 font-mono">
                  {srv.price ? `${srv.price.toLocaleString('ar-YE')} ريال` : 'مشمول'}
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                    {srv.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                    {srv.description}
                  </p>
                </div>
                <button
                  onClick={() => setCurrentTab('booking')}
                  className="mt-4 text-xs font-semibold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1"
                >
                  <span>طلب في الحجز</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Gallery Teaser */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold text-amber-400 tracking-wider">
              لقطات من واقع القاعة
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-serif-ar mt-1">
              معرض الصور والفيديوهات
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              تصفح صور الكوشات، القاعة الرئيسية، الإضاءة والمناسبات
            </p>
          </div>

          <button
            onClick={() => setCurrentTab('gallery')}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1"
          >
            <span>شاهد المعرض الكامل</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {gallery.slice(0, 4).map((item) => (
            <div
              key={item.id}
              onClick={() => onOpenLightbox(item)}
              className="rounded-2xl overflow-hidden aspect-square relative cursor-pointer group border border-slate-800"
            >
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                <p className="text-xs font-bold text-white truncate">{item.title}</p>
                <span className="text-[10px] text-amber-300">اضغط للمشاهدة بالحجم الكامل</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Reviews & Ratings Spotlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#121622] rounded-3xl border border-slate-800 p-6 sm:p-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold text-amber-400 tracking-wider">
                ثقة أكثر من 1,180 عائلة ومؤسسة
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white font-serif-ar mt-1">
                ماذا يقول عملاؤنا عن قاعة ذو ريدان؟
              </h2>
            </div>

            <div className="flex items-center gap-4 bg-[#0a0d14] px-5 py-3 rounded-2xl border border-amber-500/20">
              <div className="text-center">
                <div className="text-3xl font-extrabold text-amber-400 font-mono">4.4</div>
                <div className="flex text-amber-400 text-xs mt-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
              <div className="border-r border-slate-800 pr-4 text-xs text-slate-300">
                <p className="font-bold text-white">التقييم العام المعتمد</p>
                <p className="text-slate-400">1,182+ مراجعة في Google Maps</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {reviews.slice(0, 3).map((rev) => (
              <div
                key={rev.id}
                className="p-5 rounded-2xl bg-[#0a0d14] border border-slate-800/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex text-amber-400">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {rev.source === 'google' ? 'Google Maps' : 'عميل معتمد'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    "{rev.comment}"
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{rev.authorName}</span>
                  {rev.eventType && (
                    <span className="text-[11px] text-slate-400">{rev.eventType}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setCurrentTab('reviews')}
              className="px-6 py-2.5 rounded-xl bg-[#182133] hover:bg-[#222d44] text-amber-300 border border-amber-500/30 text-xs font-bold transition-colors inline-flex items-center gap-1.5"
            >
              <span>مشاهدة كل التقييمات وإضافة تقييمك</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 8. Location & Directions Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#121622] rounded-3xl border border-slate-800 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3">
            
            <div className="p-6 sm:p-8 space-y-4">
              <span className="text-xs font-bold text-amber-400">موقع استراتيجي وسهل الوصول</span>
              <h3 className="text-xl sm:text-2xl font-bold text-white font-serif-ar">
                موقع قاعة ذو ريدان في صنعاء
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                تقع القاعة في قلب العاصمة صنعاء على شارع الحصبة الحيوي، بجوار اللجنة الدائمة للمؤتمر الشعبي العام، وتتميز بسهولة وصول المواكب وضيوف المحافظات وتوفر مواقف سيارات واسعة.
              </p>

              <div className="space-y-2 text-xs text-slate-300 pt-2">
                <p className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{settings?.address || 'شارع الحصبة، جوار اللجنة الدائمة، صنعاء، اليمن'}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-mono">Plus Code: {settings?.plusCode || '96H3+FH صنعاء'}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>مفتوحة 24 ساعة لاستقبال الحجوزات</span>
                </p>
              </div>

              <div className="pt-4 flex flex-col gap-2">
                <a
                  href={settings?.googleMapsUrl || 'https://maps.google.com/?q=15.3789,44.2014'}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>الحصول على الاتجاهات في Google Maps</span>
                </a>

                <a
                  href={`tel:${settings?.phonePrimary || '+967777123456'}`}
                  className="py-2 px-4 rounded-xl bg-[#182133] hover:bg-[#202c45] text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                  dir="ltr"
                >
                  <Phone className="w-4 h-4 text-amber-400" />
                  <span>{settings?.phonePrimary || '+967 777 123 456'}</span>
                </a>
              </div>
            </div>

            {/* Interactive Map Visual */}
            <div className="lg:col-span-2 min-h-[300px] relative bg-slate-900 border-t lg:border-t-0 lg:border-r border-slate-800">
              <iframe
                title="موقع قاعة ذو ريدان - صنعاء"
                src="https://maps.google.com/maps?q=15.3789,44.2014&hl=ar&z=15&output=embed"
                className="w-full h-full min-h-[320px] border-0"
                loading="lazy"
                allowFullScreen
              ></iframe>
            </div>

          </div>
        </div>
      </section>

      {/* 9. Final Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-black shadow-2xl text-center space-y-4">
          <h2 className="text-2xl sm:text-4xl font-extrabold font-serif-ar">
            احجز موعد مناسبتك في قاعة ذو ريدان اليوم
          </h2>
          <p className="text-sm sm:text-base font-medium max-w-2xl mx-auto opacity-90 leading-relaxed">
            اختر التاريخ المناسب، وتحقق من عدم وجود تعارض في المواعيد، وحدد باقتك المفضلة وسنقوم بمراجعة وتأكيد حجزك فوراً.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setCurrentTab('booking')}
              className="px-8 py-3 rounded-xl bg-black hover:bg-slate-900 text-amber-300 font-bold text-sm shadow-xl transition-all hover:scale-105"
            >
              بدء الحجز الإلكتروني
            </button>
            <button
              onClick={() => setCurrentTab('contact')}
              className="px-6 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-black font-bold text-sm backdrop-blur-sm transition-all"
            >
              التواصل والاستفسار المباشر
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
