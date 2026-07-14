'use client'

import { ThemeProvider, CssBaseline } from '@mui/material'
import { md3DarkTheme } from '@/theme/md3-dark'
import { ReactNode } from 'react'

export default function ThemeProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={md3DarkTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
