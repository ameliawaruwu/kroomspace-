import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalizes input so user only inputs/edits digits after +62.
 * Strips non-digits, leading +62/62, and leading 0s.
 * Example: '08123456789' -> '8123456789'
 * Example: '+628123456789' -> '8123456789'
 */
export function cleanIndonesianPhoneDigits(val?: string | null): string {
  if (!val) return '';
  let digits = val.replace(/\D/g, '');
  if (digits.startsWith('62')) {
    digits = digits.slice(2);
  }
  digits = digits.replace(/^0+/, '');
  return digits;
}

/**
 * Standardizes cleaned digits into standard +62 E.164 format.
 * Example: '8123456789' -> '+628123456789'
 */
export function formatToE164Indonesian(digits?: string | null): string {
  const cleaned = cleanIndonesianPhoneDigits(digits);
  return cleaned ? `+62${cleaned}` : '';
}
