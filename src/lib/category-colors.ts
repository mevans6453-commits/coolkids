/**
 * Returns Tailwind classes for category badges based on the category name.
 * Soft pastel palette — readable but not competing for attention.
 */
export function getCategoryBadgeClasses(category: string): string {
  const cat = category.toLowerCase();

  // Nature / outdoor
  if (cat === "outdoor" || cat === "park" || cat === "nature")
    return "bg-emerald-50 text-emerald-600 border border-emerald-100";

  // Farms / seasonal
  if (cat === "farm" || cat === "seasonal")
    return "bg-orange-50 text-orange-500 border border-orange-100";

  // Museums / education
  if (cat === "museum" || cat === "education")
    return "bg-violet-50 text-violet-500 border border-violet-100";

  // Arts / performance
  if (cat === "arts" || cat === "performance")
    return "bg-pink-50 text-pink-500 border border-pink-100";

  // Water / aquatic / sports
  if (cat === "aquatic" || cat === "sports")
    return "bg-sky-50 text-sky-500 border border-sky-100";

  // Garden
  if (cat === "garden")
    return "bg-lime-50 text-lime-600 border border-lime-100";

  // Zoo / animals
  if (cat === "zoo" || cat === "animals")
    return "bg-amber-50 text-amber-500 border border-amber-100";

  // Market / free
  if (cat === "market" || cat === "free")
    return "bg-teal-50 text-teal-500 border border-teal-100";

  // Festival
  if (cat === "festival")
    return "bg-indigo-50 text-indigo-500 border border-indigo-100";

  // Default
  return "bg-gray-50 text-gray-500 border border-gray-100";
}
