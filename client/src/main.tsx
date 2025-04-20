import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize Google Analytics
const initializeAnalytics = () => {
  // Get Google Analytics ID from environment variables or secrets
  // We use the non-prefixed version as it will be available server-side
  const gaId = import.meta.env.GOOGLE_ANALYTICS_ID as string || '';
  
  if (!gaId) {
    console.log('Google Analytics ID not found. Analytics will not be loaded.');
    return;
  }
  
  console.log('Loading Google Analytics...');
  
  // Create dataLayer
  const dataLayer = (window as any).dataLayer = (window as any).dataLayer || [];
  
  // Define gtag function
  const gtag = function() {
    dataLayer.push(arguments);
  };
  
  // Initialize gtag
  gtag('js', new Date());
  gtag('config', gaId);
  
  // Make gtag available globally
  (window as any).gtag = gtag;
  
  // Load the Google Analytics tracking script
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  script.async = true;
  document.head.appendChild(script);
  
  console.log('Google Analytics initialized with ID');
};

// Call the function to initialize analytics
initializeAnalytics();

createRoot(document.getElementById("root")!).render(<App />);
