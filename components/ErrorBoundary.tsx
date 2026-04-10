/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

interface State { hasError: boolean; error: any }

// useDefineForClassFields:false — must use prototype-style class
export class ErrorBoundary extends React.Component<{ children: React.ReactNode; fallback?: React.ReactNode }, State> {
  constructor(props: any) {
    super(props);
    (this as any).state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  render() {
    if ((this as any).state.hasError) {
      if ((this as any).props.fallback) return (this as any).props.fallback;
      return (
        <div className="fixed inset-0 bg-[#0A1629] flex flex-col items-center justify-center p-8 text-center z-[500]">
          <div className="text-6xl mb-6">💥</div>
          <h2 className="font-impact text-white uppercase text-2xl tracking-tighter mb-2">
            Oops, crash !
          </h2>
          <p className="font-impact text-white/40 uppercase text-[10px] tracking-widest mb-8">
            {(this as any).state.error?.message || 'Erreur inattendue'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#FFD700] text-black font-impact uppercase text-sm px-6 py-3 rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_black] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            Recharger
          </button>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

export default ErrorBoundary;
