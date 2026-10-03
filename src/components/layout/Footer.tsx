import React from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Star,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  Navigation
} from 'lucide-react';
import { HallSettings } from '../../types';

interface FooterProps {
  settings: HallSettings | null;
  setCurrentTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, setCurrentTab }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#07090d] text-slate-400 border-t border-[#1c2233] relative overflow-hidden">
      {/* Subtle luxury glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-amber-500/5 blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Column 1: Hall identity & Google Rating */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-700 p-0.5 shadow-md shadow-amber-900/20">
                <div className="w-full h-full bg-[#0b0d13] rounded-[6px] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white font-serif-ar">
                {settings?.hallName || 'قاعة ذو ريدان للأفراح والمناسبات'}
              </h3>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              {settings?.description || 'قاعة واسعة وفخمة بأحدث التجهيزات والأنظمة الصوتية والمرئية، مناسبة للأعراس، حفلات التخرج، المناسبات العائلية، المؤتمرات والعزاء.'}
            </p>

            {/* Google Rating badge */}
            <div className="p-3 bg-[#111624] border border-[#232b40] rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-sm font-bold text-white">4.4</span>
              </div>
              <div className="text-[11px] text-slate-400">
                <span>1,182 تقييم</span>
                <span className="text-amber-400 font-medium mr-1">Google Maps</span>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white border-r-2 border-amber-400 pr-2">
              روابط سريعة
            </h4>
            <ul className="space-y-2 text-xs">
              {[
                { id: 'home', label: 'الرئيسية' },
                { id: 'about', label: 'عن القاعة والمرافق' },
                { id: 'packages', label: 'الباقات والأسعار' },
                { id: 'services', label: 'الخدمات والتجهيزات' },
                { id: 'booking', label: 'حجز القاعة إلكترونياً' },
                { id: 'gallery', label: 'معرض الصور والفيديوهات' },
                { id: 'reviews', label: 'آراء وتقييمات العملاء' },
              ].map((link) => (
                <li key={link.id}>
                  <button
                    onClick={() => {
                      setCurrentTab(link.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex items-center gap-1.5 hover:text-amber-300 transition-colors text-right"
                  >
                    <ChevronLeft className="w-3 h-3 text-amber-500" />
                    <span>{link.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Event Types & Capacity */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white border-r-2 border-amber-400 pr-2">
              المناسبات والخدمات
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span>حفلات الأعراس والزفاف الملكي</span>
                <span className="text-amber-400">قسمين مستقلين</span>
              </li>
              <li className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span>حفلات التخرج الأكاديمية</span>
                <span className="text-amber-400">مدرج تكريم</span>
              </li>
              <li className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span>المؤتمرات وورش العمل</span>
                <span className="text-amber-400">شاشات LED 4K</span>
              </li>
              <li className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span>المناسبات العائلية وعقد القران</span>
                <span className="text-amber-400">بوفيه وضيافة</span>
              </li>
              <li className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span>مراسيم العزاء والاستقبال</span>
                <span className="text-amber-400">سعة واسعة</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Location & Contact in Sana'a */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white border-r-2 border-amber-400 pr-2">
              العنوان والتواصل
            </h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  {settings?.address || 'شارع الحصبة، جوار اللجنة الدائمة للمؤتمر الشعبي العام، صنعاء، اليمن'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-mono text-slate-300">
                  {settings?.plusCode || '96H3+FH صنعاء، اليمن'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-emerald-400 font-medium">
                  {settings?.workingHours || 'مفتوحة على مدار الساعة (24/7)'}
                </span>
              </div>

              <div className="flex items-center gap-2" dir="ltr">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <a
                  href={`tel:${settings?.phonePrimary || '+967777123456'}`}
                  className="hover:text-amber-300 transition-colors"
                >
                  {settings?.phonePrimary || '+967 777 123 456'}
                </a>
              </div>

              <div className="flex items-center gap-2" dir="ltr">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <a
                  href={`mailto:${settings?.email || 'info@dhuraydan-hall.ye'}`}
                  className="hover:text-amber-300 transition-colors"
                >
                  {settings?.email || 'info@dhuraydan-hall.ye'}
                </a>
              </div>

              {/* Get Directions Button */}
              <a
                href={settings?.googleMapsUrl || 'https://maps.google.com/?q=15.3789,44.2014'}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-[#182133] hover:bg-[#202c45] text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>فتح الموقع في Google Maps</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            جميع الحقوق محفوظة © {currentYear} {settings?.hallName || 'قاعة ذو ريدان للأفراح والمناسبات'}. صنعاء، الجمهورية اليمنية.
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>نظام الحجز الإلكتروني والإدارة المتكاملة</span>
            <span>·</span>
            <button
              onClick={() => {
                setCurrentTab('contact');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-amber-300"
            >
              سياسة الحجز والإلغاء
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
