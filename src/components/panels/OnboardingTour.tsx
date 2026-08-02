import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Joyride, EVENTS, STATUS } from 'react-joyride';
import type { Step, TooltipRenderProps, EventData, Controls } from 'react-joyride';

type WalkthroughPhase = 'welcome' | 'tour' | 'done';

/* Joyride draws the cutout as an SVG path over the target, so a stroke here
   outlines the highlighted element and the fill tints it. Without this the
   spotlight is only an undimmed hole, which barely reads on a dark map. */
const SPOTLIGHT_RING = {
  fill: 'rgba(210, 176, 112, 0.07)',
  stroke: 'rgba(210, 176, 112, 0.9)',
  strokeWidth: 1.5,
  style: {
    pointerEvents: 'none' as const,
    filter: 'drop-shadow(0 0 12px rgba(210, 176, 112, 0.55))',
    animation: 'holoTourSpotlight 2.4s ease-in-out infinite',
  },
};

interface TourStep extends Step {
  data?: {
    hint?: string;
  };
}

function buildTourSteps(isAdmin: boolean): TourStep[] {
  return [
    {
      target: '[data-tour="galaxy-canvas"]',
      title: 'The Galaxy Map',
      content:
        'This is your interactive galaxy. Pan by dragging, zoom with the scroll wheel, and click any star system to inspect it.',
      placement: 'center' as const,
      skipBeacon: true,
      data: { hint: 'Try clicking a star system after the tour' },
    },
    {
      target: '[data-tour="icon-rail"]',
      title: 'Command Modules',
      content:
        'These icons open different panels: Search lets you find systems by name, Galaxy Overview shows faction stats, and Map Controls toggles map layers.',
      placement: 'right' as const,
      skipBeacon: true,
    },
    {
      target: '[data-tour="bottom-action-bar"]',
      title: 'Map Controls',
      content: isAdmin
        ? 'Toggle system labels, fleet markers, and faction filters. As an admin, you can also create new star systems and fleets.'
        : 'Toggle system labels, fleet markers, and filter the map by faction.',
      placement: 'top' as const,
      skipBeacon: true,
    },
    {
      target: '[data-tour="zoom-controls"]',
      title: 'Zoom Controls',
      content: 'Zoom in, zoom out, or reset your camera. You can also use your scroll wheel.',
      placement: 'left' as const,
      skipBeacon: true,
      isFixed: true,
    },
  ];
}

