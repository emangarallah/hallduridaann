import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { WhatsAppFloat } from './components/layout/WhatsAppFloat';
import { GlobalToggleBar } from './components/layout/GlobalToggleBar';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { ServicesPage } from './pages/ServicesPage';
import { PackagesPage } from './pages/PackagesPage';
import { GalleryPage } from './pages/GalleryPage';
import { BookingPage } from './pages/BookingPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { ContactPage } from './pages/ContactPage';
import { AccountPage } from './pages/AccountPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { Forbidden403Page } from './pages/Forbidden403Page';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { AuthModal } from './components/modals/AuthModal';
import { BookingDetailsModal } from './components/modals/BookingDetailsModal';
import { LightboxModal } from './components/modals/LightboxModal';
import { ReviewModal } from './components/modals/ReviewModal';
import { useQueryClient } from '@tanstack/react-query';
import {
  Booking,
  GalleryItem,
  HallPackage,
  HallService,
  HallSettings,
  Review,
  User
} from './types';
import {
  useHallSettingsQuery,
  usePackagesQuery,
  useServicesQuery,
  useGalleryQuery,
  useReviewsQuery
} from './hooks/useHallDataQuery';

function MainApp() {
  const queryClient = useQueryClient();
  const { user, isAdmin, isLoading } = useAuth();

  // Navigation tab
  const [currentTab, setCurrentTab] = useState<string>('home');

  // Core essential data: Settings, Packages, Services cached with 5-min staleTime
  const { data: settings = null } = useHallSettingsQuery();
  const { data: packages = [] } = usePackagesQuery();
  const { data: services = [] } = useServicesQuery();

  // Lazy / On-Demand data: Gallery and Reviews loaded only when on their tabs or home screen
  const isGalleryNeeded = currentTab === 'gallery' || currentTab === 'home';
  const isReviewsNeeded = currentTab === 'reviews' || currentTab === 'home';

  const { data: gallery = [] } = useGalleryQuery(isGalleryNeeded);
  const { data: reviews = [] } = useReviewsQuery(isReviewsNeeded, true);

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalInitialTab, setAuthModalInitialTab] = useState<'login' | 'register'>('login');
  const [activeBookingDetails, setActiveBookingDetails] = useState<Booking | null>(null);
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const handleOpenAuthModal = (tab: 'login' | 'register' = 'login') => {
    setAuthModalInitialTab(tab);
    setAuthModalOpen(true);
  };

  // Preselected package for booking wizard
  const [preselectedPackage, setPreselectedPackage] = useState<HallPackage | null>(null);

  // Refetch / Invalidate all data when mutations occur
  const refreshAllData = () => {
    queryClient.invalidateQueries({ queryKey: ['packages'] });
    queryClient.invalidateQueries({ queryKey: ['services'] });
    queryClient.invalidateQueries({ queryKey: ['hallSettings'] });
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
    if (isGalleryNeeded) queryClient.invalidateQueries({ queryKey: ['gallery'] });
    if (isReviewsNeeded) queryClient.invalidateQueries({ queryKey: ['reviews'] });
  };

  // Synchronize with URL path and enforce strict route guards
  useEffect(() => {
    if (isLoading) return;

    const path = window.location.pathname;
    if (path === '/admin/login') {
      if (user && user.role === 'ADMIN') {
        setCurrentTab('admin');
        window.history.pushState(null, '', '/admin/dashboard');
      } else {
        setCurrentTab('admin-login');
      }
    } else if (path.startsWith('/admin')) {
      if (!user) {
        // Case 3: Visitor trying to access /admin -> Redirect to /admin/login
        setCurrentTab('admin-login');
        window.history.pushState(null, '', '/admin/login');
      } else if (user.role !== 'ADMIN') {
        // Case 1: Customer trying to access /admin -> 403 Forbidden
        setCurrentTab('403');
        window.history.pushState(null, '', '/403');
      } else {
        setCurrentTab('admin');
      }
    } else if (path === '/403') {
      setCurrentTab('403');
    } else if (path === '/reset-password') {
      setCurrentTab('reset-password');
    } else if (path === '/login') {
      setCurrentTab('home');
      handleOpenAuthModal('login');
    } else if (path === '/register') {
      setCurrentTab('home');
      handleOpenAuthModal('register');
    } else if (path === '/account') {
      if (!user) {
        setCurrentTab('home');
        handleOpenAuthModal('login');
      } else {
        setCurrentTab('account');
      }
    } else if (path === '/about') setCurrentTab('about');
    else if (path === '/services') setCurrentTab('services');
    else if (path === '/packages') setCurrentTab('packages');
    else if (path === '/gallery') setCurrentTab('gallery');
    else if (path === '/booking') setCurrentTab('booking');
    else if (path === '/reviews') setCurrentTab('reviews');
    else if (path === '/contact') setCurrentTab('contact');
  }, [user, isLoading]);

  // Requirement 17: If user session ends or becomes unauthenticated on protected tabs, redirect immediately to login
  useEffect(() => {
    if (isLoading) return;
    if (!user && (currentTab === 'admin')) {
      setCurrentTab('admin-login');
      window.history.pushState(null, '', '/admin/login');
    } else if (!user && currentTab === 'account') {
      setCurrentTab('home');
      window.history.pushState(null, '', '/');
      setAuthModalOpen(true);
    }
  }, [user, isLoading, currentTab]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/admin/login') {
        setCurrentTab('admin-login');
      } else if (path.startsWith('/admin')) {
        if (!user) {
          setCurrentTab('admin-login');
          window.history.pushState(null, '', '/admin/login');
        } else if (user.role !== 'ADMIN') {
          setCurrentTab('403');
        } else {
          setCurrentTab('admin');
        }
      } else if (path === '/403') {
        setCurrentTab('403');
      } else if (path === '/reset-password') {
        setCurrentTab('reset-password');
      } else if (path === '/account') {
        setCurrentTab('account');
      } else if (path === '/') {
        setCurrentTab('home');
      } else {
        const clean = path.replace('/', '');
        if (clean) setCurrentTab(clean);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  // Central Navigation handler with Role Guard
  const navigate = (tab: string) => {
    if (tab === 'admin-login') {
      setCurrentTab('admin-login');
      if (window.location.pathname !== '/admin/login') {
        window.history.pushState(null, '', '/admin/login');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Strict Guard for /admin and all admin routes
    if (tab === 'admin') {
      const currentUser = user || (() => {
        try {
          const cached = localStorage.getItem('rdn_current_user');
          return cached ? JSON.parse(cached) : null;
        } catch {
          return null;
        }
      })();

      if (!currentUser) {
        // Case 3: Redirect unauthenticated user to /admin/login
        setCurrentTab('admin-login');
        window.history.pushState(null, '', '/admin/login');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (currentUser.role !== 'ADMIN') {
        // Case 1: Customer visits /admin -> reject and show 403 Forbidden
        setCurrentTab('403');
        window.history.pushState(null, '', '/403');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      setCurrentTab('admin');
      window.history.pushState(null, '', '/admin/dashboard');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (tab === 'account' && !user) {
      setAuthModalOpen(true);
      return;
    }

    setCurrentTab(tab);
    const targetPath = tab === 'home' ? '/' : `/${tab}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handlers
  const handleSelectPackageForBooking = (pkg: HallPackage) => {
    setPreselectedPackage(pkg);
    navigate('booking');
  };

  const handleBookService = (service: HallService) => {
    navigate('booking');
  };

  const handleOpenReviewModal = (booking?: Booking) => {
    setReviewBooking(booking || null);
    setReviewModalOpen(true);
  };

  // Route Content Renderer
  const renderTabContent = () => {
    // 403 Forbidden Screen
    if (currentTab === '403') {
      return (
        <Forbidden403Page
          setCurrentTab={navigate}
          openAuthModal={() => handleOpenAuthModal('login')}
        />
      );
    }

    // Dedicated Admin Login Page (/admin/login)
    if (currentTab === 'admin-login') {
      return (
        <AdminLoginPage
          setCurrentTab={navigate}
          onSuccess={() => {
            refreshAllData();
            navigate('admin');
          }}
        />
      );
    }

    // Admin Dashboard Guard
    if (currentTab === 'admin') {
      // 1. Unauthenticated -> Show Admin Login page
      if (!user) {
        return (
          <AdminLoginPage
            setCurrentTab={navigate}
            onSuccess={() => {
              refreshAllData();
              navigate('admin');
              window.history.pushState(null, '', '/admin/dashboard');
            }}
          />
        );
      }

      // 2. Customer -> Strictly FORBIDDEN (403)
      if (user.role !== 'ADMIN') {
        return (
          <Forbidden403Page
            setCurrentTab={navigate}
            openAuthModal={() => handleOpenAuthModal('login')}
          />
        );
      }

      // 3. ADMIN -> Allow Access
      return (
        <AdminDashboard
          onOpenBookingDetails={(b) => setActiveBookingDetails(b)}
          setCurrentTab={(t) => {
            navigate(t);
            refreshAllData();
          }}
        />
      );
    }

    switch (currentTab) {
      case 'home':
        return (
          <HomePage
            settings={settings}
            packages={packages}
            services={services}
            gallery={gallery}
            reviews={reviews}
            setCurrentTab={navigate}
            onSelectPackageForBooking={handleSelectPackageForBooking}
            onOpenLightbox={(item) => setLightboxItem(item)}
          />
        );
      case 'about':
        return <AboutPage settings={settings} setCurrentTab={navigate} />;
      case 'services':
        return (
          <ServicesPage
            services={services}
            setCurrentTab={navigate}
            onBookService={handleBookService}
          />
        );
      case 'packages':
        return (
          <PackagesPage
            packages={packages}
            services={services}
            setCurrentTab={navigate}
            onSelectPackageForBooking={handleSelectPackageForBooking}
          />
        );
      case 'gallery':
        return (
          <GalleryPage
            gallery={gallery}
            onOpenLightbox={(item) => setLightboxItem(item)}
          />
        );
      case 'booking':
        return (
          <BookingPage
            packages={packages}
            services={services}
            settings={settings}
            preselectedPackage={preselectedPackage}
            setCurrentTab={navigate}
            openAuthModal={() => handleOpenAuthModal('login')}
            onBookingCreated={() => refreshAllData()}
          />
        );
      case 'reviews':
        return (
          <ReviewsPage
            reviews={reviews}
            settings={settings}
            onOpenReviewModal={() => handleOpenReviewModal()}
            openAuthModal={() => handleOpenAuthModal('login')}
          />
        );
      case 'contact':
        return <ContactPage settings={settings} />;
      case 'reset-password':
        return (
          <ResetPasswordPage
            setCurrentTab={navigate}
            openAuthModal={handleOpenAuthModal}
          />
        );
      case 'account':
        return (
          <AccountPage
            onOpenBookingDetails={(b) => setActiveBookingDetails(b)}
            onOpenReviewModal={(b) => handleOpenReviewModal(b)}
            setCurrentTab={navigate}
            openAuthModal={() => handleOpenAuthModal('login')}
          />
        );
      default:
        return (
          <HomePage
            settings={settings}
            packages={packages}
            services={services}
            gallery={gallery}
            reviews={reviews}
            setCurrentTab={navigate}
            onSelectPackageForBooking={handleSelectPackageForBooking}
            onOpenLightbox={(item) => setLightboxItem(item)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0d13] text-[#f4f4f6]">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={navigate}
        openAuthModal={handleOpenAuthModal}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {renderTabContent()}
      </main>

      {/* Footer */}
      {currentTab !== 'admin' && currentTab !== 'admin-login' && currentTab !== '403' && (
        <Footer settings={settings} setCurrentTab={navigate} />
      )}

      {/* Floating Quick WhatsApp Widget */}
      {currentTab !== 'admin' && currentTab !== 'admin-login' && currentTab !== '403' && <WhatsAppFloat settings={settings} />}

      {/* Global Floating Toggle (Theme & Language) available on ALL pages */}
      <GlobalToggleBar variant="floating" />

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        initialTab={authModalInitialTab}
        onClose={() => setAuthModalOpen(false)}
        onOpenAdminLogin={() => {
          setAuthModalOpen(false);
          navigate('admin-login');
        }}
        onNavigateToReset={(resetToken) => {
          setAuthModalOpen(false);
          navigate('reset-password');
          window.history.pushState(null, '', `/reset-password?token=${encodeURIComponent(resetToken)}`);
        }}
        onSuccess={(authenticatedUser: User) => {
          refreshAllData();
          // Requirement 16:
          // CUSTOMER -> redirected to customer account
          // ADMIN -> redirected to admin dashboard
          if (authenticatedUser.role === 'ADMIN') {
            navigate('admin');
          } else {
            navigate('account');
          }
        }}
      />

      <BookingDetailsModal
        booking={activeBookingDetails}
        settings={settings}
        onClose={() => setActiveBookingDetails(null)}
        onBookingUpdated={() => refreshAllData()}
        onOpenReviewModal={(b) => handleOpenReviewModal(b)}
      />

      <LightboxModal
        item={lightboxItem}
        items={gallery}
        onClose={() => setLightboxItem(null)}
        onNavigate={(item) => setLightboxItem(item)}
      />

      <ReviewModal
        booking={reviewBooking}
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        onSuccess={() => refreshAllData()}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
