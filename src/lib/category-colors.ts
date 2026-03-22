/**
 * Returns Tailwind classes for category badges based on the category name.
 * Provides visual differentiation so users can scan events/venues faster.
 */
export function getCategoryBadgeClasses(category: string): string {
  const cat = category.toLowerCase();

  // Nature / outdoor
  if (cat === "outdoor" || cat === "park" || cat === "nature")
    return "bg-emerald-50 text-emerald-700";

  // Farms
  if (cat === "farm" || cat === "seasonal")
    return "bg-orange-50 text-orange-700";

  // Museums / education
  if (cat === "museum" || cat === "education")
    return "bg-purple-50 text-purple-700";

  // Arts / performance
  if (cat === "arts" || cat === "performance")
    return "bg-pink-50 text-pink-700";

  // Water / aquatic / sports
  if (cat === "aquatic" || cat === "sports")
    return "bg-cyan-50 text-cyan-700";

  // Garden
  if (cat === "garden")
    return "bg-lime-50 text-lime-700";

  // Zoo / animals
  if (cat === "zoo" || cat === "animals")
    return "bg-amber-50 text-amber-700";

  // Market / free
  if (cat === "market" || cat === "free")
    return "bg-teal-50 text-teal-700";

  // Default
  return "bg-blue-50 text-blue-700";
}
