import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./utils/apiInterceptor";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
