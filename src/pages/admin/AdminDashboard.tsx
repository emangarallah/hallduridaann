import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  CalendarCheck,
  Users,
  Layers,
  Package,
  Image as ImageIcon,
  Star,
  Settings,
  Bell,
  LogOut,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Sparkles,
  Plus,
  Trash2,
  Edit,
  Eye,
  Check,
  X,
  Printer,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Menu,
  Download,
  FileText
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Booking,
  BookingStatus,
  GalleryItem,
  HallPackage,
  HallService,
  HallSettings,
  Review,
  User
} from '../../types';
import {
  createGalleryItem,
  createPackage,
  createService,
  deleteGalleryItem,
  deletePackage,
  deleteReview,
  deleteService,
  getBookings,
  getDashboardStats,
  getGallery,
  getHallSettings,
  getPackages,
  getReviews,
  getServices,
  getUsers,
  toggleReviewApproval,
  toggleUserStatus,
  updateUserRole,
  updateBookingStatus,
  updateHallSettings,
  updatePackage,
  updateService
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface AdminDashboardProps {
  onOpenBookingDetails: (booking: Booking) => void;
  setCurrentTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onOpenBookingDetails,
  setCurrentTab,
}) => {
  const { user, logout } = useAuth();
  
  // Navigation tabs inside Admin - initialized from URL path (e.g. /admin/bookings)
  const getInitialAdminTab = (): 'overview' | 'bookings' | 'calendar' | 'customers' | 'services' | 'packages' | 'gallery' | 'reviews' | 'settings' => {
    const p = window.location.pathname;
    if (p === '/admin/dashboard' || p === '/admin') return 'overview';
    if (p === '/admin/bookings') return 'bookings';
    if (p === '/admin/calendar') return 'calendar';
    if (p === '/admin/customers' || p === '/admin/users') return 'customers';
    if (p === '/admin/services') return 'services';
    if (p === '/admin/packages') return 'packages';
    if (p === '/admin/gallery') return 'gallery';
    if (p === '/admin/reviews') return 'reviews';
    if (p === '/admin/settings') return 'settings';
    return 'overview';
  };

  const [adminTab, setAdminTab] = useState<
    'overview' | 'bookings' | 'calendar' | 'customers' | 'services' | 'packages' | 'gallery' | 'reviews' | 'settings'
  >(getInitialAdminTab);

  const handleSwitchAdminTab = (tabId: 'overview' | 'bookings' | 'calendar' | 'customers' | 'services' | 'packages' | 'gallery' | 'reviews' | 'settings') => {
    setAdminTab(tabId);
    const targetUrl = tabId === 'overview' ? '/admin/dashboard' : `/admin/${tabId}`;
    if (window.location.pathname !== targetUrl) {
      window.history.pushState(null, '', targetUrl);
    }
  };

  useEffect(() => {
    const handlePop = () => {
      setAdminTab(getInitialAdminTab());
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Data States
  const [stats, setStats] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<HallService[]>([]);
  const [packages, setPackages] = useState<HallPackage[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'CUSTOMER' | 'ADMIN'>('all');
  const [userSearch, setUserSearch] = useState('');
  const [settings, setSettings] = useState<HallSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Bookings Filter
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('all');
  const [bookingSearch, setBookingSearch] = useState('');
  
  // Rejection modal
  const [rejectingBooking, setRejectingBooking] = useState<Booking | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Modals for adding items
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showAddPackageModal, setShowAddPackageModal] = useState(false);
  const [showAddGalleryModal, setShowAddGalleryModal] = useState(false);

  // New Service Form
  const [newSrvName, setNewSrvName] = useState('');
  const [newSrvDesc, setNewSrvDesc] = useState('');
  const [newSrvPrice, setNewSrvPrice] = useState<number>(150000);
  const [newSrvCat, setNewSrvCat] = useState<'lighting' | 'sound' | 'decor' | 'hospitality' | 'media' | 'general'>('decor');
  const [newSrvImg, setNewSrvImg] = useState('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80');

  // New Package Form
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgDesc, setNewPkgDesc] = useState('');
  const [newPkgPrice, setNewPkgPrice] = useState<number>(1000000);
  const [newPkgCapacity, setNewPkgCapacity] = useState('تتسع حتى 800 ضيف');
  const [newPkgBadge, setNewPkgBadge] = useState('');
  const [newPkgImg, setNewPkgImg] = useState('https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80');

  // New Gallery Item Form
  const [newGalTitle, setNewGalTitle] = useState('');
  const [newGalDesc, setNewGalDesc] = useState('');
  const [newGalUrl, setNewGalUrl] = useState('');
  const [newGalCat, setNewGalCat] = useState<'weddings' | 'graduations' | 'conferences' | 'decor' | 'facilities'>('weddings');

  // Calendar month state
  const [calDate, setCalDate] = useState(new Date(2026, 9, 1)); // October 2026 default

  // Settings form
  const [settingsForm, setSettingsForm] = useState<HallSettings | null>(null);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [sData, bData, srvData, pkgData, gData, rData, uData, settData] = await Promise.all([
        getDashboardStats(),
        getBookings(),
        getServices(),
        getPackages(),
        getGallery(),
        getReviews(false),
        getUsers(),
        getHallSettings(),
      ]);
      setStats(sData);
      setBookings(bData);
      setServices(srvData);
      setPackages(pkgData);
      setGallery(gData);
      setReviews(rData);
      setCustomers(uData);
      setSettings(settData);
      setSettingsForm(settData);
    } finally {
      setLoading(false);
    }
  };

  // Status updates
  const handleUpdateStatus = async (
    bookingId: string,
    status: BookingStatus,
    reason?: string
  ) => {
    try {
      await updateBookingStatus(bookingId, status, undefined, reason);
      const bList = await getBookings();
      setBookings(bList);
      const st = await getDashboardStats();
      setStats(st);
      if (rejectingBooking) {
        setRejectingBooking(null);
        setRejectionReason('');
      }
    } catch (err: any) {
      alert(err.message || 'فشل تحديث حالة الحجز');
    }
  };

  // Service Actions
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSrvName) return;
    await createService({
      name: newSrvName,
      description: newSrvDesc,
      price: newSrvPrice,
      category: newSrvCat,
      imageUrl: newSrvImg,
      isAvailable: true,
    });
    setShowAddServiceModal(false);
    setServices(await getServices());
    setNewSrvName('');
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الخدمة؟')) return;
    await deleteService(id);
    setServices(await getServices());
  };

  // Package Actions
  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPkgName) return;
    await createPackage({
      name: newPkgName,
      slug: newPkgName.toLowerCase().replace(/\s+/g, '-'),
      description: newPkgDesc,
      price: newPkgPrice,
      priceUsd: Math.round(newPkgPrice / 535),
      badge: newPkgBadge || undefined,
      features: ['حجز القاعة وتجهيز الطاولات', 'إضاءة وصوت متكامل', 'تكييف مركزي متواصل'],
      includedServiceIds: [],
      imageUrl: newPkgImg,
      isActive: true,
      guestCapacityText: newPkgCapacity,
    });
    setShowAddPackageModal(false);
    setPackages(await getPackages());
    setNewPkgName('');
  };

  const handleDeletePackage = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الباقة؟')) return;
    await deletePackage(id);
    setPackages(await getPackages());
  };

  // Gallery Actions
  const handleCreateGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGalTitle || !newGalUrl) return;
    await createGalleryItem({
      title: newGalTitle,
      description: newGalDesc,
      imageUrl: newGalUrl,
      category: newGalCat,
      mediaType: 'image',
      sortOrder: gallery.length + 1,
    });
    setShowAddGalleryModal(false);
    setGallery(await getGallery());
    setNewGalTitle('');
    setNewGalUrl('');
  };

  const handleDeleteGallery = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العنصر؟')) return;
    await deleteGalleryItem(id);
    setGallery(await getGallery());
  };

  // Review Actions
  const handleToggleReview = async (id: string, currentStatus: boolean) => {
    await toggleReviewApproval(id, !currentStatus);
    setReviews(await getReviews(false));
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('هل تريد حذف هذا التقييم؟')) return;
    await deleteReview(id);
    setReviews(await getReviews(false));
  };

  // User Actions
  const handleToggleCustomer = async (id: string) => {
    await toggleUserStatus(id);
    const uList = await getUsers();
    setCustomers(uList);
  };

  const handleToggleUserRole = async (id: string, currentRole: 'ADMIN' | 'CUSTOMER') => {
    const newRole = currentRole === 'ADMIN' ? 'CUSTOMER' : 'ADMIN';
    const confirmMsg =
      newRole === 'ADMIN'
        ? 'هل أنت متأكد من ترقية هذا المستخدم إلى مدير نظام (ADMIN) بكامل الصلاحيات؟'
        : 'هل أنت متأكد من تغيير دور هذا المستخدم إلى عميل (CUSTOMER)؟';
    if (!window.confirm(confirmMsg)) return;
    await updateUserRole(id, newRole);
    const uList = await getUsers();
    setCustomers(uList);
  };

  // Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsForm) return;
    await updateHallSettings(settingsForm);
    setSettings(settingsForm);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  // Filter Bookings
  const filteredBookings = bookings.filter((b) => {
    const matchStatus =
      bookingStatusFilter === 'all' || b.status === bookingStatusFilter;
    const matchSearch =
      b.customerName.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.bookingCode.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.customerPhone.includes(bookingSearch);
    return matchStatus && matchSearch;
  });

  // Export Bookings Table to PDF
  const handleExportBookingsPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      // Title & Header
      doc.setFontSize(16);
      doc.setTextColor(217, 119, 6); // amber-600
      doc.text('Dhu Raydan Hall - Bookings Report', 14, 15);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Generated: ${new Date().toLocaleString()} | Total Bookings: ${filteredBookings.length}`,
        14,
        22
      );

      const tableData = filteredBookings.map((b) => [
        b.bookingCode,
        b.customerName,
        b.customerPhone,
        b.eventDate,
        b.timeSlot === 'evening' ? 'Evening (مسائية)' : b.timeSlot === 'morning' ? 'Morning (صباحية)' : 'Full Day (يوم كامل)',
        b.packageName || 'Basic',
        b.guestCount ? `${b.guestCount}` : '-',
        `${Number(b.totalPrice).toLocaleString()} YER`,
        b.status.toUpperCase()
      ]);

      autoTable(doc, {
        head: [['Code', 'Customer Name', 'Phone', 'Event Date', 'Slot', 'Package', 'Guests', 'Total Price', 'Status']],
        body: tableData,
        startY: 26,
        theme: 'grid',
        headStyles: {
          fillColor: [217, 119, 6],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        }
      });

      doc.save(`DhuRaydan_Bookings_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err: any) {
      console.error('Failed to export PDF:', err);
      alert('حدث خطأ أثناء تصدير ملف PDF: ' + (err?.message || ''));
    }
  };

  const sidebarItems = [
    { id: 'overview', label: 'لوحة الإحصائيات', icon: LayoutDashboard },
    { id: 'bookings', label: 'إدارة الحجوزات', icon: CalendarCheck, badge: stats?.pendingBookings },
    { id: 'calendar', label: 'تقويم الحجوزات', icon: CalendarDays },
    { id: 'customers', label: 'المستخدمون والأدوار', icon: Users },
    { id: 'services', label: 'إدارة الخدمات', icon: Layers },
    { id: 'packages', label: 'إدارة الباقات', icon: Package },
    { id: 'gallery', label: 'معرض الصور', icon: ImageIcon },
    { id: 'reviews', label: 'إدارة التقييمات', icon: Star },
    { id: 'settings', label: 'إعدادات الموقع (CMS)', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#090b10] flex flex-col md:flex-row">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-[#121622] p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-white text-sm">لوحة إدارة قاعة ذو ريدان</span>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 rounded-lg bg-slate-800 text-white"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Admin Sidebar */}
      <aside
        className={`w-full md:w-64 bg-[#0d1017] border-l border-slate-800 flex flex-col justify-between shrink-0 ${
          mobileSidebarOpen ? 'block' : 'hidden md:flex'
        }`}
      >
        <div className="p-5 space-y-6">
          <div className="hidden md:flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-black flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">إدارة قاعة ذو ريدان</h2>
              <span className="text-[11px] text-amber-400">لوحة التحكم المركزية</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    handleSwitchAdminTab(item.id as any);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    adminTab === item.id
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-[#141a27]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                        adminTab === item.id ? 'bg-black text-amber-400' : 'bg-amber-500 text-black'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 space-y-2">
          <button
            onClick={() => setCurrentTab('home')}
            className="w-full py-2 px-3 rounded-xl bg-[#141a27] hover:bg-[#1c2436] text-amber-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <span>زيارة الموقع كزائر</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={logout}
            className="w-full py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
        
        {/* TAB 1: OVERVIEW & STATS */}
        {adminTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-serif-ar">
                مؤشرات أداء قاعة ذو ريدان
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                نظرة شاملة على الحجوزات، الإيرادات، العملاء وحالة الطلبات
              </p>
            </div>

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#121622] border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>إجمالي الحجوزات</span>
                  <CalendarCheck className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                  {stats?.totalBookings || 0}
                </div>
                <span className="text-[11px] text-amber-400/90 mt-1 block">
                  {stats?.pendingBookings || 0} طلب قيد المراجعة
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-[#121622] border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>الحجوزات المؤكدة</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                  {stats?.confirmedBookings || 0}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  مواعيد معتمدة ومثبتة
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-[#121622] border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>إجمالي الإيرادات المؤكدة</span>
                  <DollarSign className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                  {stats?.totalRevenue ? stats.totalRevenue.toLocaleString('ar-YE') : 0}
                  <span className="text-xs text-slate-400 mr-1 font-sans">ريال</span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  (~${Math.round((stats?.totalRevenue || 0) / 535).toLocaleString()} دولار)
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-[#121622] border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>التقييم والعملاء</span>
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                  {settings?.ratingScore || 4.4}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {stats?.customersCount || 0} عميل مسجل · 1,182 تقييم
                </span>
              </div>
            </div>

            {/* Quick Actions & Recent Pending Bookings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white font-serif-ar">
                  الطلبات الجديدة بانتظار الاعتماد ({stats?.pendingBookings || 0})
                </h3>
                <button
                  onClick={() => setAdminTab('bookings')}
                  className="text-xs text-amber-400 hover:underline"
                >
                  عرض جميع الحجوزات
                </button>
              </div>

              <div className="space-y-3">
                {bookings
                  .filter((b) => b.status === 'pending')
                  .slice(0, 3)
                  .map((booking) => (
                    <div
                      key={booking.id}
                      className="p-4 rounded-2xl bg-[#121622] border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400 text-xs">
                            {booking.bookingCode}
                          </span>
                          <span className="text-white text-xs font-bold">
                            {booking.customerName}
                          </span>
                          <span className="text-slate-400 text-xs font-mono" dir="ltr">
                            {booking.customerPhone}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">
                          {booking.packageName} · التاريخ:{' '}
                          <strong className="text-white">{booking.eventDate}</strong> ({booking.timeSlot}) · {booking.guestCount} ضيف
                        </p>
                      </div>

                      <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                        <button
                          onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-1 shadow"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>قبول وتأكيد</span>
                        </button>
                        <button
                          onClick={() => setRejectingBooking(booking)}
                          className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-semibold"
                        >
                          رفض الطلب
                        </button>
                        <button
                          onClick={() => onOpenBookingDetails(booking)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white"
                          title="تفاصيل الحجز"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                {bookings.filter((b) => b.status === 'pending').length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-xs bg-[#121622] rounded-2xl border border-slate-800">
                    لا توجد طلبات حجز معلقة حالياً. جميع الطلبات تم البت فيها.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BOOKINGS MANAGEMENT */}
        {adminTab === 'bookings' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white font-serif-ar">
                  إدارة حجوزات القاعة
                </h2>
                <p className="text-xs text-slate-400">
                  عرض وتأكيد وإلغاء وتعديل الحجوزات مع منع التعارض التلقائي
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                <button
                  onClick={handleExportBookingsPDF}
                  className="px-4 py-2 rounded-xl bg-[#161c2b] hover:bg-[#1e263a] text-amber-300 border border-amber-500/30 text-xs font-bold shadow flex items-center gap-1.5 transition-all"
                  title="تصدير جدول الحجوزات الحالي إلى ملف PDF رسمي"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>تصدير تقرير (PDF)</span>
                </button>

                <button
                  onClick={() => setCurrentTab('booking')}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة حجز يدوي مباشر</span>
                </button>
              </div>
            </div>

            {/* Search & Filter Tabs */}
            <div className="bg-[#121622] p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:w-72">
                <input
                  type="text"
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  placeholder="ابحث بالاسم، الكود، أو الهاتف..."
                  className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl py-2 px-3 pl-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto text-xs pb-1 md:pb-0">
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'pending', label: 'المعلقة' },
                  { id: 'confirmed', label: 'المؤكدة' },
                  { id: 'completed', label: 'المكتملة' },
                  { id: 'rejected', label: 'المرفوضة' },
                  { id: 'cancelled', label: 'الملغية' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setBookingStatusFilter(st.id)}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold transition-colors ${
                      bookingStatusFilter === st.id
                        ? 'bg-amber-500 text-black'
                        : 'bg-[#0a0d14] text-slate-300 hover:text-white'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-[#121622] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#161c2b] text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3.5 font-bold">رقم الحجز</th>
                      <th className="p-3.5 font-bold">العميل والهاتف</th>
                      <th className="p-3.5 font-bold">المناسبة</th>
                      <th className="p-3.5 font-bold">التاريخ والفترة</th>
                      <th className="p-3.5 font-bold">الباقة والتكلفة</th>
                      <th className="p-3.5 font-bold">الحالة</th>
                      <th className="p-3.5 font-bold text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-[#151a27] transition-colors">
                        <td className="p-3.5 font-mono font-bold text-amber-400">
                          {b.bookingCode}
                        </td>
                        <td className="p-3.5">
                          <p className="font-bold text-white">{b.customerName}</p>
                          <span className="text-[11px] text-slate-400 font-mono" dir="ltr">
                            {b.customerPhone}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-300">
                          {b.eventType} · {b.guestCount} ضيف
                        </td>
                        <td className="p-3.5">
                          <span className="font-mono text-white font-bold">{b.eventDate}</span>
                          <span className="text-[11px] text-amber-300 block">
                            {b.timeSlot === 'morning' ? 'صباحية' : b.timeSlot === 'evening' ? 'مسائية' : 'يوم كامل'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="text-slate-200 block">{b.packageName}</span>
                          <span className="font-mono font-bold text-amber-400">
                            {b.totalPrice?.toLocaleString('ar-YE')} ريال
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              b.status === 'confirmed'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : b.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : b.status === 'completed'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {b.status === 'confirmed' && 'مؤكد'}
                            {b.status === 'pending' && 'معلق'}
                            {b.status === 'completed' && 'مكتمل'}
                            {b.status === 'rejected' && 'مرفوض'}
                            {b.status === 'cancelled' && 'ملغي'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onOpenBookingDetails(b)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                              title="عرض التفاصيل والسند"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {b.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(b.id, 'confirmed')}
                                  className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black transition-colors"
                                  title="قبول وتأكيد الحجز"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setRejectingBooking(b)}
                                  className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition-colors"
                                  title="رفض الحجز"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            {b.status === 'confirmed' && (
                              <button
                                onClick={() => handleUpdateStatus(b.id, 'completed')}
                                className="px-2 py-1 rounded bg-blue-500/20 text-blue-300 hover:bg-blue-500 hover:text-white text-[10px] font-bold"
                              >
                                اكتمال المناسبة
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CALENDAR VIEW */}
        {adminTab === 'calendar' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white font-serif-ar">
                  تقويم حجوزات القاعة
                </h2>
                <p className="text-xs text-slate-400">
                  عرض المواعيد الشاغرة والمحجوزة لشهر {calDate.toLocaleDateString('ar-YE', { month: 'long', year: 'numeric' })}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1))
                  }
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="font-bold text-xs text-amber-400 font-mono px-2">
                  {calDate.toLocaleDateString('ar-YE', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() =>
                    setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1))
                  }
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-[#121622] rounded-3xl border border-slate-800 p-6">
              <div className="grid grid-cols-7 gap-2 mb-3 text-center text-xs font-bold text-slate-400">
                <span>السبت</span>
                <span>الأحد</span>
                <span>الاثنين</span>
                <span>الثلاثاء</span>
                <span>الأربعاء</span>
                <span>الخميس</span>
                <span>الجمعة</span>
              </div>

              {/* 31 days calendar */}
              <div className="grid grid-cols-7 gap-2">
                {[...Array(31)].map((_, idx) => {
                  const day = idx + 1;
                  const monthStr = String(calDate.getMonth() + 1).padStart(2, '0');
                  const dayStr = String(day).padStart(2, '0');
                  const fullDate = `${calDate.getFullYear()}-${monthStr}-${dayStr}`;

                  const dayBookings = bookings.filter((b) => b.eventDate === fullDate);

                  return (
                    <div
                      key={day}
                      className={`min-h-[90px] p-2 rounded-xl border flex flex-col justify-between text-xs transition-colors ${
                        dayBookings.length > 0
                          ? 'bg-[#151c2c] border-amber-500/40'
                          : 'bg-[#0a0d14] border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center font-mono">
                        <span className="font-bold text-white text-sm">{day}</span>
                        {dayBookings.length > 0 && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                        )}
                      </div>

                      <div className="space-y-1">
                        {dayBookings.map((b) => (
                          <div
                            key={b.id}
                            onClick={() => onOpenBookingDetails(b)}
                            className={`p-1 rounded text-[10px] font-bold truncate cursor-pointer ${
                              b.status === 'confirmed'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : b.status === 'pending'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                            title={`${b.customerName} (${b.timeSlot})`}
                          >
                            {b.timeSlot === 'morning' ? '☀️' : '🌙'} {b.customerName}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: USERS & ROLES MANAGEMENT */}
        {adminTab === 'customers' && (() => {
          const filteredUsers = customers.filter((c) => {
            const matchRole = userRoleFilter === 'all' || c.role === userRoleFilter;
            const matchSearch =
              !userSearch ||
              c.name.toLowerCase().includes(userSearch.toLowerCase()) ||
              c.email.toLowerCase().includes(userSearch.toLowerCase()) ||
              (c.phone && c.phone.includes(userSearch));
            return matchRole && matchSearch;
          });

          return (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white font-serif-ar flex items-center gap-2">
                    <Users className="w-6 h-6 text-amber-400" />
                    <span>إدارة المستخدمين، الأدوار والصلاحيات</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    إدارة حسابات العملاء والمدراء، تعديل الأدوار والصلاحيات، وتفعيل أو إيقاف الحسابات
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-400">تصفية حسب الدور:</span>
                  <div className="flex bg-[#121622] rounded-xl p-1 border border-slate-800 text-xs font-bold">
                    <button
                      onClick={() => setUserRoleFilter('all')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        userRoleFilter === 'all' ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      الكل ({customers.length})
                    </button>
                    <button
                      onClick={() => setUserRoleFilter('CUSTOMER')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        userRoleFilter === 'CUSTOMER' ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      العملاء ({customers.filter(c => c.role === 'CUSTOMER').length})
                    </button>
                    <button
                      onClick={() => setUserRoleFilter('ADMIN')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        userRoleFilter === 'ADMIN' ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      المدراء ({customers.filter(c => c.role === 'ADMIN').length})
                    </button>
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="flex items-center gap-3 bg-[#121622] p-3 rounded-xl border border-slate-800">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث بالاسم، البريد الإلكتروني، أو رقم الهاتف..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="bg-transparent text-white text-xs w-full focus:outline-none placeholder-slate-500"
                />
                {userSearch && (
                  <button onClick={() => setUserSearch('')} className="text-slate-400 hover:text-white text-xs">
                    مسح
                  </button>
                )}
              </div>

              <div className="bg-[#121622] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#161c2b] text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">الاسم</th>
                      <th className="p-3.5">البريد الإلكتروني</th>
                      <th className="p-3.5">رقم الهاتف</th>
                      <th className="p-3.5">الدور والصلاحيات</th>
                      <th className="p-3.5">تاريخ التسجيل</th>
                      <th className="p-3.5">الحالة</th>
                      <th className="p-3.5 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          لا يوجد مستخدمون مطابقون لمعايير البحث الحالية.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((c) => {
                        const isSelf = c.id === user?.id;
                        const isAdmin = c.role === 'ADMIN';

                        return (
                          <tr key={c.id} className="hover:bg-[#151a27] transition-colors">
                            <td className="p-3.5 font-bold text-white flex items-center gap-2">
                              <span>{c.name}</span>
                              {isSelf && (
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">
                                  أنت
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 font-mono text-slate-300" dir="ltr">{c.email}</td>
                            <td className="p-3.5 font-mono text-slate-300" dir="ltr">{c.phone || '-'}</td>
                            <td className="p-3.5">
                              {isAdmin ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                                  <span>مدير نظام (كامل الصلاحيات)</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                  <Users className="w-3 h-3 text-slate-400" />
                                  <span>عميل (حجوزات شخصية)</span>
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-slate-400">
                              {new Date(c.createdAt).toLocaleDateString('ar-YE')}
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  c.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                }`}
                              >
                                {c.isActive ? 'نشط' : 'موقوف'}
                              </span>
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleToggleCustomer(c.id)}
                                  disabled={isSelf}
                                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                                    isSelf
                                      ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500'
                                      : c.isActive
                                      ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                                      : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                                  }`}
                                  title={isSelf ? 'لا يمكنك إيقاف حسابك الحالي' : undefined}
                                >
                                  {c.isActive ? 'إيقاف الحساب' : 'تفعيل'}
                                </button>

                                <button
                                  onClick={() => handleToggleUserRole(c.id, c.role)}
                                  disabled={isSelf}
                                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                                    isSelf
                                      ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500'
                                      : isAdmin
                                      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                                  }`}
                                  title={isSelf ? 'لا يمكنك تغيير دور حسابك الحالي' : undefined}
                                >
                                  {isAdmin ? 'تحويل لعميل' : 'ترقية لمدير'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* TAB 5: SERVICES MANAGEMENT */}
        {adminTab === 'services' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white font-serif-ar">
                  إدارة الخدمات والتجهيزات
                </h2>
                <p className="text-xs text-slate-400">
                  إضافة وتعديل وحذف خدمات الكوشات، الصوتيات، الشاشات والضيافة
                </p>
              </div>

              <button
                onClick={() => setShowAddServiceModal(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة خدمة جديدة</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((srv) => (
                <div
                  key={srv.id}
                  className="p-4 rounded-2xl bg-[#121622] border border-slate-800 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <img
                      src={srv.imageUrl}
                      alt={srv.name}
                      className="w-full h-36 object-cover rounded-xl border border-slate-800"
                    />
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-xs">{srv.name}</h4>
                      <span className="font-mono text-amber-400 font-bold text-xs">
                        {srv.price?.toLocaleString('ar-YE')} ريال
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{srv.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">{srv.category}</span>
                    <button
                      onClick={() => handleDeleteService(srv.id)}
                      className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: PACKAGES MANAGEMENT */}
        {adminTab === 'packages' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white font-serif-ar">
                  إدارة باقات القاعة
                </h2>
                <p className="text-xs text-slate-400">
                  إضافة وتعديل باقات الحجز ومميزاتها وأسعارها
                </p>
              </div>

              <button
                onClick={() => setShowAddPackageModal(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة باقة جديدة</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="p-5 rounded-2xl bg-[#121622] border border-slate-800 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-white text-base font-serif-ar">{pkg.name}</h4>
                      {pkg.badge && (
                        <span className="px-2 py-0.5 rounded bg-amber-500 text-black text-[10px] font-bold">
                          {pkg.badge}
                        </span>
                      )}
                    </div>
                    <div className="p-3 bg-[#0a0d14] rounded-xl text-center">
                      <span className="text-lg font-mono font-bold text-amber-400">
                        {pkg.price.toLocaleString('ar-YE')} ريال
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{pkg.description}</p>
                    <p className="text-xs text-amber-300 font-semibold">{pkg.guestCapacityText}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                    <button
                      onClick={() => handleDeletePackage(pkg.id)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 flex items-center gap-1 text-xs"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: GALLERY MANAGEMENT */}
        {adminTab === 'gallery' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white font-serif-ar">
                  إدارة معرض الصور والفيديوهات
                </h2>
                <p className="text-xs text-slate-400">
                  إضافة صور وتعديل وسائط القاعة وتصنيفاتها
                </p>
              </div>

              <button
                onClick={() => setShowAddGalleryModal(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة صورة / وسيط جديد</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {gallery.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl bg-[#121622] border border-slate-800 overflow-hidden group relative aspect-square"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-amber-400">{item.category}</span>
                      <h4 className="text-xs font-bold text-white leading-tight mt-1">{item.title}</h4>
                    </div>
                    <button
                      onClick={() => handleDeleteGallery(item.id)}
                      className="self-end p-1.5 rounded bg-red-500 text-white"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: REVIEWS MANAGEMENT */}
        {adminTab === 'reviews' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-serif-ar">
                إدارة تقييمات العملاء
              </h2>
              <p className="text-xs text-slate-400">
                اعتماد أو إخفاء التقييمات الواردة من العملاء قبل ظهورها في الموقع
              </p>
            </div>

            <div className="space-y-3">
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-2xl bg-[#121622] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{r.authorName}</span>
                      <div className="flex text-amber-400 text-xs">
                        {[...Array(r.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded ${
                          r.isApproved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {r.isApproved ? 'معتمد ومنشور' : 'بانتظار الاعتماد'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 italic">"{r.comment}"</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleReview(r.id, r.isApproved)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                        r.isApproved
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          : 'bg-emerald-500 text-black hover:bg-emerald-400'
                      }`}
                    >
                      {r.isApproved ? 'إخفاء' : 'اعتماد ونشر'}
                    </button>
                    <button
                      onClick={() => handleDeleteReview(r.id)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 9: SETTINGS & CMS */}
        {adminTab === 'settings' && settingsForm && (
          <form onSubmit={handleSaveSettings} className="space-y-6 animate-fadeIn max-w-4xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white font-serif-ar">
                  إعدادات القاعة ونظام إدارة المحتوى (CMS)
                </h2>
                <p className="text-xs text-slate-400">
                  تعديل معلومات القاعة، العناوين، الهواتف وبيانات الهيرو في الموقع
                </p>
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-md transition-colors"
              >
                حفظ التعديلات
              </button>
            </div>

            {settingsSaved && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>تم حفظ إعدادات القاعة بنجاح وتحديث الموقع مباشرة!</span>
              </div>
            )}

            <div className="bg-[#121622] rounded-3xl border border-slate-800 p-6 space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
                المعلومات الأساسية للقاعة
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">اسم القاعة</label>
                  <input
                    type="text"
                    value={settingsForm.hallName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, hallName: e.target.value })}
                    className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl p-2 text-xs text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">الشعار اللفظي (Tagline)</label>
                  <input
                    type="text"
                    value={settingsForm.tagline}
                    onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                    className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">الوصف العام للقاعة</label>
                <textarea
                  value={settingsForm.description}
                  onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                  rows={3}
                  className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl p-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">الهاتف الرئيسي</label>
                  <input
                    type="text"
                    value={settingsForm.phonePrimary}
                    onChange={(e) => setSettingsForm({ ...settingsForm, phonePrimary: e.target.value })}
                    className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl p-2 text-xs text-white"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">واتساب المباشر</label>
                  <input
                    type="text"
                    value={settingsForm.whatsappNumber}
                    onChange={(e) => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
                    className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl p-2 text-xs text-white"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={settingsForm.email}
                    onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                    className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl p-2 text-xs text-white"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            {/* Location & Maps Settings */}
            <div className="bg-[#121622] rounded-3xl border border-slate-800 p-6 space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
                الموقع والعنوان بصنعاء
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">العنوان التفصيلي</label>
                  <input
                    type="text"
                    value={settingsForm.address}
                    onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                    className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl p-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Google Plus Code</label>
                  <input
                    type="text"
                    value={settingsForm.plusCode}
                    onChange={(e) => setSettingsForm({ ...settingsForm, plusCode: e.target.value })}
                    className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl p-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">أوقات العمل</label>
                <input
                  type="text"
                  value={settingsForm.workingHours}
                  onChange={(e) => setSettingsForm({ ...settingsForm, workingHours: e.target.value })}
                  className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl p-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">سياسة الحجز والإلغاء</label>
                <textarea
                  value={settingsForm.cancellationPolicy}
                  onChange={(e) => setSettingsForm({ ...settingsForm, cancellationPolicy: e.target.value })}
                  rows={2}
                  className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl p-2 text-xs text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-md transition-colors"
            >
              حفظ جميع إعدادات القاعة
            </button>
          </form>
        )}

      </main>

      {/* Reject Booking Dialog */}
      {rejectingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121622] rounded-2xl border border-rose-500/30 p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white font-serif-ar">رفض طلب الحجز {rejectingBooking.bookingCode}</h3>
            <p className="text-xs text-slate-400">
              يرجى توضيح سبب تعذر تأكيد الحجز للعميل {rejectingBooking.customerName}:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              placeholder="مثال: تعذر توفير الموعد المطلوب لوجود أعمال صيانة / تضارب في المواعيد..."
              className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-400"
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleUpdateStatus(rejectingBooking.id, 'rejected', rejectionReason)}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                تأكيد الرفض
              </button>
              <button
                onClick={() => setRejectingBooking(null)}
                className="py-2 px-4 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Service Modal */}
      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <form onSubmit={handleCreateService} className="bg-[#121622] rounded-2xl border border-slate-700 p-6 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">إضافة خدمة جديدة</h3>
              <button type="button" onClick={() => setShowAddServiceModal(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">اسم الخدمة</label>
              <input
                type="text"
                value={newSrvName}
                onChange={(e) => setNewSrvName(e.target.value)}
                className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl p-2 text-xs text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">الوصف</label>
              <textarea
                value={newSrvDesc}
                onChange={(e) => setNewSrvDesc(e.target.value)}
                rows={2}
                className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl p-2 text-xs text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-300 mb-1">السعر (ريال يمني)</label>
                <input
                  type="number"
                  value={newSrvPrice}
                  onChange={(e) => setNewSrvPrice(Number(e.target.value))}
                  className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl p-2 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">التصنيف</label>
                <select
                  value={newSrvCat}
                  onChange={(e) => setNewSrvCat(e.target.value as any)}
                  className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl p-2 text-xs text-white"
                >
                  <option value="decor">كوشة وديكور</option>
                  <option value="sound">صوتيات</option>
                  <option value="lighting">إضاءة</option>
                  <option value="media">شاشات وتصوير</option>
                  <option value="hospitality">ضيافة</option>
                  <option value="general">عام / مؤتمرات</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">رابط الصورة (URL)</label>
              <input
                type="url"
                value={newSrvImg}
                onChange={(e) => setNewSrvImg(e.target.value)}
                className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl p-2 text-xs text-white"
                dir="ltr"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold"
            >
              حفظ الخدمة
            </button>
          </form>
        </div>
      )}

      {/* Add Package Modal */}
      {showAddPackageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <form onSubmit={handleCreatePackage} className="bg-[#121622] rounded-2xl border border-slate-700 p-6 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">إضافة باقة جديدة</h3>
              <button type="button" onClick={() => setShowAddPackageModal(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">اسم الباقة</label>
              <input
                type="text"
                value={newPkgName}
                onChange={(e) => setNewPkgName(e.target.value)}
                className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl p-2 text-xs text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">الوصف</label>
              <textarea
                value={newPkgDesc}
                onChange={(e) => setNewPkgDesc(e.target.value)}
                rows={2}
                className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl p-2 text-xs text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-300 mb-1">السعر (ريال يمني)</label>
                <input
                  type="number"
                  value={newPkgPrice}
                  onChange={(e) => setNewPkgPrice(Number(e.target.value))}
                  className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl p-2 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">السعة الاستيعابية</label>
                <input
                  type="text"
                  value={newPkgCapacity}
                  onChange={(e) => setNewPkgCapacity(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl p-2 text-xs text-white"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold"
            >
              حفظ الباقة
            </button>
          </form>
        </div>
      )}

      {/* Add Gallery Item Modal */}
      {showAddGalleryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <form onSubmit={handleCreateGallery} className="bg-[#121622] rounded-2xl border border-slate-700 p-6 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">إضافة وسيط لمعرض القاعة</h3>
              <button type="button" onClick={() => setShowAddGalleryModal(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">عنوان الصورة / الفيديو</label>
              <input
                type="text"
                value={newGalTitle}
                onChange={(e) => setNewGalTitle(e.target.value)}
                className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl p-2 text-xs text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">رابط الصورة (Image URL)</label>
              <input
                type="url"
                value={newGalUrl}
                onChange={(e) => setNewGalUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl p-2 text-xs text-white"
                dir="ltr"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">التصنيف</label>
              <select
                value={newGalCat}
                onChange={(e) => setNewGalCat(e.target.value as any)}
                className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl p-2 text-xs text-white"
              >
                <option value="weddings">أعراس وزفاف</option>
                <option value="graduations">حفلات تخرج</option>
                <option value="conferences">مؤتمرات وندوات</option>
                <option value="decor">كوشة وديكور</option>
                <option value="facilities">مرافق القاعة</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold"
            >
              إضافة إلى المعرض
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
