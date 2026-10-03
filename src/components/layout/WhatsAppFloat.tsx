import React, { useState } from 'react';
import { MessageCircle, X, Sparkles, Send } from 'lucide-react';
import { HallSettings } from '../../types';

interface WhatsAppFloatProps {
  settings: HallSettings | null;
}

export const WhatsAppFloat: React.FC<WhatsAppFloatProps> = ({ settings }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customMsg, setCustomMsg] = useState('السلام عليكم، أود الاستفسار عن حجز قاعة ذو ريدان للأفراح والمواعيد المتاحة.');

  const phoneNum = settings?.whatsappNumber?.replace(/[^0-9]/g, '') || '967777123456';

  const handleSend = () => {
    const url = `https://wa.me/${phoneNum}?text=${encodeURIComponent(customMsg)}`;
    window.open(url, '_blank');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start font-sans">
      {isOpen && (
        <div className="mb-3 w-80 bg-[#121622] rounded-2xl border border-emerald-500/30 shadow-2xl shadow-emerald-950/40 p-4 animate-scaleUp">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">خدمة عملاء قاعة ذو ريدان</h4>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>متصل الآن - رد فوري</span>
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-3">
            <p className="text-xs text-slate-300 leading-relaxed mb-2">
              أهلاً بكم في قاعة ذو ريدان بصنعاء. يسعدنا استقبال استفساراتكم حول حجوزات الأعراس، التخرج والمناسبات:
            </p>
            <textarea
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              rows={3}
              className="w-full bg-[#0a0d14] border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={handleSend}
            className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>مراسلة عبر واتساب</span>
          </button>
        </div>
      )}

      {/* Trigger floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-950/50 flex items-center justify-center transition-all hover:scale-110 border-2 border-emerald-400/40 relative group"
        aria-label="تواصل عبر واتساب"
        title="تواصل عبر واتساب"
      >
        <MessageCircle className="w-7 h-7" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-[10px] text-black font-black">
          1
        </span>
      </button>
    </div>
  );
};
