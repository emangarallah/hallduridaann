import {
  Booking,
  BookingStatus,
  EventType,
  GalleryItem,
  HallPackage,
  HallService,
  HallSettings,
  Review,
  TimeSlot,
  User,
  AppNotification
} from '../types';
import {
  initialBookings,
  initialGallery,
  initialPackages,
  initialReviews,
  initialServices,
  initialSettings,
  initialUsers,
} from '../data/seedData';
import { fetchApi } from '../utils/apiConfig';

// Storage Keys
const SETTINGS_KEY = 'rdn_settings';
const SERVICES_KEY = 'rdn_services';
const PACKAGES_KEY = 'rdn_packages';
const BOOKINGS_KEY = 'rdn_bookings';
const GALLERY_KEY = 'rdn_gallery';
const REVIEWS_KEY = 'rdn_reviews';
const USERS_KEY = 'rdn_users';
const NOTIFICATIONS_KEY = 'rdn_notifications';

function getLocal<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(item);
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Storage error:', err);
  }
}

// Initial bootstrap
export function initStore() {
  getLocal(SETTINGS_KEY, initialSettings);
  getLocal(SERVICES_KEY, initialServices);
  getLocal(PACKAGES_KEY, initialPackages);
  getLocal(BOOKINGS_KEY, initialBookings);
  getLocal(GALLERY_KEY, initialGallery);
  getLocal(REVIEWS_KEY, initialReviews);
  getLocal(USERS_KEY, initialUsers);
  getLocal(NOTIFICATIONS_KEY, [
    {
      id: 'notif_1',
      userId: 'usr_customer_1',
      title: 'تم تأكيد حجزك بنجاح!',
      message: 'تم تأكيد حجزك رقم RDN-2026-101 لمناسبة الزفاف في 15 أكتوبر 2026. مرحباً بكم في قاعة ذو ريدان.',
      type: 'booking_confirmed',
      bookingId: 'bkg_1',
      isRead: false,
      createdAt: '2026-09-11T09:15:00Z'
    },
    {
      id: 'notif_2',
      userId: 'all_admin',
      title: 'طلب حجز جديد',
      message: 'قام العميل سامي حميد المطهر بتقديم طلب حجز لحفل تخرج في تاريخ 22 أكتوبر 2026.',
      type: 'booking_created',
      bookingId: 'bkg_2',
      isRead: false,
      createdAt: '2026-09-25T16:45:00Z'
    }
  ] as AppNotification[]);
}

initStore();

// --- Settings API ---
export async function getHallSettings(): Promise<HallSettings> {
  try {
    const res = await fetchApi('/api/settings');
    if (res.ok) {
      const data = await res.json();
      setLocal(SETTINGS_KEY, data);
      return data;
    }
  } catch (e) {
    console.warn('[API] /api/settings failed, using local fallback:', e);
  }
  return getLocal<HallSettings>(SETTINGS_KEY, initialSettings);
}

