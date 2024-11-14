'use client'

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';
type TelegramContextType = {
  webApp: Window['Telegram']['WebApp'] | null;
  startSession: ReturnType<typeof useTelegramWebApp>['startSession'];
  isLoaded: boolean;
  error: string | null;
};

const TelegramContext = createContext<TelegramContextType>({
  webApp: null,
  startSession: async () => { throw new Error('Context not initialized') },
  isLoaded: false,
  error: null
});

export function TelegramProvider({ children }: { children: ReactNode }) {
  const { webApp, startSession, isLoaded, error } = useTelegramWebApp();

  return (
    <TelegramContext.Provider value={{ webApp, startSession, isLoaded, error }}>
      {isLoaded ? children : null}
    </TelegramContext.Provider>
  );
}

export const useTelegram = () => useContext(TelegramContext);