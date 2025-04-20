import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize Google Analytics
const gaId = import.meta.env.VITE_GOOGLE_ANALYTICS_ID;
if (gaId) {
  // Dynamically load Google Analytics script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);
  
  // Initialize gtag
  const gtag = (window as any).gtag;
  if (gtag) {
    gtag('config', gaId);
    console.log('Google Analytics initialized with ID');
  }
}

createRoot(document.getElementById("root")!).render(<App />);
