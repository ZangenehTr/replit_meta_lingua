import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/services/endpoints";
import { useAuth } from "@/hooks/use-auth";
import apiClient from "@/lib/apiClient";

export interface EnrollmentStatus {
  isEnrolled: boolean;
  hasActiveEnrollments: boolean;
  totalEnrollments: number;
  activeCourses: {
    id: number;
    title: string;
    level: string;
    progress: number;
    nextSession?: string;
    deliveryMode: string;
    classFormat: string;
  }[];
  hasCompletedPlacementTest: boolean;
  membershipTier: string;
  walletBalance: number;
  totalCredits: number;
}

export function useEnrollmentStatus() {
  const { user, isAuthenticated } = useAuth();

  const { data: enrollmentStatus, isLoading, error, refetch } = useQuery<EnrollmentStatus>({
    queryKey: [API_ENDPOINTS.student.enrollmentStatus, user?.id],
    queryFn: async () => {
      if (!isAuthenticated || !user) {
        return {
          isEnrolled: false,
          hasActiveEnrollments: false,
          totalEnrollments: 0,
          activeCourses: [],
          hasCompletedPlacementTest: false,
          membershipTier: 'bronze',
          walletBalance: 0,
          totalCredits: 0,
        };
      }

      const response = await apiClient.get(API_ENDPOINTS.student.enrollmentStatus);
      return response.data;
    },
    enabled: !!user && user.role === 'Student',
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    enrollmentStatus,
    isLoading,
    error,
    refetch,
    // Convenience flags
    isEnrolled: enrollmentStatus?.isEnrolled ?? false,
    hasActiveEnrollments: enrollmentStatus?.hasActiveEnrollments ?? false,
    isNewStudent: !enrollmentStatus?.hasCompletedPlacementTest && !enrollmentStatus?.isEnrolled,
    activeCourses: enrollmentStatus?.activeCourses ?? [],
  };
}