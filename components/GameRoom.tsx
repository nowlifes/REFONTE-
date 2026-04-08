import React, { useCallback } from 'react';
import { AppView } from '../types';
import { useSessionGuard } from '../hooks/useSessionGuard';
import BackgroundParticles from './BackgroundParticles';
import ShieldLogo from './ShieldLogo';

interface GameRoomProps {
  /** Called to change the current app view */
  setView: (view: AppView) => void;
  /** The rest of the app — rendered only when the session is valid */
  children: React.ReactNode;
}

/**
 * GameRoom — security gate for the entire game flow.
 *
 * Activated only when a ?s=UUID param is present in the URL (players who
 * arrived via QR code). When no param is present, children are rendered
 * directly and the existing event_session lock remains in charge.
 *
 * Three security layers (via useSessionGuard):
 *  1. Route guard on mount — verifies session UUID exists and is 'open'.
 *  2. Realtime kick — session row UPDATE → redirect to GAME_OVER instantly.
 *  3. Pre-creation guard — gameService.createUser re-validates before INSERT.
 */
const GameRoom: React.FC<GameRoomProps> = ({ setView, children }) => {
  const handleKick = useCallback(() => {
    setView(AppView.GAME_OVER);
  }, [setView]);

  const { isValid, isLoading, sessionId } = useSessionGuard(handleKick);

  // No QR param in URL → render normally, existing lock handles it
  if (!sessionId) {
    return <>{children}</>;
  }

  // Validating session UUID against Supabase
  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#0A1629] flex flex-col items-center justify-center relative">
        <BackgroundParticles />
        <div className="w-24 h-24 mb-6 relative">
          <div className="absolute inset-0 border-4 border-[#FFD700]/30 rounded-full animate-pulse" />
          <div className="absolute inset-0 border-t-4 border-[#FFD700] rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <ShieldLogo className="w-12 h-12 animate-pulse" />
          </div>
        </div>
        <p className="text-[#FFD700] font-impact uppercase text-xl tracking-widest animate-pulse">
          VÉRIFICATION...
        </p>
      </div>
    );
  }

  // Session is closed or UUID unknown → onKick already set view to GAME_OVER,
  // but we render nothing here to avoid a flash before the view switch.
  if (!isValid) {
    return null;
  }

  // Valid session → full game access
  return <>{children}</>;
};

export default GameRoom;
