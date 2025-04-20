import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize Google Analytics
if (import.meta.env.GOOGLE_ANALYTICS_ID) {
  // Add the ID to the already loaded gtag script
  const gtag = (window as any).gtag;
  if (gtag) {
    gtag('config', import.meta.env.GOOGLE_ANALYTICS_ID);
  }
}

createRoot(document.getElementById("root")!).render(<App />);
