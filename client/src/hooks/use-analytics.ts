/**
 * Placeholder hook for analytics tracking
 * Google Analytics integration has been removed
 */

// Track a page view (no-op function)
export const trackPageView = (path: string) => {
  // Analytics tracking disabled
};

// Track an event (no-op function)
export const trackEvent = (
  category: string,
  action: string,
  label?: string,
  value?: number
) => {
  // Analytics tracking disabled
};

// Hook to use analytics in components
export function useAnalytics() {
  return {
    trackPageView,
    trackEvent,
  };
}