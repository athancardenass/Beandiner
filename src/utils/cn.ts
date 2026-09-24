// ↓ UTILITY: Conditional class name merger for Tailwind 4
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge conditional class names safely.
 *
 * Maps to: shared utility layer between Tailwind utility classes
 * and component-level class composition.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
