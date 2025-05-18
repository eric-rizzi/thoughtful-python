// src/main.tsx (Example - place provider appropriately)
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { PyodideProvider } from "./contexts/PyodideContext"; // Import Provider
import "./index.css";
import { BASE_PATH, GOOGLE_CLIENT_ID } from "./config";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter basename={BASE_PATH}>
        <PyodideProvider>
          <App />
        </PyodideProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
