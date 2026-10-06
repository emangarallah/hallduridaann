export type UserRole = 'ADMIN' | 'CUSTOMER';

export type AdminPermission =
  | 'MANAGE_ALL'
  | 'MANAGE_BOOKINGS'
  | 'MANAGE_CUSTOMERS'
  | 'MANAGE_SERVICES'
  | 'MANAGE_PACKAGES'
  | 'MANAGE_GALLERY'
  | 'MANAGE_REVIEWS'
  | 'MANAGE_SETTINGS'
  | 'MANAGE_USERS';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAt: string;
  avatarUrl?: string;
  isActive: boolean;
  permissions?: AdminPermission[];
}

export type EventType =
  | 'wedding' // زواج
  | 'graduation' // تخرج
  | 'conference' // مؤتمر / ندوة
  | 'family' // مناسبة عائلية
  | 'condolence' // عزاء
  | 'party' // حفلة خاصة
  | 'other'; // أخرى

export type TimeSlot =
  | 'morning' // صباحية (09:00 ص - 02:00 م)
  | 'evening' // مسائية (04:00 م - 10:30 م)
  | 'full_day'; // يوم كامل (09:00 ص - 11:00 م)

export type BookingStatus =
  | 'pending' // قيد المراجعة
  | 'confirmed' // مؤكد
  | 'rejected' // مرفوض
  | 'cancelled' // ملغي
  | 'completed'; // مكتمل

export interface HallService {
  id: string;
  name: string;
  description: string;
  price: number; // in YER (Yemeni Rial)
  priceUsd?: number;
  category: 'lighting' | 'sound' | 'decor' | 'hospitality' | 'media' | 'general';
  imageUrl: string;
  isAvailable: boolean;
  isCustomizable?: boolean;
}

export interface HallPackage {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number; // in YER
  priceUsd: number;
  badge?: string;
  features: string[];
  includedServiceIds: string[];
  imageUrl: string;
  isPopular?: boolean;
  isActive: boolean;
  guestCapacityText: string;
}

export interface BookingAddon {
  serviceId: string;
  serviceName: string;
  price: number;
}

export interface Booking {
  id: string;
  bookingCode: string; // e.g. RAYDAN-2026-0042
  userId: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventType: EventType;
  eventName?: string;
  eventDate: string; // YYYY-MM-DD
  timeSlot: TimeSlot;
  guestCount: number;
  hallSection: 'men' | 'women' | 'both';
  packageId?: string;
  packageName?: string;
  packagePrice: number;
  addons: BookingAddon[];
  totalPrice: number;
  paidAmount?: number;
  status: BookingStatus;
  notes?: string;
  adminNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  videoUrl?: string;
  category: 'weddings' | 'graduations' | 'conferences' | 'decor' | 'facilities';
  mediaType: 'image' | 'video';
  sortOrder: number;
  featured?: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  userId?: string;
  bookingId?: string;
  authorName: string;
  authorPhone?: string;
  authorAvatar?: string;
  rating: number; // 1 to 5
  comment: string;
  source: 'google' | 'verified_customer' | 'platform';
  isApproved: boolean;
  isVerified?: boolean;
  createdAt: string;
  eventType?: string;
  eventDate?: string;
}

export interface AppNotification {
  id: string;
  userId: string; // 'all_admin' or specific customer user id
  title: string;
  message: string;
  type: 'booking_created' | 'booking_confirmed' | 'booking_rejected' | 'booking_cancelled' | 'system' | 'system_alert';
  bookingId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface HallSettings {
  hallName: string;
  tagline: string;
  description: string;
  phonePrimary: string;
  phoneSecondary: string;
  whatsappNumber: string;
  email: string;
  city: string;
  address: string;
  landmark: string;
  plusCode: string;
  googleMapsUrl: string;
  workingHours: string;
  ratingScore: number;
  ratingCount: number;
  capacityMax: number;
  currency: string;
  usdExchangeRate: number; // YER per 1 USD
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroImageUrl: string;
  heroNotice?: string;
  cancellationPolicy: string;
}
