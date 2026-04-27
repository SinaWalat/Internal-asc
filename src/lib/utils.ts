import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function safeTimestampToDate(timestamp: any): Date | null {
  if (!timestamp) return null;
  if (timestamp.toDate && typeof timestamp.toDate === 'function') return timestamp.toDate();
  if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
  if (typeof timestamp === 'string') return new Date(timestamp);
  if (timestamp instanceof Date) return timestamp;
  return null;
}
