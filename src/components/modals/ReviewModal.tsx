import React, { useState } from 'react';
import { X, Star, Sparkles, Send, CheckCircle2 } from 'lucide-react';
import { Booking } from '../../types';
import { submitReview } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface ReviewModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  booking,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [authorName, setAuthorName] = useState(user?.name || booking?.customerName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('يرجى كتابة رأيك وتجربتك في القاعة');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await submitReview({
        userId: user?.id,
        bookingId: booking?.id,
        authorName: authorName.trim() || 'عميل معتمد',
        authorPhone: user?.phone || booking?.customerPhone,
        rating,
        comment: comment.trim(),
        eventType: booking?.eventType || 'مناسبة خاصة',
      });
      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'فشل إرسال التقييم');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#121622] rounded-2xl border border-amber-500/20 shadow-2xl p-6 text-right">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white font-serif-ar">شكراً لمشاركتنا تقييمك!</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              تم استلام تقييمك بنجاح وسيظهر في قسم آراء وتجارب العملاء بعد مراجعته من قبل إدارة القاعة.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-colors"
            >
              تم
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center mb-4">
              <div className="inline-flex p-3 rounded-xl bg-amber-500/10 text-amber-400 mb-2">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-serif-ar">شاركنا رأيك في قاعة ذو ريدان</h3>
              <p className="text-xs text-slate-400">
                رأيك يهمنا ويساعدنا على تطوير خدمات الضيافة والتجهيزات
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
                {error}
              </div>
            )}

            {/* Star Rating selector */}
            <div className="flex flex-col items-center gap-1.5 py-2">
              <span className="text-xs text-slate-300 font-medium">التقييم العام</span>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        star <= rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-amber-400">
                {rating === 5 && 'ممتاز وفوق التوقعات ⭐⭐⭐⭐⭐'}
                {rating === 4 && 'جيد جداً ورائع ⭐⭐⭐⭐'}
                {rating === 3 && 'جيد ⭐⭐⭐'}
                {rating === 2 && 'مقبول ⭐⭐'}
                {rating === 1 && 'يحتاج لتحسين ⭐'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                اسمك الظاهر مع التقييم
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="أدخل اسمك"
                className="w-full bg-[#0b0e16] border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                تعليقك وتجربتك
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="تحدث عن مستوى الخدمة، التكييف، الصوتيات، الكوشة، أو تعامل كادر القاعة..."
                className="w-full bg-[#0b0e16] border border-slate-700 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'جاري الإرسال...' : 'إرسال التقييم'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
