'use client'

import Script from 'next/script'

export default function TelegramScript() {
  return (
    <Script
      src="https://telegram.org/js/telegram-web-app.js?62"
      strategy="beforeInteractive"
    />
  )
}