function WelcomeModal({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  const [page, setPage] = useState(0);

  const pages = [
    {
      title: 'Welcome, Commander',
      body: 'You\'ve been granted access to the Holonet Galaxy Map \u2014 an interactive star chart of the Old Republic era.',
    },
    {
      title: 'What You Can Do',
      body: 'Explore star systems, inspect planets, track fleet movements, search the galaxy, and view faction territories across the timeline.',
    },
    {
      title: 'Quick Tour',
      body: 'We\'ll walk you through the key controls so you can start exploring right away. Ready?',
    },
  ];

  const current = pages[page];
  const isLast = page === pages.length - 1;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      <motion.div
        className="absolute inset-0 bg-[rgba(5,5,8,0.85)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      />

      <motion.div
        className="holo-panel relative z-10"
        style={{
          maxWidth: 420,
          width: '90vw',
          padding: '32px 32px 24px',
          borderColor: 'rgba(200, 170, 110, 0.3)',
        }}
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{
          opacity: 0,
          scale: 0.96,
          y: 12,
          // Short: fading drops the panel's backdrop-filter, so the glass reads
          // as flat while it leaves. Quick enough that you don't catch it.
          transition: { duration: 0.16, ease: 'easeIn' },
        }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            margin: '0 auto 16px',
            borderRadius: '50%',
            border: '2px solid rgba(200, 170, 110, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(200, 170, 110, 0.8)" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="4" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
          </svg>
        </div>

        <h2
          style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--holo-amber)',
            textAlign: 'center',
            marginBottom: 12,
          }}
        >
          {current.title}
        </h2>

        <p
          style={{
            fontFamily: 'Oxanium, Orbitron, monospace',
            fontSize: 14,
            lineHeight: 1.7,
            color: 'rgba(255, 255, 255, 0.8)',
            textAlign: 'center',
            marginBottom: 24,
            minHeight: 48,
          }}
        >
          {current.body}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
          {pages.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === page ? 24 : 8,
                height: 4,
                borderRadius: 2,
                backgroundColor: i === page ? 'var(--holo-amber)' : 'rgba(200, 170, 110, 0.25)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={onSkip}
            style={{
              background: 'none',
              border: 'none',
              fontFamily: 'Oxanium, monospace',
              fontSize: 11,
              color: 'rgba(255, 255, 255, 0.4)',
              cursor: 'pointer',
              padding: '4px 8px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Skip Tour
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            {page > 0 && (
              <button onClick={() => setPage((p) => p - 1)} className="holo-button holo-button-sm">
                Back
              </button>
            )}
            {isLast ? (
              <button onClick={onStart} className="holo-button holo-button-sm">
                Begin
              </button>
            ) : (
              <button onClick={() => setPage((p) => p + 1)} className="holo-button holo-button-sm">
                Next
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function HoloTooltip({
  index,
  step,
  size,
  isLastStep,
  backProps,
  primaryProps,
  skipProps,
  tooltipProps,
}: TooltipRenderProps) {
  const tourStep = step as TourStep;
  const hint = tourStep.data?.hint;

  return (
    <div
      {...tooltipProps}
      style={{
        maxWidth: 360,
        padding: '20px 24px 16px',
        background:
          'linear-gradient(160deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 40%, rgba(200, 170, 110, 0.05) 100%), rgba(10, 12, 18, 0.88)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        borderRadius: 18,
        boxShadow:
          'inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 24px 48px -16px rgba(0, 0, 0, 0.65)',
      }}
    >
      {step.title && (
        <h3
          style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--holo-amber)',
            marginBottom: 8,
          }}
        >
          {step.title}
        </h3>
      )}

      <p
        style={{
          fontFamily: 'Oxanium, Orbitron, monospace',
          fontSize: 13,
          lineHeight: 1.6,
          color: 'rgba(255, 255, 255, 0.8)',
          marginBottom: hint ? 12 : 16,
        }}
      >
        {step.content}
      </p>

      {hint && (
        <p
          style={{
            fontFamily: 'Oxanium, monospace',
            fontSize: 11,
            color: 'var(--holo-cyan)',
            letterSpacing: '0.04em',
            marginBottom: 16,
            opacity: 0.8,
          }}
        >
          {hint}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontFamily: 'Oxanium, monospace',
            fontSize: 11,
            color: 'rgba(200, 170, 110, 0.5)',
            letterSpacing: '0.1em',
          }}
        >
          {index + 1} / {size}
        </span>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            {...skipProps}
            style={{
              background: 'none',
              border: 'none',
              fontFamily: 'Oxanium, monospace',
              fontSize: 11,
              color: 'rgba(255, 255, 255, 0.4)',
              cursor: 'pointer',
              padding: '4px 8px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Skip Tour
          </button>

          {index > 0 && (
            <button {...backProps} className="holo-button holo-button-sm">
              Back
            </button>
          )}

          <button {...primaryProps} className="holo-button holo-button-sm">
            {isLastStep ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface OnboardingTourProps {
  run: boolean;
  onFinish: () => void;
  isAdmin: boolean;
  storageKey: string;
}

export function OnboardingTour({ run, onFinish, isAdmin, storageKey }: OnboardingTourProps) {
  const [phase, setPhase] = useState<WalkthroughPhase>('welcome');
  const [stepIndex, setStepIndex] = useState(0);
  const [tourKey, setTourKey] = useState(0);

  const tourSteps = useMemo(() => buildTourSteps(isAdmin), [isAdmin]);

  const completeTour = useCallback(() => {
    localStorage.setItem(storageKey, 'true');
    setPhase('done');
    onFinish();
  }, [onFinish, storageKey]);

  const startTour = useCallback(() => {
    setStepIndex(0);
    setTourKey((k) => k + 1);
    setPhase('tour');
  }, []);

  useEffect(() => {
    if (!run) {
      setPhase('welcome');
      setStepIndex(0);
    }
  }, [run]);

  const handleEvent = useCallback(
    (data: EventData, controls: Controls) => {
      const { type, action, status, index } = data;

      if (type === EVENTS.TARGET_NOT_FOUND) {
        controls.next();
        return;
      }

      if (type === EVENTS.TOUR_END) {
        if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
          completeTour();
        }
      }

      if (type === EVENTS.STEP_AFTER) {
        if (action === 'next' || action === 'prev') {
          setStepIndex(action === 'next' ? index + 1 : index - 1);
        }
      }
    },
    [completeTour],
  );

  if (!run) return null;

  return (
    <>
      <AnimatePresence>
        {phase === 'welcome' && (
          <WelcomeModal
            onStart={startTour}
            onSkip={completeTour}
          />
        )}
      </AnimatePresence>

      {phase === 'tour' && (
        <Joyride
          key={tourKey}
          steps={tourSteps}
          run
          stepIndex={stepIndex}
          continuous
          tooltipComponent={HoloTooltip}
          scrollToFirstStep={false}
          onEvent={handleEvent}
          styles={{ spotlight: SPOTLIGHT_RING }}
          options={{
            arrowColor: 'rgba(210, 176, 112, 0.95)',
            arrowBase: 22,
            arrowSize: 11,
            overlayColor: 'rgba(4, 6, 12, 0.82)',
            spotlightPadding: 12,
            spotlightRadius: 18,
            zIndex: 10001,
            skipScroll: true,
            blockTargetInteraction: false,
          }}
        />
      )}
    </>
  );
}
