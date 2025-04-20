/**
 * Custom hook for Google Analytics tracking
 */

// Define the gtag function type
interface Window {
  gtag?: (command: string, action: string, params?: any) => void;
  dataLayer?: any[];
}

// Track a page view
export const trackPageView = (path: string) => {
  try {
    const gtag = (window as any).gtag;
    if (gtag && import.meta.env.VITE_GOOGLE_ANALYTICS_ID) {
      gtag('config', import.meta.env.VITE_GOOGLE_ANALYTICS_ID, {
        page_path: path,
      });
      console.log('Page view tracked:', path);
    }
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
};

// Track an event
export const trackEvent = (
  category: string,
  action: string,
  label?: string,
  value?: number
) => {
  try {
    const gtag = (window as any).gtag;
    if (gtag && import.meta.env.VITE_GOOGLE_ANALYTICS_ID) {
      gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
      });
      console.log('Event tracked:', { category, action, label, value });
    }
  } catch (error) {
    console.error('Error tracking event:', error);
  }
};

// Hook to use analytics in components
export function useAnalytics() {
  return {
    trackPageView,
    trackEvent,
  };
}