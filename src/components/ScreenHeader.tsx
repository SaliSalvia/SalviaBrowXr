import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useApp } from '../store/AppContext';

interface ScreenHeaderProps {
  title: string;
  onBack: () => void;
  actions?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, onBack, actions }) => {
  const { isRtl, t } = useApp();

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--salvia-border)]/70 bg-[var(--salvia-deep-cosmic)]/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            aria-label={t('go_back')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[var(--salvia-text)] transition-colors hover:bg-[var(--salvia-elevated)] md:hidden"
          >
            {isRtl ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
          </button>
          <h1 className="font-display truncate text-[18px] font-bold tracking-tight text-[var(--salvia-text)]">
            {title}
          </h1>
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
      </div>
    </header>
  );
};
