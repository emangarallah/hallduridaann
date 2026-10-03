import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  Calendar,
  Star,
  Users,
  Award,
  Crown,
  ChevronLeft
} from 'lucide-react';
import { HallPackage, HallService } from '../types';

interface PackagesPageProps {
  packages: HallPackage[];
  services: HallService[];
  setCurrentTab: (tab: string) => void;
  onSelectPackageForBooking: (pkg: HallPackage) => void;
}

export const PackagesPage: React.FC<PackagesPageProps> = ({
  packages,
  services,
  setCurrentTab,
  onSelectPackageForBooking,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
          <Crown className="w-3.5 h-3.5" />
          <span>باقات متكاملة ومدروسة لكافة المناسبات</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white font-serif-ar">
          باقات قاعة ذو ريدان للأفراح والمناسبات
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-light">
          صممنا باقاتنا لتمنحكم أقصى درجات الفخامة وبأفضل الأسعار المناسبة لمختلف الميزانيات، مع إمكانية التعديل وإضافة خدمات إضافية حسب رغبتكم.
        </p>
      </div>

      {/* Main Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`rounded-3xl bg-[#121622] border transition-all flex flex-col justify-between overflow-hidden ${
              pkg.isPopular
                ? 'border-amber-400 shadow-2xl shadow-amber-950/40 relative scale-102 lg:-translate-y-2'
                : 'border-slate-800 hover:border-amber-500/40 shadow-lg'
            }`}
          >
            {/* Top Badge */}
            {pkg.badge && (
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-black text-xs font-black py-1.5 px-4 text-center tracking-wide">
                {pkg.badge}
              </div>
            )}

            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-white font-serif-ar">
                  {pkg.name}
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                {pkg.description}
              </p>

              {/* Price card */}
              <div className="p-4 rounded-2xl bg-[#0a0d14] border border-slate-800 text-center mb-6">
                <span className="text-[10px] text-slate-400 block mb-1">السعر الإجمالي للباقة:</span>
                <div className="text-2xl font-black text-amber-400 font-mono">
                  {pkg.price.toLocaleString('ar-YE')} <span className="text-xs text-slate-300 font-sans">ريال</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">
                  (~${pkg.priceUsd} دولار أمريكي)
                </div>
              </div>

              {/* Capacity & Highlights */}
              <div className="mb-4 pb-4 border-b border-slate-800 flex items-center gap-2 text-xs text-amber-300 font-semibold">
                <Users className="w-4 h-4 text-amber-400" />
                <span>{pkg.guestCapacityText}</span>
              </div>

              {/* Features List */}
              <div className="space-y-2 mb-6">
                <span className="text-xs font-bold text-white block mb-2">
                  المميزات المشمولة:
                </span>
                <ul className="space-y-2 text-xs text-slate-300">
                  {pkg.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bottom Button */}
            <div className="p-6 pt-0">
              <button
                onClick={() => onSelectPackageForBooking(pkg)}
                className={`w-full py-3 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-1.5 ${
                  pkg.isPopular
                    ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
                    : 'bg-[#182133] hover:bg-amber-500 hover:text-black text-amber-300 border border-amber-500/30'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>احجز هذه الباقة الآن</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison Overview */}
      <div className="bg-[#121622] rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-6">
        <h3 className="text-xl font-bold text-white font-serif-ar border-r-4 border-amber-400 pr-3">
          ملاحظات وإرشادات هامة عن الباقات
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300 leading-relaxed">
          <div className="p-4 bg-[#0a0d14] rounded-2xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-white text-sm">مرونة التخصيص الكامل</h4>
            <p>
              يمكنك أثناء خطوة الحجز اختيار أي خدمات وتجهيزات إضافية (مثل بوفيه ضيافة إضافي، كاميرات كرين، شاشات إضافية) وسيتم احتساب التكلفة تلقائياً.
            </p>
          </div>
          <div className="p-4 bg-[#0a0d14] rounded-2xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-white text-sm">تثبيت وتأكيد الحجز</h4>
            <p>
              بعد تقديم طلب الحجز أونلاين، تتواصل معك إدارة القاعة لتنسيق معاينة القاعة إن رغبت وتأكيد العقد ودفع العربون لضمان تثبيت الموعد نهائياً.
            </p>
          </div>
          <div className="p-4 bg-[#0a0d14] rounded-2xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-white text-sm">توليد الكهرباء والتكييف</h4>
            <p>
              جميع الباقات تشمل تشغيل منظومات التكييف والمولدات الكهربائية طوال وقت المناسبة مجاناً دون أي رسوم إضافية مخفية.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
