
import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, Database } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { gameService } from '../services/gameService';

const NetworkStatus: React.FC = () => {
  const { t } = useLanguage();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(gameService.isSyncing);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Online/Offline Listeners
    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Sync Status Listener
    const unsubscribe = gameService.subscribeToSyncStatus((status) => {
       setIsSyncing(status);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  // Show Syncing Loader always when syncing
  if (isSyncing) {
      return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full shadow-gold bg-navy-900 border border-gold-500/50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
           <RefreshCw className="w-4 h-4 text-gold-500 animate-spin" />
           <span className="text-xs font-bold uppercase tracking-widest text-gold-400">
             {t('syncing')}
           </span>
        </div>
      );
  }

  // Show Offline Badge
  if (!isOnline) {
      return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full shadow-lg bg-red-900/90 border border-red-500 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
           <WifiOff className="w-4 h-4 text-red-300 animate-pulse" />
           <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-widest text-white">{t('offline_mode')}</span>
              <span className="text-[9px] text-red-200">{t('data_saved')}</span>
           </div>
        </div>
      );
  }

  // Show "Connected" briefly when coming back online
  if (showNotification && isOnline) {
    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full shadow-lg bg-green-900/90 border border-green-500 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
            <Wifi className="w-4 h-4 text-green-300" />
            <span className="text-xs font-bold uppercase tracking-widest text-white">{t('connected')}</span>
        </div>
    );
  }

  return null;
};

export default NetworkStatus;
