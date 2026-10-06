import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getHallSettings,
  getPackages,
  getServices,
  getGallery,
  getReviews,
  updateHallSettings,
  createPackage,
  updatePackage,
  deletePackage,
  createService,
  updateService,
  deleteService,
  createGalleryItem,
  deleteGalleryItem,
  toggleReviewApproval,
  deleteReview
} from '../services/api';
import {
  HallSettings,
  HallPackage,
  HallService,
  GalleryItem,
  Review
} from '../types';

const FIVE_MINUTES = 1000 * 60 * 5;

/**
 * Hook for Hall Settings with 5 minutes stale time
 */
export function useHallSettingsQuery() {
  return useQuery<HallSettings>({
    queryKey: ['hallSettings'],
    queryFn: getHallSettings,
    staleTime: FIVE_MINUTES,
    gcTime: 1000 * 60 * 30, // 30 minutes cache retention
  });
}

/**
 * Hook for Hall Packages with 5 minutes stale time
 */
export function usePackagesQuery(enabled = true) {
  return useQuery<HallPackage[]>({
    queryKey: ['packages'],
    queryFn: getPackages,
    staleTime: FIVE_MINUTES,
    gcTime: 1000 * 60 * 30,
    enabled,
  });
}

/**
 * Hook for Hall Services with 5 minutes stale time
 */
export function useServicesQuery(enabled = true) {
  return useQuery<HallService[]>({
    queryKey: ['services'],
    queryFn: getServices,
    staleTime: FIVE_MINUTES,
    gcTime: 1000 * 60 * 30,
    enabled,
  });
}

/**
 * Lazy / On-Demand Hook for Gallery with 5 minutes stale time
 * Only fetched when enabled is true (e.g. on gallery tab or when section visible)
 */
export function useGalleryQuery(enabled = true) {
  return useQuery<GalleryItem[]>({
    queryKey: ['gallery'],
    queryFn: getGallery,
    staleTime: FIVE_MINUTES,
    gcTime: 1000 * 60 * 30,
    enabled,
  });
}

/**
 * Lazy / On-Demand Hook for Reviews with 5 minutes stale time
 * Only fetched when enabled is true (e.g. on reviews tab or when section visible)
 */
export function useReviewsQuery(enabled = true, onlyApproved = true) {
  return useQuery<Review[]>({
    queryKey: ['reviews', onlyApproved ? 'approved' : 'all'],
    queryFn: () => getReviews(onlyApproved),
    staleTime: FIVE_MINUTES,
    gcTime: 1000 * 60 * 30,
    enabled,
  });
}
