interface TelegramWebApp {
    ready: () => void;
    expand: () => void;
    close: () => void;
    showAlert: (message: string) => void;
    MainButton: {
      text: string;
      color: string;
      textColor: string;
      isVisible: boolean;
      isActive: boolean;
      setText: (text: string) => void;
      onClick: (callback: () => void) => void;
      show: () => void;
      hide: () => void;
      enable: () => void;
      disable: () => void;
    };
    onEvent: (eventType: string, callback: () => void) => void;
    offEvent: (eventType: string, callback: () => void) => void;
    colorScheme: 'light' | 'dark';
    initDataUnsafe: {
      user?: {
        id: number;
        first_name: string;
        last_name?: string;
        username?: string;
        language_code?: string;
      };
      start_param?: string;
    };
  }
  
  declare global {
    interface Window {
      Telegram?: {
        WebApp: TelegramWebApp;
      };
    }
  }
  
  export {}