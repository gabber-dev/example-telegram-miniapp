// hooks/useTelegramWebApp.ts
import { useEffect, useState, useCallback } from 'react'
import { generateToken } from '@/actions'
type TelegramWebAppState = {
  webApp: any | undefined;
  startSession: (
    scenarioId: string,
    personaId: string,
    voice_override: string,
    time_limit_s?: number,
    llm?: string
  ) => Promise<any>;
  isLoaded: boolean;
  error: string | null;
}
export function useTelegramWebApp(): TelegramWebAppState {
  const [webApp, setWebApp] = useState<Window['Telegram'] | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initTelegram = async () => {
      try {
        const app = window.Telegram?.WebApp
        if (app) {
          app.ready()
          setWebApp(app as any)
          setIsLoaded(true)
        } else {
          setError('Telegram WebApp not found')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize Telegram WebApp')
      }
    }

    initTelegram()
  }, [])

  const startSession = useCallback(async (
    scenarioId: string,
    personaId: string,
    voice_override: string,
    time_limit_s: number = 180,
    llm?: string
  ): Promise<any> => {
    if (!webApp) {
      throw new Error('Telegram WebApp not initialized')
    }
    try {
      const userId = webApp?.initDataUnsafe?.user?.id;
      if (!userId) {
        throw new Error('User ID not found');
      }

      // First generate a token
      const tokenData = await generateToken(userId);
      if (!tokenData.token) {
        throw new Error('Failed to generate token')
      }

      // Then start the session
      const sessionData = await startSession(
        scenarioId,
        personaId,
        voice_override,
        time_limit_s,
        llm || '21892bb9-9809-4b6f-8c3e-e40093069f04'
      );
      
      return {
        token: tokenData.token,
        session: sessionData.session
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start session'
      if (webApp?.WebApp) {
        webApp.WebApp.showAlert(errorMessage)
      } else {
        throw new Error('WebApp not found')
      }
      throw err
    }
  }, [webApp])

  return {
    webApp,
    startSession,
    isLoaded,
    error
  }
}