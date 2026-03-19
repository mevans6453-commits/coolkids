import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility to merge Tailwind CSS class names cleanly
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
