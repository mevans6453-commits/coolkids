import { ClipboardList } from "lucide-react";

export default function ReviewQueuePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Review Queue</h1>
      <p className="mt-2 text-gray-600">
        Staging area for scraped events before they go live.
      </p>

      <div className="mt-10 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
        <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Coming Soon</h3>
        <p className="mx-auto mt-2 max-w-md text-gray-500">
          This will let you review scraped events before publishing, flag
          duplicates, and approve or reject new entries. For now, events go
          straight to published.
        </p>
      </div>
    </div>
  );
}
