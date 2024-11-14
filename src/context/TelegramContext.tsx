'use client'

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';
type TelegramContextType = {
  webApp: ReturnType<typeof useTelegramWebApp>;
  isLoaded: boolean;
};

const TelegramContext = createContext<TelegramContextType>({
  webApp: null,
  isLoaded: false,
});

export function TelegramProvider({ children }: { children: ReactNode }) {
  const webApp = useTelegramWebApp();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (webApp && !isInitialized) {
      setIsInitialized(true);
    }
  }, [webApp, isInitialized]);

  return (
    <TelegramContext.Provider value={{ webApp, isLoaded: isInitialized }}>
      {isInitialized ? children : null}
    </TelegramContext.Provider>
  );
}

export const useTelegram = () => useContext(TelegramContext);