/**
 * Custom hook for Google Analytics tracking
 */

// Declare gtag function for TypeScript
interface Window {
  gtag?: (...args: any[]) => void;
  dataLayer?: any[];
}

// Get analytics ID from environment
const getAnalyticsId = () => {
  return import.meta.env.GOOGLE_ANALYTICS_ID as string || '';
};

// Track a page view
export const trackPageView = (path: string) => {
  try {
    const gtag = (window as any).gtag;
    const gaId = getAnalyticsId();
    
    if (gtag && gaId) {
      gtag('config', gaId, {
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
    
    if (gtag && getAnalyticsId()) {
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