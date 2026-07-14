'use client'

import { getTelegramWebApp, haptic } from './telegram'

export function openTelegramLink(url: string): boolean {
  haptic('light')
  return _fallbackOpen(url)
}

export function openExternalLink(url: string): boolean {
  haptic('light')
  return _fallbackOpen(url)
}

function _fallbackOpen(url: string): boolean {
  try {
    const a = document.createElement('a')
    a.href = url
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    return true
  } catch {
    try {
      window.open(url, '_blank')
      return true
    } catch {
      return false
    }
  }
}

export function openTelegramApp(packName: string): boolean {
  haptic('medium')
  return _fallbackOpen(`https://t.me/addstickers/${packName}`)
}

export function openTelegramWeb(packName: string): boolean {
  haptic('light')
  return _fallbackOpen(`https://web.telegram.org/a/#addstickers=${packName}`)
}

export function copyToClipboard(text: string): boolean {
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function' && window.isSecureContext) {
      navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // clipboard API failed — fall through to legacy method
  }

  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.top = '-9999px'
    textarea.style.left = '-9999px'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}
