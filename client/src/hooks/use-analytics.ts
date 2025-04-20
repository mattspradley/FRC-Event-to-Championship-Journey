/**
 * Custom hook for Google Analytics tracking
 * Google Analytics script is loaded in index.html with measurement ID G-TLKVNR6KVB
 */

// Declare gtag function for TypeScript
interface Window {
  gtag?: (...args: any[]) => void;
  dataLayer?: any[];
}

// Analytics ID is hardcoded in index.html
const ANALYTICS_ID = 'G-TLKVNR6KVB';

// Track a page view
export const trackPageView = (path: string) => {
  try {
    const gtag = (window as any).gtag;
    
    if (gtag) {
      gtag('config', ANALYTICS_ID, {
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
    
    if (gtag) {
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