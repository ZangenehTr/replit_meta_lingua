import { useQuery } from "@tanstack/react-query";
import type { PublicFeatures } from "./use-enrollment-status";
import { DEFAULT_PUBLIC_FEATURES } from "@shared/public-features-defaults";

export function usePublicFeatures() {
  const { data: publicFeatures, isLoading, error } = useQuery<PublicFeatures>({
    queryKey: ['/api/public-features'],
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: 1000
  });

  return {
    // All features enabled by default - admins must explicitly opt-out
    publicFeatures: publicFeatures || DEFAULT_PUBLIC_FEATURES,
    isLoading,
    error
  };
}
