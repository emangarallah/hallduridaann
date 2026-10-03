import React, { useState } from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Navigation,
  MessageCircle,
  ExternalLink,
  Send,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { HallSettings } from '../types';

interface ContactPageProps {
  settings: HallSettings | null;
}

export const ContactPage: React.FC<ContactPageProps> = ({ settings }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !message) return;
    setSent(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
          <MapPin className="w-3.5 h-3.5" />
          <span>موقعنا في قلب العاصمة صنعاء</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white font-serif-ar">
          تواصل مع إدارة قاعة ذو ريدان
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-light">
          نحن في خدمتكم على مدار الساعة للإجابة على كافة استفساراتكم وحجز مواعيد المعاينة وتنسيق المناسبات.
        </p>
      </div>

      {/* Main Grid: Info + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Contact Info Cards */}
        <div className="space-y-4">
          
          {/* Address */}
          <div className="p-6 rounded-2xl bg-[#121622] border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">عنوان القاعة</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {settings?.address || 'شارع الحصبة، جوار اللجنة الدائمة للمؤتمر الشعبي العام، صنعاء، اليمن'}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 pt-1 font-mono">
              <Navigation className="w-3.5 h-3.5" />
              <span>{settings?.plusCode || '96H3+FH صنعاء، اليمن'}</span>
            </div>
          </div>

          {/* Working Hours */}
          <div className="p-6 rounded-2xl bg-[#121622] border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">أوقات العمل واستقبال الزوار</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {settings?.workingHours || 'مفتوحة على مدار الساعة (24/7) لاستقبال المناسبات والزيارات والمعاينة'}
            </p>
            <span className="inline-block px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[11px] font-bold">
              جاهزية مستمرة على مدار اليوم
            </span>
          </div>

          {/* Direct Phone & WhatsApp */}
          <div className="p-6 rounded-2xl bg-[#121622] border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">أرقام الهواتف والتواصل</h3>
            <div className="space-y-2 text-xs" dir="ltr">
              <a
                href={`tel:${settings?.phonePrimary || '+967777123456'}`}
                className="flex items-center gap-2 text-slate-300 hover:text-amber-400 font-mono transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>{settings?.phonePrimary || '+967 777 123 456'}</span>
              </a>
              <a
                href={`tel:${settings?.phoneSecondary || '+96701234567'}`}
                className="flex items-center gap-2 text-slate-300 hover:text-amber-400 font-mono transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>{settings?.phoneSecondary || '+967 01 234 567'}</span>
              </a>
              <a
                href={`mailto:${settings?.email || 'info@dhuraydan-hall.ye'}`}
                className="flex items-center gap-2 text-slate-300 hover:text-amber-400 font-mono transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>{settings?.email || 'info@dhuraydan-hall.ye'}</span>
              </a>
            </div>

            <div className="pt-2">
              <a
                href={`https://wa.me/${settings?.whatsappNumber?.replace(/[^0-9]/g, '') || '967777123456'}?text=${encodeURIComponent('السلام عليكم، أود الاستفسار عن حجز قاعة ذو ريدان للأفراح')}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>محادثة واتساب سريعة</span>
              </a>
            </div>
          </div>

        </div>

        {/* Map & Inquiry Form */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Embedded Map */}
          <div className="rounded-2xl overflow-hidden border border-slate-800 bg-[#121622] shadow-xl">
            <div className="p-4 bg-[#182133] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-white font-bold">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>موقع القاعة الجغرافي - شارع الحصبة</span>
              </div>
              <a
                href={settings?.googleMapsUrl || 'https://maps.google.com/?q=15.3789,44.2014'}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>فتح في تطبيق الخرائط</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <div className="w-full h-80 bg-slate-900">
              <iframe
                title="موقع قاعة ذو ريدان"
                src="https://maps.google.com/maps?q=15.3789,44.2014&hl=ar&z=15&output=embed"
                className="w-full h-full border-0"
                loading="lazy"
              ></iframe>
            </div>
          </div>

          {/* Send Message / Inquiry Form */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#121622] border border-slate-800">
            <h3 className="text-lg font-bold text-white font-serif-ar mb-1">
              أرسل لنا استفسارك أو طلب معاينة
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              سيتواصل معك فريق العلاقات العامة بالقاعة خلال وقت قصير
            </p>

            {sent ? (
              <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white font-serif-ar">تم إرسال رسالتك بنجاح!</h4>
                <p className="text-xs text-slate-300">
                  شكراً لتواصلك مع قاعة ذو ريدان، سيتصل بك مسؤول المناسبات على هاتفك لتزويدك بالتفاصيل المطلوبة.
                </p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-3 text-xs text-amber-400 hover:underline"
                >
                  إرسال رسالة أخرى
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      الاسم الكريم
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="أدخل اسمك"
                      className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      رقم الهاتف للتواصل
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+967 77..."
                      className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
                      dir="ltr"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    موضوع الاستفسار
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="مثال: حجز عرس في شهر ديسمبر / استفسار عن سعة القاعة"
                    className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    الرسالة أو الملاحظات
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    placeholder="اكتب استفسارك بالتفصيل..."
                    className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>إرسال الاستفسار الآن</span>
                </button>
              </form>
            )}
          </div>

        </div>

      </div>

      {/* Booking & Cancellation Policies Banner */}
      <div className="bg-[#121622] rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-3">
        <h3 className="text-base font-bold text-white font-serif-ar flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          <span>سياسة الحجز والإلغاء المعتمدة في قاعة ذو ريدان</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          {settings?.cancellationPolicy || 'يمكن إلغاء الحجز واسترداد العربون قبل 14 يوماً على الأقل من موعد المناسبة. في حال الإلغاء قبل أقل من أسبوع يخضع الحجز لسياسة الرسوم الإدارية للقاعة.'}
        </p>
      </div>

    </div>
  );
};
