import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  X,
  Volume2,
  Flame,
  Tv,
  Coffee,
  Camera,
  ChevronLeft
} from 'lucide-react';
import { HallService } from '../types';

interface ServicesPageProps {
  services: HallService[];
  setCurrentTab: (tab: string) => void;
  onBookService?: (service: HallService) => void;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({
  services,
  setCurrentTab,
  onBookService,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<HallService | null>(null);

  const categories = [
    { id: 'all', label: 'جميع الخدمات' },
    { id: 'decor', label: 'الكوشة والديكور' },
    { id: 'sound', label: 'أنظمة الصوت' },
    { id: 'lighting', label: 'الإضاءة والمؤثرات' },
    { id: 'media', label: 'الشاشات والتصوير' },
    { id: 'hospitality', label: 'الضيافة والبوفيه' },
    { id: 'general', label: 'المؤتمرات والتجهيزات' },
  ];

  const filtered = services.filter((s) => {
    const matchesCat = activeCategory === 'all' || s.category === activeCategory;
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>تجهيزات فندقية بمعايير عالمية</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white font-serif-ar">
          خدمات وتجهيزات قاعة ذو ريدان
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-light">
          نقدم لكم باقة متكاملة من أرقى خدمات تجهيز الحفلات والمؤتمرات مع كادر محترف وأحدث الأجهزة التقنية بصنعاء.
        </p>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="bg-[#121622] rounded-2xl border border-slate-800 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن خدمة (كوشة، إضاءة، صوت، تصوير...)"
              className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl py-2 px-3 pl-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </div>

          <div className="text-xs text-slate-400">
            تم العثور على <strong className="text-amber-400 font-bold">{filtered.length}</strong> خدمة
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
                activeCategory === c.id
                  ? 'bg-amber-500 text-black font-bold shadow'
                  : 'bg-[#182133] text-slate-300 hover:text-white hover:bg-[#222d44]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          لا توجد خدمات مطابقة لمعايير البحث الحالية.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((service) => (
            <div
              key={service.id}
              className="rounded-2xl bg-[#121622] border border-slate-800 overflow-hidden hover:border-amber-500/40 transition-all hover:-translate-y-1 shadow-xl flex flex-col justify-between group"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={service.imageUrl}
                  alt={service.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121622] via-transparent to-transparent"></div>
                
                {/* Availability status */}
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md border ${
                      service.isAvailable
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    {service.isAvailable ? 'متوفرة للحجز' : 'غير متوفرة حالياً'}
                  </span>
                </div>

                {/* Price Tag */}
                <div className="absolute bottom-2 left-3 px-3 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
                  {service.price ? `${service.price.toLocaleString('ar-YE')} ريال` : 'حسب الطلب'}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                    {service.name}
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed line-clamp-3">
                    {service.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedService(service)}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    عرض التفاصيل
                  </button>

                  <button
                    onClick={() => {
                      if (onBookService) onBookService(service);
                      setCurrentTab('booking');
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>طلب الخدمة في الحجز</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Service Detail Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#121622] rounded-2xl border border-amber-500/30 shadow-2xl p-6 overflow-hidden">
            <button
              onClick={() => setSelectedService(null)}
              className="absolute top-4 left-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="h-56 rounded-xl overflow-hidden mb-4 border border-slate-700">
              <img
                src={selectedService.imageUrl}
                alt={selectedService.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-amber-400 font-semibold">
                خدمات قاعة ذو ريدان
              </span>
              <span className="font-mono font-bold text-amber-400 text-sm">
                {selectedService.price?.toLocaleString('ar-YE')} ريال يمني
                {selectedService.priceUsd && ` (~$${selectedService.priceUsd})`}
              </span>
            </div>

            <h3 className="text-lg font-bold text-white font-serif-ar mb-2">
              {selectedService.name}
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              {selectedService.description}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedService(null);
                  if (onBookService) onBookService(selectedService);
                  setCurrentTab('booking');
                }}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-md transition-colors"
              >
                تضمين الخدمة في حجزك
              </button>
              <button
                onClick={() => setSelectedService(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
