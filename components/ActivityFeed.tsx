
import React, { useState, useEffect } from 'react';
import { Activity } from '../types';
import { gameService } from '../services/gameService';
import { Trophy, Zap } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const ActivityFeed: React.FC = () => {
  const { t } = useLanguage();
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    // Initial fetch
    gameService.getRecentActivities(3).then(setActivities);

    // Real-time subscription
    const unsubscribe = gameService.subscribeToActivities((newActivity) => {
      setActivities(prev => [newActivity, ...prev].slice(0, 3));
    });

    return () => unsubscribe();
  }, []);

  if (activities.length === 0) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] w-full max-w-[350px] pointer-events-none px-4 space-y-2">
      {activities.map((activity, index) => (
        <div 
          key={activity.id} 
          className={`
            flex items-center gap-3 bg-black/85 border border-white/15 p-2 rounded-xl shadow-lg
            animate-in fade-in slide-in-from-top-2 duration-500
            ${index === 0 ? 'scale-100 opacity-100' : index === 1 ? 'scale-95 opacity-60' : 'scale-90 opacity-30'}
          `}
        >
          <div className="w-8 h-8 bg-[#FFD700] rounded-lg flex items-center justify-center shrink-0">
             <span className="text-lg leading-none">{activity.player_emoji}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-impact uppercase tracking-tighter text-[#FFD700] truncate">
              {activity.player_pseudo}
            </p>
            <p className="text-[9px] font-impact uppercase tracking-widest text-white leading-none">
              {activity.type === 'LINE_COMPLETED' ? t('line_completed_msg')
                : activity.type === 'BOOST_WON' ? '🏆 A reçu un boost du groupe !'
                : t('grid_completed_msg')}
            </p>
          </div>
          <div className="shrink-0">
            {activity.type === 'LINE_COMPLETED' ? (
              <Zap className="w-4 h-4 text-[#FFD700] animate-pulse" fill="currentColor" />
            ) : activity.type === 'BOOST_WON' ? (
              <span className="text-base animate-bounce">🎁</span>
            ) : (
              <Trophy className="w-4 h-4 text-[#FFD700] animate-bounce" fill="currentColor" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityFeed;
