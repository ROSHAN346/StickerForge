'use client'

import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter'
import { ReactNode } from 'react'

export default function EmotionRegistry({
  children,
}: {
  children: ReactNode
}) {
  return <AppRouterCacheProvider options={{ key: 'mui' }}>{children}</AppRouterCacheProvider>
}