export async function updateHallSettings(settings: HallSettings): Promise<HallSettings> {
  try {
    const res = await fetchApi('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
    if (res.ok) {
      const data = await res.json();
      setLocal(SETTINGS_KEY, data);
      return data;
    }
  } catch (e) {
    console.warn('[API] /api/settings update failed, using local store:', e);
  }
  setLocal(SETTINGS_KEY, settings);
  return settings;
}

// --- Services API ---
export async function getServices(): Promise<HallService[]> {
  try {
    const res = await fetchApi('/api/services');
    if (res.ok) {
      const data = await res.json();
      setLocal(SERVICES_KEY, data);
      return data;
    }
  } catch (e) {
    console.warn('[API] /api/services failed, using local fallback:', e);
  }
  return getLocal<HallService[]>(SERVICES_KEY, initialServices);
}

export async function createService(data: Omit<HallService, 'id'>): Promise<HallService> {
  try {
    const res = await fetchApi('/api/admin/services', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (res.ok) {
      const result = await res.json();
      const newService = result.service || result;
      const list = await getServices();
      list.unshift(newService);
      setLocal(SERVICES_KEY, list);
      return newService;
    }
  } catch (e) {
    console.warn('[API] /api/admin/services create failed, using local store:', e);
  }
  const list = await getServices();
  const newService: HallService = {
    ...data,
    id: `srv_${Date.now()}`
  };
  list.unshift(newService);
  setLocal(SERVICES_KEY, list);
  return newService;
}

export async function updateService(id: string, updates: Partial<HallService>): Promise<HallService> {
  const list = await getServices();
  const index = list.findIndex(s => s.id === id);
  if (index === -1) throw new Error('الخدمة غير موجودة');
  list[index] = { ...list[index], ...updates };
  setLocal(SERVICES_KEY, list);
  return list[index];
}

export async function deleteService(id: string): Promise<boolean> {
  try {
    await fetchApi(`/api/admin/services/${id}`, { method: 'DELETE' });
  } catch (e) {
    console.warn('[API] /api/admin/services delete failed:', e);
  }
  const list = await getServices();
  const filtered = list.filter(s => s.id !== id);
  setLocal(SERVICES_KEY, filtered);
  return true;
}

// --- Packages API ---
export async function getPackages(): Promise<HallPackage[]> {
  try {
    const res = await fetchApi('/api/packages');
    if (res.ok) {
      const data = await res.json();
      setLocal(PACKAGES_KEY, data);
      return data;
    }
  } catch (e) {
    console.warn('[API] /api/packages failed, using local fallback:', e);
  }
  return getLocal<HallPackage[]>(PACKAGES_KEY, initialPackages);
}

export async function createPackage(data: Omit<HallPackage, 'id'>): Promise<HallPackage> {
  try {
    const res = await fetchApi('/api/admin/packages', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (res.ok) {
      const result = await res.json();
      const newPkg = result.package || result;
      const list = await getPackages();
      list.push(newPkg);
      setLocal(PACKAGES_KEY, list);
      return newPkg;
    }
  } catch (e) {
    console.warn('[API] /api/admin/packages failed, using local store:', e);
  }
  const list = await getPackages();
  const newPkg: HallPackage = {
    ...data,
    id: `pkg_${Date.now()}`
  };
  list.push(newPkg);
  setLocal(PACKAGES_KEY, list);
  return newPkg;
}

export async function updatePackage(id: string, updates: Partial<HallPackage>): Promise<HallPackage> {
  const list = await getPackages();
  const index = list.findIndex(p => p.id === id);
  if (index === -1) throw new Error('الباقة غير موجودة');
  list[index] = { ...list[index], ...updates };
  setLocal(PACKAGES_KEY, list);
  return list[index];
}

export async function deletePackage(id: string): Promise<boolean> {
  try {
    await fetchApi(`/api/admin/packages/${id}`, { method: 'DELETE' });
  } catch (e) {
    console.warn('[API] /api/admin/packages delete failed:', e);
  }
  const list = await getPackages();
  const filtered = list.filter(p => p.id !== id);
  setLocal(PACKAGES_KEY, filtered);
  return true;
}

// --- Bookings API & Conflict Prevention ---
export async function getBookings(): Promise<Booking[]> {
  try {
    const res = await fetchApi('/api/bookings');
    if (res.ok) {
      const data = await res.json();
      setLocal(BOOKINGS_KEY, data);
      return data;
    }
  } catch (e) {
    console.warn('[API] /api/bookings failed, using local store:', e);
  }
  return getLocal<Booking[]>(BOOKINGS_KEY, initialBookings);
}

export async function getBookingById(id: string): Promise<Booking | null> {
  const bookings = await getBookings();
  return bookings.find(b => b.id === id || b.bookingCode === id) || null;
}

export async function checkBookingConflict(
  eventDate: string,
  timeSlot: TimeSlot,
  hallSection: 'men' | 'women' | 'both',
  excludeBookingId?: string
): Promise<{ hasConflict: boolean; conflictingBooking?: Booking; message?: string }> {
  try {
    const query = new URLSearchParams({
      eventDate,
      timeSlot,
      ...(excludeBookingId ? { excludeBookingId } : {})
    });
    const res = await fetchApi(`/api/bookings/conflict?${query.toString()}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('[API] check conflict failed, verifying locally:', e);
  }

  const bookings = await getBookings();
  const activeBookingsOnDate = bookings.filter(b => {
    if (excludeBookingId && b.id === excludeBookingId) return false;
    if (b.status !== 'confirmed') return false;
    return b.eventDate === eventDate;
  });

  for (const existing of activeBookingsOnDate) {
    const isFullDay = existing.timeSlot === 'full_day' || timeSlot === 'full_day';
    const isSameSlot = existing.timeSlot === timeSlot;

    if (isFullDay || isSameSlot) {
      if (
        existing.hallSection === 'both' ||
        hallSection === 'both' ||
        existing.hallSection === hallSection
      ) {
        return {
          hasConflict: true,
          conflictingBooking: existing,
          message: `عذراً، التاريخ ${eventDate} في الفترة (${timeSlot === 'morning' ? 'صباحية' : timeSlot === 'evening' ? 'مسائية' : 'يوم كامل'}) محجوز ومؤكد بالفعل لمناسبة أخرى. يرجى اختيار تاريخ أو فترة أخرى.`
        };
      }
    }
  }

  return { hasConflict: false };
}

export async function createBooking(data: Omit<Booking, 'id' | 'bookingCode' | 'createdAt' | 'status'>): Promise<Booking> {
  const conflictCheck = await checkBookingConflict(data.eventDate, data.timeSlot, data.hallSection);
  if (conflictCheck.hasConflict) {
    throw new Error(conflictCheck.message || 'الموعد محجوز مسبقاً، يرجى اختيار موعد آخر');
  }

  try {
    const res = await fetchApi('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (res.ok) {
      const newBooking = await res.json();
      const list = await getBookings();
      list.unshift(newBooking);
      setLocal(BOOKINGS_KEY, list);
      return newBooking;
    } else {
      const err = await res.json().catch(() => ({}));
      if (err.error) throw new Error(err.error);
    }
  } catch (err: any) {
    if (err.message && err.message.includes('محجوز')) throw err;
    console.warn('[API] /api/bookings failed, creating locally:', err);
  }

  const bookings = await getBookings();
  const count = bookings.length + 101;
  const newBooking: Booking = {
    ...data,
    id: `bkg_${Date.now()}`,
    bookingCode: `RDN-2026-${count}`,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  bookings.unshift(newBooking);
  setLocal(BOOKINGS_KEY, bookings);

  await addNotification({
    userId: 'all_admin',
    title: 'طلب حجز جديد بقاعة ذو ريدان',
    message: `قام العميل ${newBooking.customerName} بطلب حجز جديد بتاريخ ${newBooking.eventDate}.`,
    type: 'booking_created',
    bookingId: newBooking.id
  });

  return newBooking;
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
  adminNotes?: string,
  rejectionReason?: string
): Promise<Booking> {
  const actualReason = rejectionReason || adminNotes;
  try {
    const res = await fetchApi(`/api/admin/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, rejectionReason: actualReason, adminNotes })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'غير مصرح (403 Forbidden)');
    }
  } catch (e: any) {
    if (e.message && e.message.includes('403')) throw e;
  }

  const bookings = await getBookings();
  const index = bookings.findIndex(b => b.id === id);
  if (index === -1) throw new Error('الحجز غير موجود');

  bookings[index].status = status;
  if (actualReason) bookings[index].rejectionReason = actualReason;
  if (adminNotes) bookings[index].adminNotes = adminNotes;
  bookings[index].updatedAt = new Date().toISOString();
  setLocal(BOOKINGS_KEY, bookings);

  const targetUserId = bookings[index].customerId || bookings[index].userId;
  if (targetUserId) {
    await addNotification({
      userId: targetUserId,
      title: status === 'confirmed' ? 'تم تأكيد حجزك في قاعة ذو ريدان!' : status === 'rejected' ? 'تحديث بخصوص طلب الحجز' : 'تحديث حالة الحجز',
      message: status === 'confirmed'
        ? `تم تأكيد حجزك رقم (${bookings[index].bookingCode}) بنجاح.`
        : status === 'rejected'
        ? `نعتذر منك، تم رفض طلب الحجز رقم (${bookings[index].bookingCode}). سبب الرفض: ${actualReason || 'عدم توفر الموعد'}`
        : `تم تغيير حالة حجزك رقم (${bookings[index].bookingCode}) إلى ${status}.`,
      type: status === 'confirmed' ? 'booking_confirmed' : status === 'rejected' ? 'booking_rejected' : 'system',
      bookingId: id
    });
  }

  return bookings[index];
}

