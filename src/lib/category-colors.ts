/**
 * Returns Tailwind classes for category badges based on the new parent-friendly categories.
 * Soft pastel palette — readable but not competing for attention.
 */
export function getCategoryBadgeClasses(category: string): string {
  const cat = category.toLowerCase();

  // 🎨 Hands-On Art
  if (cat === "hands-on-art")
    return "bg-pink-50 text-pink-600 border border-pink-100";

  // 🦕 Animals & Nature
  if (cat === "animals-nature")
    return "bg-emerald-50 text-emerald-600 border border-emerald-100";

  // 🎭 Shows & Performances
  if (cat === "shows-performances")
    return "bg-purple-50 text-purple-600 border border-purple-100";

  // 🔬 Science & STEM
  if (cat === "science-stem")
    return "bg-blue-50 text-blue-600 border border-blue-100";

  // 🎪 Festivals & Fairs
  if (cat === "festivals-fairs")
    return "bg-indigo-50 text-indigo-500 border border-indigo-100";

  // 🐣 Seasonal & Holidays
  if (cat === "seasonal-holidays")
    return "bg-amber-50 text-amber-600 border border-amber-100";

  // 🏃 Active & Sports
  if (cat === "active-sports")
    return "bg-sky-50 text-sky-600 border border-sky-100";

  // 🛍️ Markets & Shopping
  if (cat === "markets-shopping")
    return "bg-teal-50 text-teal-600 border border-teal-100";

  // 📚 Storytime & Learning
  if (cat === "storytime-learning")
    return "bg-violet-50 text-violet-600 border border-violet-100";

  // 🎉 Family Fun
  if (cat === "family-fun")
    return "bg-orange-50 text-orange-500 border border-orange-100";

  // Default
  return "bg-gray-50 text-gray-500 border border-gray-100";
}
