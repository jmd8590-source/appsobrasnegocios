'use client';

import { useEffect, useMemo, useState } from 'react';
import { Compass, ArrowLeft, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

const TOUR_SEEN_KEY = 'scraplens_tour_seen_v1';

const STEP_KEYS = [
  { titleKey: 'tour.navTitle', bodyKey: 'tour.navBody' },
  { titleKey: 'tour.dashboardTitle', bodyKey: 'tour.dashboardBody' },
  { titleKey: 'tour.scanTitle', bodyKey: 'tour.scanBody' },
  { titleKey: 'tour.manualTitle', bodyKey: 'tour.manualBody' },
  { titleKey: 'tour.inventoryTitle', bodyKey: 'tour.inventoryBody' },
  { titleKey: 'tour.lotsTitle', bodyKey: 'tour.lotsBody' },
];

// Single source of truth for the tour's open/step state. AppNav calls this
// ONCE and shares the result with both the mobile-header and desktop-top-bar
// trigger buttons plus the single <ProductTourDialog>. Each of those UI
// pieces is rendered twice (once per breakpoint, CSS-toggled), but a Radix
// Dialog.Root must only ever be mounted once at a time — two simultaneous
// modal instances fight over `aria-hidden` on each other's content and on
// the rest of the page, which broke both accessibility and (in testing)
// made the dialog undetectable by assistive tech / automation alike.
export function useProductTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const seen = window.localStorage.getItem(TOUR_SEEN_KEY);
      if (!seen) {
        setStep(0);
        setOpen(true);
      }
    } catch {
      // ignore — tour just won't auto-open
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function markSeen() {
    try {
      window.localStorage.setItem(TOUR_SEEN_KEY, 'true');
    } catch {
      // ignore
    }
  }

  function close() {
    markSeen();
    setOpen(false);
  }

  function start() {
    setStep(0);
    setOpen(true);
  }

  return { open, step, setStep, close, start };
}

export function TourTriggerButton({ onClick, className }) {
  const { t } = useLanguage();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t('nav.openTour')}
      title={t('tour.start')}
      className={
        className ??
        'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-edge bg-surface-2 text-ink-muted hover:text-ink hover:border-edge-strong transition-colors cursor-pointer'
      }
    >
      <Compass className="w-4 h-4" aria-hidden="true" />
    </button>
  );
}

export function ProductTourDialog({ open, step, setStep, close }) {
  const { t } = useLanguage();
  const steps = useMemo(() => STEP_KEYS, []);
  const isLast = step === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : close())}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-accent" aria-hidden="true" />
            {t(steps[step].titleKey)}
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-ink-muted">{t(steps[step].bodyKey)}</p>

        <div className="flex items-center gap-1.5 mt-5" aria-hidden="true">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-6 bg-accent' : 'w-1.5 bg-edge-strong'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-ink-faint mt-2">
          {t('tour.stepOf', { current: step + 1, total: steps.length })}
        </p>

        <DialogFooter className="sm:justify-between items-center">
          <Button variant="ghost" size="sm" onClick={close} className="gap-1.5 text-ink-faint">
            <X className="w-3.5 h-3.5" aria-hidden="true" />
            {t('tour.skip')}
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={() => setStep((s) => s - 1)} className="gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                {t('tour.prev')}
              </Button>
            )}
            <Button
              variant="amber"
              size="sm"
              onClick={() => (isLast ? close() : setStep((s) => s + 1))}
              className="gap-1.5"
            >
              {isLast ? t('tour.finish') : t('tour.next')}
              {!isLast && <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
