declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string
        initDataUnsafe: { user?: { id: number; first_name: string; last_name?: string; username?: string } }
        ready: () => void
        expand: () => void
        close: () => void
        BackButton: { show: () => void; hide: () => void; onClick: (fn: () => void) => void }
        MainButton: { text: string; show: () => void; hide: () => void; onClick: (fn: () => void) => void; showProgress: (leaveActive?: boolean) => void; hideProgress: () => void; setParams: (p: object) => void }
        themeParams: { bg_color?: string; text_color?: string }
        colorScheme: 'light' | 'dark'
        version: string
      }
    }
  }
}

export const tg = window.Telegram?.WebApp

export function isTelegram(): boolean {
  return !!(tg?.initData)
}

export function getTelegramInitData(): string {
  if (tg?.initData) return tg.initData
  // Dev mock
  const mockUser = JSON.stringify({ id: 123456789, first_name: 'Dev', last_name: 'User', username: 'devuser' })
  const authDate = Math.floor(Date.now() / 1000)
  return `user=${encodeURIComponent(mockUser)}&auth_date=${authDate}&hash=devhash`
}

export function tgReady() {
  tg?.ready()
  tg?.expand()
}
