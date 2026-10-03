import React, { useState } from 'react';
import {
  Sparkles,
  Star,
  MessageSquare,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { Review, HallSettings } from '../types';
import { useAuth } from '../context/AuthContext';

interface ReviewsPageProps {
  reviews: Review[];
  settings: HallSettings | null;
  onOpenReviewModal: () => void;
  openAuthModal: () => void;
}

export const ReviewsPage: React.FC<ReviewsPageProps> = ({
  reviews,
  settings,
  onOpenReviewModal,
  openAuthModal,
}) => {
  const { user } = useAuth();
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');

  const filteredReviews = reviews.filter((r) => {
    if (filterRating === 'all') return true;
    return r.rating === filterRating;
  });

  const ratingCounts = {
    5: reviews.filter((r) => r.rating === 5).length,
    4: reviews.filter((r) => r.rating === 4).length,
    3: reviews.filter((r) => r.rating === 3).length,
    2: reviews.filter((r) => r.rating === 2).length,
    1: reviews.filter((r) => r.rating === 1).length,
  };

  const handleAddReviewClick = () => {
    if (!user) {
      openAuthModal();
    } else {
      onOpenReviewModal();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
          <Star className="w-3.5 h-3.5 fill-amber-300" />
          <span>آراء وتجارب معتمدة من أرض الواقع</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white font-serif-ar">
          تقييمات وآراء ضيوف قاعة ذو ريدان
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-light">
          نفتخر بثقة أكثر من 1,180 عائلة وجهة أقامت مناسباتها في قاعة ذو ريدان بصنعاء على مدار الأعوام الماضية.
        </p>
      </div>

      {/* Google Maps Spotlight Summary Box */}
      <div className="bg-[#121622] rounded-3xl border border-amber-500/20 p-6 sm:p-10 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          
          {/* Big Score */}
          <div className="text-center md:text-right space-y-2 border-b md:border-b-0 md:border-l border-slate-800 pb-6 md:pb-0 md:pl-8">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <span className="text-5xl sm:text-6xl font-black text-amber-400 font-mono">
                {settings?.ratingScore || '4.4'}
              </span>
              <div>
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-xs text-slate-400 block mt-1">من 5 درجات</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-medium">
              التقييم العام المعتمد على منصة <strong>Google Maps</strong>
            </p>
            <p className="text-[11px] text-slate-400">
              استناداً إلى <strong>{settings?.ratingCount || '1,182'}</strong> مراجعة موثقة من زوار حقيقيين
            </p>

            <div className="pt-2">
              <a
                href={settings?.googleMapsUrl || 'https://maps.google.com/?q=15.3789,44.2014'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 hover:underline"
              >
                <span>مشاهدة المراجعات على Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Rating Breakdown Bars */}
          <div className="space-y-2 text-xs">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = ratingCounts[stars as keyof typeof ratingCounts] || 0;
              const total = reviews.length || 1;
              const percent = Math.round((count / total) * 100);

              return (
                <div key={stars} className="flex items-center gap-2">
                  <span className="w-12 text-slate-400 text-right">{stars} نجوم</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                      style={{ width: `${percent || (stars >= 4 ? 80 : 10)}%` }}
                    ></div>
                  </div>
                  <span className="w-10 text-left text-slate-400 text-[11px] font-mono">
                    {percent}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Add Review Action */}
          <div className="p-5 rounded-2xl bg-[#0a0d14] border border-slate-800 text-center space-y-3">
            <h3 className="text-sm font-bold text-white">هل أقمت مناسبتك في قاعة ذو ريدان؟</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              يسعدنا جداً أن تشاركنا رأيك وملاحظاتك لمساعدتنا على تقديم أرقى تجربة دائماً.
            </p>
            <button
              onClick={handleAddReviewClick}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة تقييم جديد</span>
            </button>
          </div>

        </div>
      </div>

      {/* Reviews Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">تصفية حسب التقييم:</span>
          {(['all', 5, 4, 3] as const).map((r) => (
            <button
              key={String(r)}
              onClick={() => setFilterRating(r)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterRating === r
                  ? 'bg-amber-500 text-black font-bold'
                  : 'bg-[#121622] text-slate-300 hover:text-white'
              }`}
            >
              {r === 'all' ? 'الكل' : `${r} نجوم`}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400">
          عرض {filteredReviews.length} تقييم
        </span>
      </div>

      {/* Reviews Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReviews.map((rev) => (
          <div
            key={rev.id}
            className="p-6 rounded-2xl bg-[#121622] border border-slate-800 hover:border-amber-500/30 transition-all flex flex-col justify-between shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex text-amber-400">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    rev.source === 'google'
                      ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                      : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  {rev.source === 'google' ? 'Google Maps' : 'عميل مؤكد'}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic mb-4">
                "{rev.comment}"
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <div>
                <h4 className="font-bold text-white">{rev.authorName}</h4>
                {rev.eventType && (
                  <span className="text-[11px] text-amber-400/80">{rev.eventType}</span>
                )}
              </div>
              <span className="text-[10px] text-slate-400">
                {new Date(rev.createdAt).toLocaleDateString('ar-YE', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
