// hooks/useTelegramWebApp.ts
import { useEffect, useState, useCallback } from 'react'
import { startGabberSession, generateToken } from '@/actions'

type TelegramWebAppState = {
  webApp: Window['Telegram']['WebApp'] | null;
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
  const [webApp, setWebApp] = useState<Window['Telegram']['WebApp'] | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initTelegram = async () => {
      try {
        const app = window.Telegram?.WebApp
        if (app) {
          app.ready()
          setWebApp(app)
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
  ) => {
    if (!webApp) {
      throw new Error('Telegram WebApp not initialized')
    }

    try {
      const data = await startGabberSession(
        scenarioId,
        personaId,
        voice_override,
        time_limit_s,
        llm || '21892bb9-9809-4b6f-8c3e-e40093069f04'
      )
      
      if (!data.connection_details?.url || !data.connection_details?.token || !data.session?.id) {
        throw new Error('Invalid session data received')
      }

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start session'
      webApp.showAlert(errorMessage)
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