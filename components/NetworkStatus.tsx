
import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, Database } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { gameService } from '../services/gameService';

const NetworkStatus: React.FC = () => {
  const { t } = useLanguage();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(gameService.isSyncing);
  const [showNotification, setShowNotification] = useState(false);
  const [pendingCount, setPendingCount] = useState(gameService.getPendingQueueLength());

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
       setPendingCount(gameService.getPendingQueueLength());
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
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full bg-[#0A1629] border-2 border-[#FFD700]/60 shadow-[4px_4px_0px_black] flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
           <RefreshCw className="w-4 h-4 text-[#FFD700] animate-spin" />
           <span className="text-[10px] font-impact uppercase tracking-widest text-[#FFD700]">
             {t('syncing')}
           </span>
        </div>
      );
  }

  // Show Offline Badge
  if (!isOnline) {
      return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full bg-[#FF2E63] border-2 border-black shadow-[4px_4px_0px_black] flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
           <WifiOff className="w-4 h-4 text-white animate-pulse" />
           <div className="flex flex-col">
              <span className="text-[10px] font-impact uppercase tracking-widest text-white">{t('offline_mode')}</span>
              <span className="text-[8px] text-white/70 font-impact uppercase">
                {pendingCount > 0 ? `${pendingCount} action${pendingCount > 1 ? 's' : ''} en attente` : t('data_saved')}
              </span>
           </div>
        </div>
      );
  }

  // Show "Connected" briefly when coming back online
  if (showNotification && isOnline) {
    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full bg-[#00FF9D] border-2 border-black shadow-[4px_4px_0px_black] flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
            <Wifi className="w-4 h-4 text-black" />
            <span className="text-[10px] font-impact uppercase tracking-widest text-black">{t('connected')}</span>
        </div>
    );
  }

  return null;
};

export default NetworkStatus;
