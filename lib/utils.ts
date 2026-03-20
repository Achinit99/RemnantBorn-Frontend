/**
 * What: Shared utility helpers used across UI modules.
 * Why: Keeps common low-level helpers (like class merging) in one tiny import path.
 */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
