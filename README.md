# نظام حجز وإدارة قاعة ذو ريدان للأفراح والمناسبات (صنعاء - اليمن)
# Dhu Raydan Wedding and Event Hall Booking & Management Platform

منصة ويب متكاملة وعصرية لإدارة وحجز **قاعة ذو ريدان للأفراح والمناسبات** الكائنة في **شارع الحصبة، جوار اللجنة الدائمة للمؤتمر الشعبي العام، صنعاء، اليمن** (Plus Code: `96H3+FH`).

---

## 🏛️ مميزات النظام

1. **موقع عام للزوار**: واجهة فاخرة باللغة العربية مع دعم RTL وتصميم مخصص لقاعات الأفراح والمؤتمرات.
2. **نظام منع تضارب الحجوزات**: فحص فوري ومباشر لتوفر التواريخ والفترات (صباحية / مسائية / يوم كامل) ومنع أي تعارض في الحجوزات المؤكدة.
3. **حساب العميل (Customer Dashboard)**: متابعة الحجوزات، طباعة سند الحجز الرسمي، إلغاء الطلبات المعلقة، وإضافة تقييم بعد انتهاء المناسبة.
4. **لوحة تحكم الأدمن (Admin Portal)**:
   - لوحة إحصائيات وإيرادات تفاعلية مع توزيع الحالات.
   - إدارة الحجوزات (قبول مع فحص التعارض، رفض مع توضيح السبب، إلغاء، وإكمال).
   - تقويم الحجوزات الشهري التفاعلي.
   - إدارة الخدمات، الباقات والأسعار.
   - إدارة معرض الصور والفيديوهات (مع دعم Lightbox).
   - إدارة التقييمات واعتمادها.
   - إدارة المحتوى والإعدادات (CMS) لتعديل الهواتف والعناوين ونصوص الموقع.
5. **إشعارات داخلية**: إشعارات فورية للعميل عند تغير حالة الحجز وتنبيهات للإدارة عند ورود حجوزات جديدة.
6. **سند حجز رسمي قابل للطباعة**: فاتورة إلكترونية مفصلة بالخدمات والأسعار بالريال اليمني والدولار.

---

## 🗂️ هيكل المشروع (Project Structure)

```text
├── db/
│   └── schema.sql                 # كود DDL لقاعدة بيانات PostgreSQL
├── prisma/
│   └── schema.prisma              # مخطط Prisma ORM مع العلاقات والفهارس
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx         # القائمة العلوية مع زر التبديل السريع والإشعارات
│   │   │   ├── Footer.tsx         # تذييل الموقع بمعلومات صنعاء وموقع الخريطة
│   │   │   └── WhatsAppFloat.tsx  # زر الواتساب العائم السريع
│   │   └── modals/
│   │       ├── AuthModal.tsx      # تسجيل الدخول وإنشاء الحساب واستعادة الكلمة
│   │       ├── BookingDetailsModal.tsx # سند الحجز المفصل القابل للطباعة
│   │       ├── LightboxModal.tsx  # عارض الصور والفيديوهات بالحجم الكامل
│   │       └── ReviewModal.tsx    # نموذج تقييم تجربة العميل
│   ├── context/
│   │   └── AuthContext.tsx        # إدارة الجلسة وصلاحيات الأدوار (RBAC)
│   ├── data/
│   │   └── seedData.ts            # بيانات القاعة الأولية (صنعاء، التقييم 4.4، 1,182 مراجعة)
│   ├── pages/
│   │   ├── HomePage.tsx           # الصفحة الرئيسية الفاخرة
│   │   ├── AboutPage.tsx          # مواصفات القاعة، الصوت، الإضاءة، الشاشات
│   │   ├── ServicesPage.tsx       # كتالوج الخدمات مع إمكانية التضمين بالحجز
│   │   ├── PackagesPage.tsx       # الباقات والأسعار والمقارنة
│   │   ├── GalleryPage.tsx        # معرض الوسائط المصنف
│   │   ├── BookingPage.tsx        # معالج الحجز متعدد الخطوات مع فحص التعارض
│   │   ├── ReviewsPage.tsx        # تقييمات Google Maps ومراجعات العملاء
│   │   ├── ContactPage.tsx        # العنوان، الخريطة، الاتجاهات ونموذج المراسلة
│   │   ├── AccountPage.tsx        # لوحة تحكم العميل وسجل الحجوزات
│   │   └── admin/
│   │       └── AdminDashboard.tsx # لوحة تحكم الأدمن الشاملة
│   ├── services/
│   │   └── api.ts                 # طبقة البيانات والاتصال بالواجهات الخلفية
│   ├── types/
│   │   └── index.ts               # تعريفات TypeScript الكاملة
│   ├── App.tsx                    # نقطة الدخول والموجه الرئيسي
│   ├── index.css                  # تخصيصات Tailwind 4 والخطوط والتأثيرات
│   └── main.tsx                   # ملف بدء تشغيل React
├── server.ts                      # خادم Express للواجهات الخلفية والتكامل مع Vite
├── index.html                     # الصفحة الرئيسية مع بيانات SEO و Schema JSON-LD
├── metadata.json                  # بيانات تعريف التطبيق
├── package.json                   # التبعيات والسكربتات
├── .env.example                   # نموذج متغيرات البيئة
└── README.md                      # هذا الدليل الشامل
```

---

## ⚙️ متغيرات البيئة المطلوبة (Environment Variables)

قم بإنشاء ملف `.env` في المجلد الرئيسي وانسخ المحتوى من `.env.example`:

