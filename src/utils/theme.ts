// utils/theme.ts
export const getThemeParams = () => {
    const webApp = window.Telegram?.WebApp;
    
    if (!webApp) return null;
  
    return {
      backgroundColor: webApp.backgroundColor,
      textColor: webApp.textColor,
      buttonColor: webApp.buttonColor,
      buttonTextColor: webApp.buttonTextColor,
      isDarkMode: webApp.colorScheme === 'dark'
    };
  };