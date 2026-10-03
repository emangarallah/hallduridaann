import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Booking,
  BookingStatus,
  User
} from '../types';
import {
  getBookings,
  createBooking,
  cancelBooking,
  updateBookingStatus
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
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
