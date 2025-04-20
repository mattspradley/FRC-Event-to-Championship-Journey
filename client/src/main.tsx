import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Google Analytics is now directly embedded in index.html
// This ensures it loads before any other JavaScript

createRoot(document.getElementById("root")!).render(<App />);
