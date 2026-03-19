import type { Metadata } from "next";
import AuthButton from "@/components/auth-button";
import "./globals.css";

export const metadata: Metadata = {
  title: "CoolKids - Family Events in Cherokee County & North Georgia",
  description:
    "Find the best family-friendly events near Canton, GA. Farms, museums, parks, festivals, and more — personalized for your kids.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white antialiased">
        {/* Navigation header */}
        <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
            <a href="/" className="text-2xl font-bold text-[var(--primary)]">
              CoolKids
            </a>
            <nav className="flex items-center gap-6 text-sm font-medium">
              <a href="/events" className="text-gray-600 hover:text-[var(--primary)]">
                Events
              </a>
              <a href="/venues" className="text-gray-600 hover:text-[var(--primary)]">
                Venues
              </a>
              <AuthButton />
            </nav>
          </div>
        </header>

        {/* Page content */}
        <main>{children}</main>

        {/* Footer */}
        <footer className="border-t border-[var(--border)] bg-gray-50 py-8">
          <div className="mx-auto max-w-6xl px-4 text-center text-sm text-gray-500">
            <p>CoolKids — Family events in Cherokee County & North Georgia</p>
            <p className="mt-1">Open source project • Built with ❤️ for local families</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
