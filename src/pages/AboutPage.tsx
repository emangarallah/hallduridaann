import React from 'react';
import {
  Sparkles,
  Users,
  Volume2,
  Tv,
  Flame,
  ShieldCheck,
  Zap,
  MapPin,
  Clock,
  Award,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronLeft
} from 'lucide-react';
import { HallSettings } from '../types';

interface AboutPageProps {
  settings: HallSettings | null;
  setCurrentTab: (tab: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ settings, setCurrentTab }) => {
  const specs = [
    {
      icon: Users,
      title: 'السعة الاستيعابية والتقسيم',
      desc: 'تتسع القاعة لأكثر من 1,500 ضيف، وتضم جناحين مستقلين تماماً (قسم الرجال وقسم النساء) بمداخل منفصلة ومرافق متكاملة تضمن أعلى درجات الخصوصية.'
    },
    {
      icon: Volume2,
      title: 'هندسة الصوت الرقمية',
      desc: 'سماعات احترافية بتوزيع هيدروليكي 360 درجة تغطي كافة أرجاء القاعة بنقاء فائق دون صدى مزعج، ميكروفونات لاسلكية، ومكسر ديجيتال متطور بإشراف مهندسي صوت ذوي خبرة.'
    },
    {
      icon: Tv,
      title: 'شاشات LED بدقة 4K',
      desc: 'شاشة سينمائية عملاقة خلف منصة الكوشة مع شاشات عرض جانبية موزعة على مختلف الزوايا لنقل فقرات العرس وحفلات التخرج والعروض التقديمية للمؤتمرات.'
    },
    {
      icon: Flame,
      title: 'الإضاءة والمؤثرات البصرية',
      desc: 'منظومة إضاءة روبوتية حديثة، ليزر احترافي، أجهزة رقص ضوئي، ماكينات ضباب ودخان بارد هيدروجيني، وأجهزة سبارك (ألعاب نارية باردة آمنة 100%).'
    },
    {
      icon: Layers,
      title: 'الفرش الملكي والديكورات',
      desc: 'كراسي مخملية فندقية مريحة، طاولات مستديرة بتنسيقات ورد فاخرة، سجاد أحمر وممرات شرف مضيئة تليق بزفة العروس ومسيرة التكريم.'
    },
    {
      icon: Zap,
      title: 'طاقة وتكييف متواصل 100%',
      desc: 'منظومة تكييف مركزي عالية التبريد مدعومة بمولدات طاقة كهربائية كاتمة للصوت تعمل أوتوماتيكياً لضمان استمرار الحفل بدون أي انقطاع.'
    },
    {
      icon: Award,
      title: 'جناح العروس VIP المستقل',
      desc: 'سويت خاص فخم للعروس ومرافقتها مجهز بمرآة إضاءة هوليوود، صالون استراحة مريح، حمام خاص وتكييف مستقل لضمان أقصى درجات الراحة قبل الزفة.'
    },
    {
      icon: ShieldCheck,
      title: 'المواقف والأمان والحراسة',
      desc: 'مساحات مواقف سيارات واسعة ومجانية تستوعب عشرات المركبات، مع طاقم حراسة وتنظيم حركة سير عند الدخول والخروج في شارع الحصبة.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>صرح المناسبات الأول في صنعاء</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white font-serif-ar">
          عن قاعة ذو ريدان للأفراح والمناسبات
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-light">
          {settings?.description || 'قاعة واسعة وفخمة بأحدث التجهيزات والأنظمة الصوتية والمرئية، مناسبة للأعراس، حفلات التخرج، المناسبات العائلية، المؤتمرات والعزاء.'}
        </p>
      </div>

      {/* Main Story & History */}
      <div className="bg-[#121622] rounded-3xl border border-amber-500/20 p-6 sm:p-10 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-serif-ar border-r-4 border-amber-400 pr-3">
              تاريخ القاعة ورؤيتنا
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              تأسست قاعة ذو ريدان بصنعاء لتكون المرجع الأول في استضافة أرقى المناسبات والفعاليات. استوحينا اسمها من التاريخ اليمني العريق «ذو ريدان»، ليعبر عن الشموخ والأصالة الممزوجة بالفخامة المعاصرة.
            </p>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              على مدار سنوات من الخدمة والعطاء، حظيت القاعة بثقة آلاف الأسر والمؤسسات والجامعات اليمنية، محققة تقييم 4.4 من أكثر من 1,180 مراجعة على خرائط Google، بفضل تفاني فريق العمل وحرصنا الدائم على التحديث المستمر للديكورات وتقنيات الصوت والإضاءة.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setCurrentTab('booking')}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md transition-colors"
              >
                احجز موعدك الآن
              </button>
              <button
                onClick={() => setCurrentTab('gallery')}
                className="px-5 py-2.5 rounded-xl bg-[#182133] hover:bg-[#222d44] text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors"
              >
                شاهد صور المرافق
              </button>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden aspect-video border border-slate-700 shadow-xl">
            <img
              src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80"
              alt="صالة قاعة ذو ريدان"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Specifications & Technical Amenities */}
      <div className="space-y-8">
        <div className="text-center">
          <span className="text-xs font-bold text-amber-400 tracking-wider">
            المواصفات الفنية والهندسية
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-serif-ar mt-1">
            مرافق وتجهيزات صُممت لراحتكم
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {specs.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-[#121622] border border-slate-800/80 hover:border-amber-500/40 transition-all hover:-translate-y-1 shadow-md group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Location & Access Details */}
      <div className="bg-[#121622] rounded-3xl border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-right">
          <span className="text-xs font-bold text-amber-400">العنوان في العاصمة صنعاء</span>
          <h3 className="text-xl font-bold text-white font-serif-ar">
            شارع الحصبة، جوار اللجنة الدائمة للمؤتمر الشعبي العام
          </h3>
          <p className="text-xs text-slate-300">
            موقع استراتيجي وسط العاصمة يسهل وصول الضيوف من جميع مديريات صنعاء والمحافظات المجاورة.
          </p>
        </div>

        <button
          onClick={() => setCurrentTab('contact')}
          className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md transition-colors shrink-0 flex items-center gap-1.5"
        >
          <span>عرض الخريطة وتفاصيل الوصول</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
