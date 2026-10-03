import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  Maximize2,
  Filter,
  Image as ImageIcon,
  Video
} from 'lucide-react';
import { GalleryItem } from '../types';

interface GalleryPageProps {
  gallery: GalleryItem[];
  onOpenLightbox: (item: GalleryItem) => void;
}

export const GalleryPage: React.FC<GalleryPageProps> = ({
  gallery,
  onOpenLightbox,
}) => {
  const [activeTab, setActiveTab] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'جميع الصور والفيديوهات' },
    { id: 'weddings', label: 'الأعراس والزفاف' },
    { id: 'decor', label: 'الكوشة والإضاءة' },
    { id: 'facilities', label: 'القاعة والتجهيزات' },
    { id: 'graduations', label: 'حفلات التخرج' },
    { id: 'conferences', label: 'المؤتمرات والندوات' },
  ];

  const filtered = gallery.filter((item) => {
    if (activeTab === 'all') return true;
    return item.category === activeTab;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>توثيق أرقى اللحظات والذكريات</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white font-serif-ar">
          معرض صور وفيديوهات قاعة ذو ريدان
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-light">
          استكشف تفاصيل القاعة، كوشات الأعراس، الديكورات، الإضاءة السينمائية ومدرجات التخرج من واقع مناسباتنا الحقيقية بصنعاء.
        </p>
      </div>

      {/* Categories Filter Tabs */}
      <div className="flex items-center justify-center flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveTab(c.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === c.id
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-[#121622] text-slate-300 hover:text-white hover:bg-[#1a2133] border border-slate-800'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Grid of media */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          لا توجد وسائط مضافة في هذا التصنيف حالياً.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => onOpenLightbox(item)}
              className="group relative rounded-2xl overflow-hidden bg-[#121622] border border-slate-800 shadow-xl cursor-pointer aspect-4/3"
            >
              <img
                src={item.imageUrl}
                alt={item.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />

              {/* Media type icon badge */}
              <div className="absolute top-3 left-3 z-10 p-1.5 rounded-lg bg-black/60 backdrop-blur-md text-amber-300">
                {item.mediaType === 'video' ? (
                  <Video className="w-4 h-4" />
                ) : (
                  <ImageIcon className="w-4 h-4" />
                )}
              </div>

              {/* Overlay with info */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-5 flex flex-col justify-end">
                <div className="flex items-center justify-between text-amber-300 mb-1">
                  <span className="text-[11px] font-semibold">قاعة ذو ريدان</span>
                  <Maximize2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white leading-tight font-serif-ar">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
