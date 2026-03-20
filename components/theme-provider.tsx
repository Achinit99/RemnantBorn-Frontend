/**
 * What: Thin wrapper around next-themes provider for app-wide theme context.
 * Why: Centralizes theme-provider usage so root wiring stays clean.
 */
'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
