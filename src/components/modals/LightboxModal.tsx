import React from 'react';
import { X, ChevronRight, ChevronLeft, Maximize2, Video } from 'lucide-react';
import { GalleryItem } from '../../types';

interface LightboxModalProps {
  item: GalleryItem | null;
  items: GalleryItem[];
  onClose: () => void;
  onNavigate: (item: GalleryItem) => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  item,
  items,
  onClose,
  onNavigate,
}) => {
  if (!item) return null;

  const currentIndex = items.findIndex((i) => i.id === item.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < items.length - 1;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasPrev) onNavigate(items[currentIndex - 1]);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasNext) onNavigate(items[currentIndex + 1]);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fadeIn"
    >
      <button
        onClick={onClose}
        className="absolute top-5 left-5 z-50 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Prev / Next controls */}
      {hasPrev && (
        <button
          onClick={handlePrev}
          className="absolute right-5 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 transition-colors"
          title="الصورة السابقة"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {hasNext && (
        <button
          onClick={handleNext}
          className="absolute left-5 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 transition-colors"
          title="الصورة التالية"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Media Content */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-5xl max-h-[90vh] flex flex-col items-center justify-center"
      >
        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-amber-500/20 bg-black">
          {item.mediaType === 'video' && item.videoUrl ? (
            <video
              src={item.videoUrl}
              controls
              autoPlay
              className="max-h-[75vh] w-auto max-w-full object-contain"
            />
          ) : (
            <img
              src={item.imageUrl}
              alt={item.title}
              className="max-h-[75vh] w-auto max-w-full object-contain"
            />
          )}
        </div>

        {/* Caption */}
        <div className="mt-4 text-center max-w-2xl px-4">
          <h3 className="text-lg font-bold text-white font-serif-ar">{item.title}</h3>
          {item.description && (
            <p className="text-xs text-slate-300 mt-1">{item.description}</p>
          )}
          <span className="text-[11px] text-amber-400/80 mt-1.5 block">
            {currentIndex + 1} من {items.length}
          </span>
        </div>
      </div>
    </div>
  );
};
