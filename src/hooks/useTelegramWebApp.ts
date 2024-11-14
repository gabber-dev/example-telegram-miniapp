// hooks/useTelegramWebApp.ts
import { useEffect, useState } from 'react'

declare global {
  interface Window {
    Telegram?: {
      WebApp: unknown
    }
  }
}

export function useTelegramWebApp() {
  const [webApp, setWebApp] = useState<unknown>(null)

  useEffect(() => {
    const app = window.Telegram?.WebApp
    if (app) {
      app.ready()
      setWebApp(app)
    }
  }, [])

  return webApp
}