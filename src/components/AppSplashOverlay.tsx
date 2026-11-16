import React, { useEffect } from 'react';
import { OrbitalBrandMark } from './OrbitalBrandMark';

interface AppSplashOverlayProps {
  onFinished: () => void;
}

export const AppSplashOverlay: React.FC<AppSplashOverlayProps> = ({ onFinished }) => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      let alreadySeen = false;
      try {
        alreadySeen = window.sessionStorage.getItem('salvia_splash_seen') === '1';
        window.sessionStorage.setItem('salvia_splash_seen', '1');
      } catch {
        // ignore storage errors
      }
      if (params.get('autostart') === '1' || reduced || alreadySeen) {
        onFinished();
        return;
      }
    }
    const timer = window.setTimeout(onFinished, 480);
    return () => window.clearTimeout(timer);
  }, [onFinished]);

  return (
    <div
      role="presentation"
      onClick={onFinished}
      className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-[var(--salvia-bg)]"
    >
      <div className="relative flex flex-col items-center justify-center">
        <div
          className="animate-salvia-halo pointer-events-none absolute h-[280px] w-[280px] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(143,107,255,0.26) 0%, rgba(76,196,255,0.16) 46%, rgba(217,174,84,0.08) 66%, rgba(0,0,0,0) 76%)',
          }}
        />
        <div className="animate-salvia-splash relative flex flex-col items-center gap-4">
          <OrbitalBrandMark size={160} showRing={false} />
        </div>
      </div>
    </div>
  );
};
