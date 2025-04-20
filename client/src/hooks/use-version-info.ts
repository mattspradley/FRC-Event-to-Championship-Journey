import { useQuery } from '@tanstack/react-query';
import { VERSION, VersionResponse } from '@shared/version';

/**
 * Hook to fetch version information from the API
 * Falls back to client-side VERSION object if API is unavailable
 */
export function useVersionInfo() {
  const { data, isLoading, error } = useQuery<VersionResponse>({
    queryKey: ['/api/version'],
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    refetchOnWindowFocus: false,
  });

  // If API request fails, return the client-side VERSION
  if (error || isLoading) {
    return {
      versionInfo: VERSION,
      isLoading,
      error,
      fromApi: false,
    };
  }

  return {
    versionInfo: data || VERSION,
    isLoading,
    error,
    fromApi: !!data,
  };
}