```env
# رابط التطبيق (في Vercel يتم تعيينه تلقائياً)
APP_URL="https://your-domain.vercel.app"

# رابط قاعدة بيانات PostgreSQL الإنتاجية (Neon, Supabase, Vercel Postgres, AWS RDS)
DATABASE_URL="postgresql://username:password@ep-example.region.aws.neon.tech/neondb?sslmode=require"

# مفتاح تشفير الجلسات و JWT
AUTH_SECRET="your-super-secret-jwt-key-32-chars-minimum"

# بيانات المدير الافتراضي الأولى (يتم تشفيرها تلقائياً بـ bcrypt عند التهيئة)
ADMIN_EMAIL="admin@dhuraydan.com"
ADMIN_PASSWORD="admin123456"

# رابط خرائط Google للقاعة
NEXT_PUBLIC_MAPS_URL="https://maps.google.com/?q=15.3789,44.2014"
```

---

## 🚀 خطوات التشغيل محلياً (Local Setup)

### 1. تثبيت التبعيات
```bash
npm install
```

### 2. إعداد قاعدة بيانات PostgreSQL
يمكنك الاختيار بين طريقتين:

#### الطريقة أ: باستخدام Prisma ORM (الموصى بها)
```bash
# إنشاء ملف الترحيل وتطبيقه على قاعدة البيانات
npx prisma migrate dev --name init

# توليد عميل Prisma
npx prisma generate
```

#### الطريقة ب: باستخدام ملف SQL المباشر
```bash
# إنشاء قاعدة البيانات في PostgreSQL
psql -U postgres -c "CREATE DATABASE dhuraydan_db;"

# تطبيق مخطط الجداول
psql -U postgres -d dhuraydan_db -f db/schema.sql
```

### 3. إنشاء أول مدير للنظام (Admin User)
يحتوي النظام افتراضياً على حساب أدمن مدمج للتطوير والتجربة السريعة:
- **البريد الإلكتروني:** `admin@dhuraydan.com`
- **كلمة المرور:** `admin123456`
- **حساب عميل تجريبي:** `customer@dhuraydan.com` / `user123456`

كما يمكنك استخدام زر التبديل السريع المتاح في الشريط العلوي للمعاينة التجريبية (`عميل / مدير`).

---

## 💻 تشغيل التطبيق في بيئة التطوير (Development)

قم بتشغيل الأمر:
```bash
npm run dev
```
سيبدأ الخادم المتكامل على المنفذ `3000`:
- الواجهة العامة: `http://localhost:3000`
- لوحة الإدارة: `http://localhost:3000` (اختر "لوحة الإدارة" أو انتقل بعد تسجيل الدخول كمدير)
- واجهات API: `http://localhost:3000/api/*`

---

## 🏗️ بناء المشروع للإنتاج (Production Build)

```bash
# 1. فحص الأنواع
npm run lint

# 2. بناء الأصول الثابتة
npm run build

# 3. تشغيل الخادم للإنتاج
npm start
```

---

## 🚀 النشر على Vercel (Vercel Production Deployment)

المشروع مهيأ وجاهز 100% للنشر السحابي الفوري على **Vercel** بدون أي اعتمادية على `localhost`:

### 1. خطوات النشر عبر Vercel Dashboard أو CLI:
```bash
# تثبيت Vercel CLI في حال رغبت بالنشر من الطرفية
npm i -g vercel

# النشر
vercel --prod
```

### 2. متغيرات البيئة في لوحة تحكم Vercel (Environment Variables):
في إعدادات مشروعك على Vercel (`Project Settings > Environment Variables`)، قم بإضافة المتغيرات التالية:

| المتغير | القيمة المقترحة | الوصف |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://user:pass@host/db?sslmode=require` | رابط قاعدة بيانات PostgreSQL (Neon, Supabase, Vercel Postgres, AWS RDS) |
| `ADMIN_EMAIL` | `admin@dhuraydan.com` | البريد الإلكتروني المعتمد لمدير النظام |
| `ADMIN_PASSWORD` | `admin123456` | كلمة مرور الأدمن (تُشفر آلياً بـ PBKDF2/SHA-512) |
| `VITE_API_URL` | *(اتركه فارغاً)* | يترك فارغاً لاستخدام المسار النسبي `/api` على نفس النطاق |
| `APP_URL` | `https://your-domain.vercel.app` | رابط الموقع النهائي |

### 3. كيف تعمل الواجهة الخلفية على Vercel؟
- تستقبل Vercel دوال Serverless Functions داخل مجلد `/api`.
- تم تهيئة `vercel.json` لإعادة توجيه كافة مسارات `/api/*` بدقة واستعادة مسار الطلب الحقيقي.
- واجهات برمجة التطبيقات تدعم معايير CORS وتسمح بالـ Cookies و Session Tokens.
- في حال توفر `DATABASE_URL` يتم الاتصال بقاعدة بيانات PostgreSQL مباشرة مع إنشاء الجداول وتهيئة البذور آلياً.
- في حال عدم ربط قاعدة بيانات سحابية، يعمل النظام بسلاسة بنظام In-Memory Store فائق السرعة لمنع أي توقف أو فشل اتصال.

---

## 🐳 النشر باستخدام Docker / Cloud Run

أنشئ ملف `Dockerfile`:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["npm", "start"]
```

ثم البناء والتشغيل:
```bash
docker build -t dhuraydan-hall .
docker run -p 3000:3000 --env-file .env dhuraydan-hall
```

---

## 📞 الدعم والمعلومات

- **اسم القاعة:** قاعة ذو ريدان للأفراح والمناسبات
- **الموقع:** شارع الحصبة، جوار اللجنة الدائمة للمؤتمر الشعبي العام، صنعاء، اليمن
- **Plus Code:** `96H3+FH صنعاء، اليمن`
- **التقييم:** 4.4 / 5 (1,182 تقييم Google Maps)
- **ساعات العمل:** 24/7 على مدار الساعة
