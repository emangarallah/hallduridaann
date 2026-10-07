import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Booking,
  BookingStatus,
  User,
  AppNotification
} from '../types';
import {
  getBookings,
  createBooking,
  cancelBooking,
  updateBookingStatus,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  dismissNotificationId
} from '../services/api';
import { fetchApi, parseResponseJson, formatErrorMessage } from '../utils/apiConfig';

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password?: string;
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
  user: User;
  token: string;
  error?: string;
  code?: string;
  redirectToLogin?: boolean;
}

export interface LoginPayload {
  email: string;
  password?: string;
}

export interface LoginResponse {
  success?: boolean;
  user: User;
  token: string;
  error?: string;
}

/**
 * Auth User Query with synchronous initialData from localStorage
 */
export function useAuthUserQuery() {
  return useQuery<User | null>({
    queryKey: ['authUser'],
    queryFn: async () => {
      try {
        const res = await fetchApi('/api/auth/me');
        if (res.ok) {
          const data = await parseResponseJson(res);
          return data.user || null;
        }
      } catch {}
      const cached = localStorage.getItem('rdn_current_user');
      return cached ? JSON.parse(cached) : null;
    },
    initialData: () => {
      try {
        const cached = localStorage.getItem('rdn_current_user');
        return cached ? JSON.parse(cached) : null;
      } catch {
        return null;
      }
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Notifications Query with auto-polling every 5 seconds
 */
export function useNotificationsQuery(userId?: string, isAdmin = false) {
  return useQuery<AppNotification[]>({
    queryKey: ['notifications', userId || 'all', isAdmin ? 'admin' : 'user'],
    queryFn: async () => {
      if (!userId && !isAdmin) return [];
      return await getNotifications(userId || '', isAdmin);
    },
    enabled: Boolean(userId || isAdmin),
    staleTime: 3000,
    refetchInterval: 5000, // Live Polling background update
    refetchOnWindowFocus: true,
  });
}

/**
 * Optimistic Notification Read Mutation (Instantly removes notification & zeroes badge)
 */
export function useMarkNotificationReadOptimisticMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notifId: string) => {
      return await markNotificationRead(notifId);
    },
    onMutate: async (notifId: string) => {
      // 1. Cancel ongoing notification queries to avoid overwrite
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      // 2. Snapshot previous cache
      const previousData = queryClient.getQueriesData<AppNotification[]>({
        queryKey: ['notifications']
      });

      // 3. Mark dismissed immediately in persistent storage
      dismissNotificationId(notifId);

      // 4. Optimistically remove from all active queries right away
      queryClient.setQueriesData<AppNotification[]>(
        { queryKey: ['notifications'] },
        (old = []) => old.filter((n) => n.id !== notifId)
      );

      return { previousData };
    },
    onError: (_err, _notifId, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([qKey, data]) => {
          queryClient.setQueryData(qKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/**
 * Optimistic Mark All Notifications Read Mutation
 */
export function useMarkAllNotificationsReadOptimisticMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin?: boolean }) => {
      return await markAllNotificationsRead(userId, isAdmin);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previousData = queryClient.getQueriesData<AppNotification[]>({
        queryKey: ['notifications']
      });

      // Optimistically clear all notifications so badge becomes 0 instantaneously
      queryClient.setQueriesData<AppNotification[]>(
        { queryKey: ['notifications'] },
        () => []
      );

      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([qKey, data]) => {
          queryClient.setQueryData(qKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/**
 * Fetch bookings for current user or all bookings for admin
 */
export function useCustomerBookings(userId?: string) {
  return useQuery<Booking[]>({
    queryKey: ['bookings', userId || 'all'],
    queryFn: async () => {
      const all = await getBookings();
      if (!userId) return all;
      return all.filter((b) => b.userId === userId || b.customerId === userId);
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Customer Registration Mutation using TanStack Query
 */
export function useRegisterCustomerMutation() {
  const queryClient = useQueryClient();

  return useMutation<RegisterResponse, Error, RegisterPayload>({
    mutationFn: async (payload: RegisterPayload) => {
      const res = await fetchApi('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: payload.name.trim(),
          email: payload.email.trim(),
          phone: payload.phone.trim(),
          password: payload.password || 'user123456'
        })
      });

      const data = await parseResponseJson(res);

      if (!res.ok) {
        const errorObj: any = new Error(
          formatErrorMessage(data?.error || data?.message || data, 'فشل إنشاء الحساب')
        );
        errorObj.status = res.status;
        errorObj.code = data?.code;
        errorObj.email = data?.email;
        errorObj.redirectToLogin = data?.redirectToLogin;
        throw errorObj;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

/**
 * Customer / General Login Mutation using TanStack Query
 */
export function useLoginCustomerMutation() {
  const queryClient = useQueryClient();

  return useMutation<LoginResponse, Error, LoginPayload>({
    mutationFn: async (payload: LoginPayload) => {
      const res = await fetchApi('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: payload.email.trim(),
          password: payload.password
        })
      });

      const data = await parseResponseJson(res);

      if (!res.ok) {
        throw new Error(
          formatErrorMessage(data?.error || data, 'فشل تسجيل الدخول: تحقق من البريد الإلكتروني وكلمة المرور')
        );
      }

      return data;
    },
    onSuccess: (data) => {
      if (data?.user) {
        // Enforce strict user session isolation in React Query cache
        queryClient.removeQueries({ queryKey: ['bookings'] });
        queryClient.removeQueries({ queryKey: ['notifications'] });
        queryClient.setQueryData(['authUser'], data.user);
      }
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/**
 * Create Booking Mutation using TanStack Query with automatic cache invalidation
 */
export function useCreateBookingMutation() {
  const queryClient = useQueryClient();

  return useMutation<Booking, Error, Omit<Booking, 'id' | 'bookingCode' | 'createdAt' | 'status'>>({
    mutationFn: async (bookingData) => {
      return await createBooking(bookingData);
    },
    onSuccess: () => {
      // Invalidate all booking queries so data updates immediately across pages
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
}

/**
 * Cancel Booking Mutation using TanStack Query
 */
export function useCancelBookingMutation() {
  const queryClient = useQueryClient();

  return useMutation<Booking, Error, string>({
    mutationFn: async (bookingId: string) => {
      return await cancelBooking(bookingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
}

/**
 * Update Booking Status Mutation (Admin or User)
 */
export function useUpdateBookingStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    Booking,
    Error,
    { id: string; status: BookingStatus; adminNotes?: string; rejectionReason?: string }
  >({
    mutationFn: async ({ id, status, adminNotes, rejectionReason }) => {
      return await updateBookingStatus(id, status, adminNotes, rejectionReason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
}
