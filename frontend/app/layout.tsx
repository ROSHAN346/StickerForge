import type { Metadata, Viewport } from 'next'
import { roboto } from '@/lib/fonts'
import EmotionRegistry from './registry'
import TelegramScript from '@/components/TelegramScript'
import AppShell from '@/components/AppShell'
import ThemeProviderWrapper from '@/components/ThemeProviderWrapper'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sticker Forge — Telegram Sticker Generator',
  description: 'Create custom Telegram sticker packs from images, GIFs, and videos. Paste your bot token, upload, and get a shareable link.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#141218',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={roboto.variable} suppressHydrationWarning>
      <head>
        <TelegramScript />
      </head>
      <body suppressHydrationWarning>
        <EmotionRegistry>
          <ThemeProviderWrapper>
            <AppShell>{children}</AppShell>
          </ThemeProviderWrapper>
        </EmotionRegistry>
      </body>
    </html>
  )
}
