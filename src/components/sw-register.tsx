"use client";

import { useEffect } from "react";

// =============================================
// Service Worker Registration
// Registers the SW on mount. Runs client-side
// only. Logs registration status for debugging.
// =============================================

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[SW] Registered:", registration.scope);
        })
        .catch((error) => {
          console.error("[SW] Registration failed:", error);
        });
    }
  }, []);

  return null; // This component renders nothing
}