export async function cancelBooking(id: string, userId?: string): Promise<Booking> {
  return updateBookingStatus(id, 'cancelled', undefined, 'تم الإلغاء بواسطة العميل');
}

// --- Reviews API ---
export async function getReviews(approvedOnly = true): Promise<Review[]> {
  try {
    const res = await fetchApi(`/api/reviews?approved=${approvedOnly}`);
    if (res.ok) {
      const data = await res.json();
      setLocal(REVIEWS_KEY, data);
      return data;
    }
  } catch (e) {
    console.warn('[API] /api/reviews failed, using local store:', e);
  }
  const list = getLocal<Review[]>(REVIEWS_KEY, initialReviews);
  return approvedOnly ? list.filter(r => r.isApproved) : list;
}

export async function submitReview(data: Omit<Review, 'id' | 'createdAt' | 'isApproved' | 'source'>): Promise<Review> {
  try {
    const res = await fetchApi('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (res.ok) {
      const newRev = await res.json();
      const list = await getReviews(false);
      list.unshift(newRev);
      setLocal(REVIEWS_KEY, list);
      return newRev;
    }
  } catch (e) {
    console.warn('[API] /api/reviews submit failed:', e);
  }

  const list = await getReviews(false);
  const newRev: Review = {
    id: `rev_${Date.now()}`,
    ...data,
    source: 'verified_customer',
    isApproved: true,
    createdAt: new Date().toISOString()
  };
  list.unshift(newRev);
  setLocal(REVIEWS_KEY, list);
  return newRev;
}

