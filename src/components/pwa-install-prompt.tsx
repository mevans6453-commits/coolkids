"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

// =============================================
// PWA Install Prompt
// Shows a banner when the app can be installed.
// On iOS (no beforeinstallprompt), shows manual
// instructions. Remembers dismissals for 7 days.
// =============================================

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Don't show if already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Check if dismissed recently (7-day cooldown)
    const dismissed = localStorage.getItem("coolkids-pwa-dismissed");
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedAt < sevenDays) return;
    }

    // Detect iOS (no beforeinstallprompt support)
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as unknown as Record<string, unknown>).MSStream;
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      // Show iOS banner after a short delay
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android/Desktop: listen for the install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSInstructions(false);
    localStorage.setItem("coolkids-pwa-dismissed", Date.now().toString());
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
      <div className="mx-auto max-w-lg p-4">
        <div className="rounded-2xl border border-blue-200 bg-white p-4 shadow-2xl">
          {showIOSInstructions ? (
            /* iOS manual install instructions */
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">
                  Add CoolKids to Home Screen
                </h3>
                <button
                  onClick={handleDismiss}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ol className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    1
                  </span>
                  <span>
                    Tap the{" "}
                    <strong className="text-gray-900">Share</strong> button
                    <span className="ml-1 inline-block text-blue-600">
                      ⬆
                    </span>{" "}
                    at the bottom of Safari
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    2
                  </span>
                  <span>
                    Scroll down and tap{" "}
                    <strong className="text-gray-900">
                      &quot;Add to Home Screen&quot;
                    </strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    3
                  </span>
                  <span>
                    Tap <strong className="text-gray-900">Add</strong> — done!
                  </span>
                </li>
              </ol>
            </div>
          ) : (
            /* Standard install banner */
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-md">
                <Download className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  Install CoolKids
                </p>
                <p className="text-xs text-gray-500">
                  Add to your home screen for quick access
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={handleInstall}
                  className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-95"
                >
                  Install
                </button>
                <button
                  onClick={handleDismiss}
                  className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
