import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format dates in America/Toronto timezone
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// Calculate countdown
export function getCountdown(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  
  if (diff < 0) {
    const absDiff = Math.abs(diff);
    const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h overdue`;
    }
    return `${hours}h overdue`;
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function isOverdue(date: Date): boolean {
  return date.getTime() < new Date().getTime();
}

// Predefined category colors for common categories
const predefinedCategoryColors: Record<string, string> = {
  'Technology': 'bg-blue-100 text-blue-700 border-blue-200',
  'AI': 'bg-purple-100 text-purple-700 border-purple-200',
  'Cryptocurrency': 'bg-orange-100 text-orange-700 border-orange-200',
  'Bitcoin': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Finance': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Markets': 'bg-teal-100 text-teal-700 border-teal-200',
  'Apple': 'bg-slate-100 text-slate-700 border-slate-200',
  'Politics': 'bg-red-100 text-red-700 border-red-200',
  'Sports': 'bg-green-100 text-green-700 border-green-200',
  'Entertainment': 'bg-pink-100 text-pink-700 border-pink-200',
  'Science': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'Health': 'bg-lime-100 text-lime-700 border-lime-200',
  'Business': 'bg-indigo-100 text-indigo-700 border-indigo-200',
};

// Color palette for random category colors
const colorPalette = [
  'bg-rose-100 text-rose-700 border-rose-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-violet-100 text-violet-700 border-violet-200',
  'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
  'bg-sky-100 text-sky-700 border-sky-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-orange-100 text-orange-700 border-orange-200',
  'bg-teal-100 text-teal-700 border-teal-200',
  'bg-purple-100 text-purple-700 border-purple-200',
  'bg-pink-100 text-pink-700 border-pink-200',
  'bg-lime-100 text-lime-700 border-lime-200',
  'bg-cyan-100 text-cyan-700 border-cyan-200',
];

// Simple string hash function
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Get consistent color for a category
export function getCategoryColor(category: string): string {
  // Check if we have a predefined color
  if (predefinedCategoryColors[category]) {
    return predefinedCategoryColors[category];
  }

  // Generate a consistent color based on category name
  const hash = hashString(category);
  const colorIndex = hash % colorPalette.length;
  return colorPalette[colorIndex];
}
