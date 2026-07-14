'use client'

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }
}

export interface TelegramWebApp {
  initData: string
  initDataUnsafe: {
    user?: {
      id: number
      first_name: string
      last_name?: string
      username?: string
      language_code?: string
      photo_url?: string
    }
  }
  version: string
  platform: string
  colorScheme: 'light' | 'dark'
  themeParams: Record<string, string>
  isExpanded: boolean
  viewportHeight: number
  viewportStableHeight: number
  headerColor: string
  backgroundColor: string
  isClosingConfirmationEnabled: boolean
  isActive: boolean
  MainButton: {
    text: string
    color: string
    textColor: string
    isVisible: boolean
    isActive: boolean
    show: () => void
    hide: () => void
    setText: (text: string) => void
    onClick: (cb: () => void) => void
    offClick: (cb: () => void) => void
    enable: () => void
    disable: () => void
    showProgress: () => void
    hideProgress: () => void
  }
  BackButton: {
    isVisible: boolean
    show: () => void
    hide: () => void
    onClick: (cb: () => void) => void
    offClick: (cb: () => void) => void
  }
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void
    selectionChanged: () => void
  }
  ready: () => void
  expand: () => void
  close: () => void
  openTelegramLink: (url: string) => void
  openLink: (url: string) => void
  setHeaderColor: (color: string) => void
  setBackgroundColor: (color: string) => void
  enableClosingConfirmation: () => void
  disableClosingConfirmation: () => void
  onEvent: (event: string, handler: () => void) => void
  offEvent: (event: string, handler: () => void) => void
}

export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp
  }
  return null
}

export function isInsideTelegram(): boolean {
  if (typeof window === 'undefined') return false
  return !!window.Telegram?.WebApp?.initDataUnsafe?.user
}

export function getTelegramUserId(): number | null {
  const tg = getTelegramWebApp()
  return tg?.initDataUnsafe?.user?.id ?? null
}

export function initTelegramWebApp() {
  const tg = getTelegramWebApp()
  if (!tg) return
  tg.ready()
  tg.expand()
  tg.setHeaderColor('#141218')
  tg.setBackgroundColor('#141218')
}

export function haptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  const tg = getTelegramWebApp()
  tg?.HapticFeedback?.impactOccurred(type)
}

export function hapticNotify(type: 'success' | 'error' | 'warning') {
  const tg = getTelegramWebApp()
  tg?.HapticFeedback?.notificationOccurred(type)
}

export function hapticSelect() {
  const tg = getTelegramWebApp()
  tg?.HapticFeedback?.selectionChanged()
}
