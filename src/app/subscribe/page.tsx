import { Mail } from "lucide-react";

// Subscribe page — placeholder for Phase 2
export default function SubscribePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
        <Mail className="h-8 w-8 text-blue-600" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900">
        Monthly Newsletter Coming Soon!
      </h1>
      <p className="mt-4 text-lg text-gray-600">
        We&apos;re building a personalized monthly newsletter that matches family events
        to your kids&apos; ages, interests, and how far you want to drive.
      </p>
      <p className="mt-2 text-gray-500">
        Check back soon — this feature is coming in Phase 2!
      </p>
    </div>
  );
}
