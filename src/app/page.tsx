import { MapPin, Calendar, Mail, Star } from "lucide-react";

// Homepage — introduces CoolKids and highlights key features
export default function HomePage() {
  return (
    <div>
      {/* Hero section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 px-4 py-20 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Family Fun in
            <span className="block text-amber-300">Cherokee County</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-blue-100">
            Discover the best family-friendly events near Canton, GA. Farms, museums,
            parks, festivals, and more — all in one place, personalized for your kids.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="/events"
              className="rounded-full bg-white px-8 py-3 text-lg font-semibold text-blue-700 shadow-lg hover:bg-blue-50"
            >
              Browse Events
            </a>
            <a
              href="/subscribe"
              className="rounded-full border-2 border-white px-8 py-3 text-lg font-semibold text-white hover:bg-white/10"
            >
              Get Monthly Newsletter
            </a>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold text-gray-900">
          How CoolKids Works
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<MapPin className="h-8 w-8 text-blue-600" />}
            title="Local Venues"
            description="We track 90+ family-friendly venues across Cherokee County and North Georgia."
          />
          <FeatureCard
            icon={<Calendar className="h-8 w-8 text-blue-600" />}
            title="Auto-Updated Events"
            description="Events are automatically scraped from venue websites every month."
          />
          <FeatureCard
            icon={<Star className="h-8 w-8 text-amber-500" />}
            title="Personalized"
            description="Filter by your kids' ages, interests, distance, and budget."
          />
          <FeatureCard
            icon={<Mail className="h-8 w-8 text-blue-600" />}
            title="Monthly Newsletter"
            description="Get a curated email with events that match your family's preferences."
          />
        </div>
      </section>

      {/* Venue highlights */}
      <section className="bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Featured Venues
          </h2>
          <p className="mt-4 text-center text-gray-600">
            Just a few of the amazing places we track in your area
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURED_VENUES.map((venue) => (
              <div
                key={venue.name}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md"
              >
                <div className="mb-2 text-sm font-medium text-blue-600">
                  {venue.category}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {venue.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">{venue.location}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// Reusable feature card component
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-gray-100 p-6 text-center shadow-sm">
      <div className="mb-4 rounded-full bg-blue-50 p-3">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
    </div>
  );
}

// Sample featured venues shown on the homepage
const FEATURED_VENUES = [
  { name: "Cagle's Family Farm", location: "Canton, GA", category: "Farm" },
  { name: "Tellus Science Museum", location: "Cartersville, GA", category: "Museum" },
  { name: "Gibbs Gardens", location: "Ball Ground, GA", category: "Garden" },
  { name: "North Georgia Zoo", location: "Cleveland, GA", category: "Zoo" },
  { name: "Booth Western Art Museum", location: "Cartersville, GA", category: "Museum" },
  { name: "Amicalola Falls State Park", location: "Dawsonville, GA", category: "Park" },
];
