import { useQuery } from "@tanstack/react-query";
import type { PublicFeatures } from "./use-enrollment-status";

export function usePublicFeatures() {
  const { data: publicFeatures, isLoading, error } = useQuery<PublicFeatures>({
    queryKey: ['/api/public-features'],
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
    refetchOnWindowFocus: false,
    // Provide default values in case of error
    retry: 3,
    retryDelay: 1000
  });

  return {
    publicFeatures: publicFeatures || {
      courseCatalog: true,
      placementTest: true,
      teacherDirectory: true,
      liveClasses: false,
      progressTracking: false,
      linguaquestGames: false,
      certificates: false,
      oneOnOneSessions: true,
      blogPosts: true,
      videoCourses: true
    },
    isLoading,
    error
  };
}
