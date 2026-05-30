// Legacy Telegram WebApp API - Not used in web version
// This file is kept for reference only

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string
        ready: () => void
        expand: () => void
      }
    }
  }
}

export const tg = window.Telegram?.WebApp

export function isTelegram(): boolean {
  return false // Always false - we're a web app now
}

export function getTelegramInitData(): string {
  return '' // Not used
}

export function tgReady() {
  // Not used
}