export async function toggleReviewApproval(id: string, isApproved: boolean): Promise<Review> {
  try {
    await fetchApi(`/api/admin/reviews/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isApproved })
    });
  } catch (e) {
    console.warn('[API] review status toggle failed:', e);
  }
  const list = getLocal<Review[]>(REVIEWS_KEY, initialReviews);
  const index = list.findIndex(r => r.id === id);
  if (index === -1) throw new Error('التقييم غير موجود');
  list[index].isApproved = isApproved;
  setLocal(REVIEWS_KEY, list);
  return list[index];
}

export async function deleteReview(id: string): Promise<boolean> {
  try {
    await fetchApi(`/api/admin/reviews/${id}`, { method: 'DELETE' });
  } catch (e) {
    console.warn('[API] delete review failed:', e);
  }
  const list = getLocal<Review[]>(REVIEWS_KEY, initialReviews);
  const filtered = list.filter(r => r.id !== id);
  setLocal(REVIEWS_KEY, filtered);
  return true;
}

// --- Gallery API ---
export async function getGallery(): Promise<GalleryItem[]> {
  try {
    const res = await fetchApi('/api/gallery');
    if (res.ok) {
      const data = await res.json();
      setLocal(GALLERY_KEY, data);
      return data;
    }
  } catch (e) {
    console.warn('[API] /api/gallery failed, using local store:', e);
  }
  const list = getLocal<GalleryItem[]>(GALLERY_KEY, initialGallery);
  return list.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createGalleryItem(data: Omit<GalleryItem, 'id' | 'createdAt'>): Promise<GalleryItem> {
  try {
    const res = await fetchApi('/api/admin/gallery', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (res.ok) {
      const result = await res.json();
      const newItem = result.item || result;
      const list = await getGallery();
      list.push(newItem);
      setLocal(GALLERY_KEY, list);
      return newItem;
    }
  } catch (e) {
    console.warn('[API] create gallery failed:', e);
  }
  const list = await getGallery();
  const newItem: GalleryItem = {
    ...data,
    id: `gal_${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  list.push(newItem);
  setLocal(GALLERY_KEY, list);
  return newItem;
}

export async function updateGalleryItem(id: string, updates: Partial<GalleryItem>): Promise<GalleryItem> {
  const list = await getGallery();
  const index = list.findIndex(g => g.id === id);
  if (index === -1) throw new Error('عنصر المعرض غير موجود');
  list[index] = { ...list[index], ...updates };
  setLocal(GALLERY_KEY, list);
  return list[index];
}

export async function deleteGalleryItem(id: string): Promise<boolean> {
  try {
    await fetchApi(`/api/admin/gallery/${id}`, { method: 'DELETE' });
  } catch (e) {
    console.warn('[API] delete gallery failed:', e);
  }
  const list = await getGallery();
  const filtered = list.filter(g => g.id !== id);
  setLocal(GALLERY_KEY, filtered);
  return true;
}

// --- Customers & Users API ---
export async function getUsers(): Promise<User[]> {
  try {
    const res = await fetchApi('/api/admin/users');
    if (res.ok) {
      const data = await res.json();
      const users = data.users || data.customers || data;
      setLocal(USERS_KEY, users);
      return users;
    }
    const fallbackRes = await fetchApi('/api/admin/customers');
    if (fallbackRes.ok) {
      const data = await fallbackRes.json();
      const customers = data.customers || data;
      setLocal(USERS_KEY, customers);
      return customers;
    }
  } catch (e) {
    console.warn('[API] /api/admin/users failed, using local store:', e);
  }
  return getLocal<User[]>(USERS_KEY, initialUsers);
}

export async function toggleUserStatus(id: string): Promise<User> {
  try {
    const res = await fetchApi(`/api/admin/users/${id}/status`, { method: 'PATCH' });
    if (res.ok) {
      const data = await res.json();
      return data.user || data;
    }
    const fallbackRes = await fetchApi(`/api/admin/customers/${id}/status`, { method: 'PATCH' });
    if (fallbackRes.ok) {
      const data = await fallbackRes.json();
      return data.user || data;
    }
  } catch (e) {
    console.warn('[API] user status toggle failed:', e);
  }
  const list = await getUsers();
  const index = list.findIndex(u => u.id === id);
  if (index === -1) throw new Error('المستخدم غير موجود');
  list[index].isActive = !list[index].isActive;
  setLocal(USERS_KEY, list);
  return list[index];
}

export async function updateUserRole(id: string, role: 'ADMIN' | 'CUSTOMER'): Promise<User> {
  try {
    const res = await fetchApi(`/api/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    });
    if (res.ok) {
      const data = await res.json();
      return data.user || data;
    }
  } catch (e) {
    console.warn('[API] user role update failed:', e);
  }
  const list = await getUsers();
  const index = list.findIndex(u => u.id === id);
  if (index === -1) throw new Error('المستخدم غير موجود');
  list[index].role = role;
  setLocal(USERS_KEY, list);
  return list[index];
}

// --- Notifications API ---
export async function getNotifications(userId: string, isAdmin = false): Promise<AppNotification[]> {
  try {
    const res = await fetchApi('/api/notifications');
    if (res.ok) {
      const data = await res.json();
      setLocal(NOTIFICATIONS_KEY, data);
      return data;
    }
  } catch (e) {
    console.warn('[API] notifications failed:', e);
  }
  const list = getLocal<AppNotification[]>(NOTIFICATIONS_KEY, []);
  if (isAdmin) {
    return list.filter(n => n.userId === 'all_admin' || n.userId === userId);
  }
  return list.filter(n => n.userId === userId);
}

export async function addNotification(data: Omit<AppNotification, 'id' | 'isRead' | 'createdAt'>): Promise<AppNotification> {
  const list = getLocal<AppNotification[]>(NOTIFICATIONS_KEY, []);
  const newNotif: AppNotification = {
    ...data,
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    isRead: false,
    createdAt: new Date().toISOString()
  };
  list.unshift(newNotif);
  setLocal(NOTIFICATIONS_KEY, list);
  return newNotif;
}

export async function markNotificationRead(id: string): Promise<void> {
  try {
    await fetchApi(`/api/notifications/${id}/read`, { method: 'PATCH' });
  } catch {}
  const list = getLocal<AppNotification[]>(NOTIFICATIONS_KEY, []);
  const index = list.findIndex(n => n.id === id);
  if (index !== -1) {
    list[index].isRead = true;
    setLocal(NOTIFICATIONS_KEY, list);
  }
}

export async function markAllNotificationsRead(userId: string, isAdmin = false): Promise<void> {
  const list = getLocal<AppNotification[]>(NOTIFICATIONS_KEY, []);
  list.forEach(n => {
    if (isAdmin && (n.userId === 'all_admin' || n.userId === userId)) {
      n.isRead = true;
    } else if (n.userId === userId) {
      n.isRead = true;
    }
  });
  setLocal(NOTIFICATIONS_KEY, list);
}

// --- Dashboard Statistics ---
export async function getDashboardStats() {
  try {
    const res = await fetchApi('/api/admin/stats');
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('[API] /api/admin/stats failed:', e);
  }

  const bookings = await getBookings();
  const services = await getServices();
  const packages = await getPackages();
  const users = await getUsers();
  const reviews = await getReviews(false);

  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
  const completedBookings = bookings.filter(b => b.status === 'completed').length;
  const rejectedBookings = bookings.filter(b => b.status === 'rejected').length;
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;

  const totalRevenue = bookings
    .filter(b => b.status === 'confirmed' || b.status === 'completed')
    .reduce((acc, curr) => acc + curr.totalPrice, 0);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '4.4';

  return {
    totalBookings,
    pendingBookings,
    confirmedBookings,
    completedBookings,
    rejectedBookings,
    cancelledBookings,
    totalRevenue,
    customersCount: users.filter(u => u.role === 'CUSTOMER').length,
    servicesCount: services.length,
    packagesCount: packages.length,
    reviewsCount: reviews.length,
    averageRating: parseFloat(avgRating),
  };
}
