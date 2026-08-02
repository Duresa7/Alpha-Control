import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router';
import { GalaxyScene } from '@/components/galaxy/GalaxyScene';
import { InfoPanel } from '@/components/panels/InfoPanel';
import { IconRail } from '@/components/panels/IconRail';
import { BottomActionBar } from '@/components/panels/BottomActionBar';
import { SearchBar } from '@/components/panels/SearchBar';
import { TimelineControl } from '@/components/panels/TimelineControl';
import { GalaxyOverview } from '@/components/panels/GalaxyOverview';
import { MapControlsPanel } from '@/components/panels/MapControlsPanel';
import { LoadingScreen } from '@/components/panels/LoadingScreen';
import { OnboardingTour } from '@/components/panels/OnboardingTour';
import { HoloMicroExpander } from '@/components/panels/HoloMicroExpander';
import { useGalaxySelectionStore } from '@/store/galaxySelectionStore';
import { useGalaxyDataStore } from '@/store/galaxyDataStore';
import { useGalaxyUIStore } from '@/store/galaxyUIStore';
import { useFactionStore } from '@/store/factionStore';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import { getUserIdentity } from '@/utils/getUserIdentity';


const TOUR_STORAGE_KEY = 'onboarding_tour_completed';

function drawLabelToCanvas(
  ctx: CanvasRenderingContext2D,
  el: HTMLElement,
  text: string,
  canvasRect: DOMRect,
  scaleX: number,
  scaleY: number,
) {
  const elRect = el.getBoundingClientRect();
  const x = (elRect.left - canvasRect.left + elRect.width / 2) * scaleX;
  const y = (elRect.top - canvasRect.top + elRect.height / 2) * scaleY;

  const styles = window.getComputedStyle(el);
  const fontSize = parseFloat(styles.fontSize) * scaleX;

  const paddingX = 6 * scaleX;
  const paddingY = 3 * scaleY;
  const radius = 4 * scaleX;

  ctx.font = `${styles.fontWeight} ${fontSize}px sans-serif`;
  const textWidth = ctx.measureText(text).width;

  const boxX = x - textWidth / 2 - paddingX;
  const boxY = y - fontSize / 2 - paddingY;
  const boxW = textWidth + paddingX * 2;
  const boxH = fontSize + paddingY * 2;

  ctx.fillStyle = styles.backgroundColor;
  ctx.beginPath();
  ctx.moveTo(boxX + radius, boxY);
  ctx.lineTo(boxX + boxW - radius, boxY);
  ctx.quadraticCurveTo(boxX + boxW, boxY, boxX + boxW, boxY + radius);
  ctx.lineTo(boxX + boxW, boxY + boxH - radius);
  ctx.quadraticCurveTo(boxX + boxW, boxY + boxH, boxX + boxW - radius, boxY + boxH);
  ctx.lineTo(boxX + radius, boxY + boxH);
  ctx.quadraticCurveTo(boxX, boxY + boxH, boxX, boxY + boxH - radius);
  ctx.lineTo(boxX, boxY + radius);
  ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);
  ctx.closePath();
  ctx.fill();

  const borderColor = styles.borderBottomColor;
  if (borderColor && borderColor !== 'transparent') {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2 * scaleX;
    ctx.beginPath();
    ctx.moveTo(boxX, boxY + boxH);
    ctx.lineTo(boxX + boxW, boxY + boxH);
    ctx.stroke();
  }

  const shadow = styles.textShadow;
  if (shadow && shadow !== 'none') {
    const match = shadow.match(/^(rgba?\([^)]+\))/);
    if (match) {
      ctx.shadowColor = match[1];
      ctx.shadowBlur = 10 * scaleX;
    }
  }

  ctx.fillStyle = styles.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}

function drawTitleToCanvas(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  scaleX: number,
  scaleY: number,
  label: string,
) {
  const cx = canvasWidth / 2;
  const titleFontSize = 20 * scaleX;
  const labelFontSize = 12 * scaleX;
  const titleY = 30 * scaleY;
  const labelY = titleY + titleFontSize + 8 * scaleY;
  const textColor = 'rgba(255, 255, 255, 0.8)';
  const amberColor = 'rgba(200, 170, 110, 0.5)';

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = `900 ${titleFontSize}px Orbitron, monospace`;
  ctx.letterSpacing = `${0.3 * titleFontSize}px`;
  ctx.fillStyle = textColor;
  ctx.fillText('TNIO x ALPHASEC', cx, titleY);
  ctx.letterSpacing = '0px';

  ctx.font = `700 ${labelFontSize}px Oxanium, Orbitron, monospace`;
  ctx.letterSpacing = `${0.3 * labelFontSize}px`;
  const labelText = label.toUpperCase();
  const labelWidth = ctx.measureText(labelText).width;
  ctx.fillStyle = textColor;
  ctx.fillText(labelText, cx, labelY);
  ctx.letterSpacing = '0px';

  const dotRadius = 3 * scaleX;
  const dotGap = 6 * scaleX;
  const lineLen = 48 * scaleX;

  ctx.fillStyle = amberColor;
  ctx.beginPath();
  ctx.arc(cx - labelWidth / 2 - dotGap, labelY, dotRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + labelWidth / 2 + dotGap, labelY, dotRadius, 0, Math.PI * 2);
  ctx.fill();

  const lineStart = cx - labelWidth / 2 - dotGap * 2 - dotRadius;
  const grad1 = ctx.createLinearGradient(lineStart - lineLen, 0, lineStart, 0);
  grad1.addColorStop(0, 'transparent');
  grad1.addColorStop(1, 'rgba(200, 170, 110, 0.3)');
  ctx.strokeStyle = grad1;
  ctx.lineWidth = 1 * scaleX;
  ctx.beginPath();
  ctx.moveTo(lineStart - lineLen, labelY);
  ctx.lineTo(lineStart, labelY);
  ctx.stroke();

  const lineEnd = cx + labelWidth / 2 + dotGap * 2 + dotRadius;
  const grad2 = ctx.createLinearGradient(lineEnd, 0, lineEnd + lineLen, 0);
  grad2.addColorStop(0, 'rgba(200, 170, 110, 0.3)');
  grad2.addColorStop(1, 'transparent');
  ctx.strokeStyle = grad2;
  ctx.beginPath();
  ctx.moveTo(lineEnd, labelY);
  ctx.lineTo(lineEnd + lineLen, labelY);
  ctx.stroke();
}

export function MapPage() {
  const viewMode = useGalaxySelectionStore((s) => s.viewMode);
  const setSelectedSystem = useGalaxySelectionStore((s) => s.setSelectedSystem);
  const setSelectedFleet = useGalaxySelectionStore((s) => s.setSelectedFleet);
  const requestCameraReset = useGalaxySelectionStore((s) => s.requestCameraReset);
  const requestZoom = useGalaxySelectionStore((s) => s.requestZoom);
  const initializeData = useGalaxyDataStore((s) => s.initializeData);
  const hasPendingChanges = useGalaxyDataStore((s) => s.hasPendingChanges);
  const saveAllChanges = useGalaxyDataStore((s) => s.saveAllChanges);
  const discardAllChanges = useGalaxyDataStore((s) => s.discardAllChanges);
  const { session, profile, signOut } = useAuth();
  const { isAdmin } = useRole();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [uiHidden, setUiHidden] = useState(false);
  const [tourRunning, setTourRunning] = useState(false);
  const [tourReady, setTourReady] = useState(false);
  const realtimeRefreshTimeoutRef = useRef<number | null>(null);
  const factionRefreshTimeoutRef = useRef<number | null>(null);
  const viewLabel = viewMode === 'topdown' ? 'Galaxy Map' : viewMode === 'system' ? 'Planet View' : 'Fleet View';

  const handleDownloadMap = useCallback(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const canvasRect = canvas.getBoundingClientRect();
    const offscreen = document.createElement('canvas');
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(canvas, 0, 0);

    const scaleX = canvas.width / canvasRect.width;
    const scaleY = canvas.height / canvasRect.height;

    document.querySelectorAll<HTMLElement>('[data-map-label]').forEach((el) => {
      const text = el.textContent?.trim();
      if (!text) return;
      drawLabelToCanvas(ctx, el, text, canvasRect, scaleX, scaleY);
    });

    drawTitleToCanvas(ctx, offscreen.width, scaleX, scaleY, viewLabel);

    const link = document.createElement('a');
    link.download = 'galaxy-map.png';
    link.href = offscreen.toDataURL('image/png');
    link.click();
  }, [viewLabel]);
  const { displayName } = getUserIdentity(session, profile, 'Signed In');
  useEffect(() => {
    const init = async () => {
      const factionStore = useFactionStore.getState();
      await factionStore.initializeFactions();
      useGalaxyUIStore.getState().syncFactionFilters(factionStore.getFactionIds());
      await initializeData();
    };
    void init();

    if (!supabaseConfigured) return;

    const scheduleRealtimeRefresh = () => {
      if (realtimeRefreshTimeoutRef.current !== null) {
        window.clearTimeout(realtimeRefreshTimeoutRef.current);
      }

      realtimeRefreshTimeoutRef.current = window.setTimeout(() => {
        realtimeRefreshTimeoutRef.current = null;
        const dataState = useGalaxyDataStore.getState();
        if (dataState.hasPendingChanges) return;
        void dataState.initializeData();
      }, 300);
    };

    const scheduleFactionRefresh = () => {
      if (factionRefreshTimeoutRef.current !== null) {
        window.clearTimeout(factionRefreshTimeoutRef.current);
      }

      factionRefreshTimeoutRef.current = window.setTimeout(async () => {
        factionRefreshTimeoutRef.current = null;
        const factionStore = useFactionStore.getState();
        await factionStore.initializeFactions();
        useGalaxyUIStore.getState().syncFactionFilters(factionStore.getFactionIds());
      }, 300);
    };

    const channel = supabase
      .channel('shared-map-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'custom_systems' },
        scheduleRealtimeRefresh,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'custom_fleets' },
        scheduleRealtimeRefresh,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_settings' },
        scheduleRealtimeRefresh,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'custom_factions' },
        scheduleFactionRefresh,
      )
      .subscribe();

    return () => {
      if (realtimeRefreshTimeoutRef.current !== null) {
        window.clearTimeout(realtimeRefreshTimeoutRef.current);
        realtimeRefreshTimeoutRef.current = null;
      }
      if (factionRefreshTimeoutRef.current !== null) {
        window.clearTimeout(factionRefreshTimeoutRef.current);
        factionRefreshTimeoutRef.current = null;
      }
      void supabase.removeChannel(channel);
    };
  }, [initializeData]);

  const systems = useGalaxyDataStore((s) => s.systems);
  const isLoading = useGalaxyDataStore((s) => s.isLoading);
  const hasCompletedTour = useCallback(
    () => window.localStorage.getItem(TOUR_STORAGE_KEY) === 'true',
    [],
  );

  useEffect(() => {
    if (systems.length > 0 && !isLoading && !tourReady && !hasCompletedTour()) {
      const timer = window.setTimeout(() => {
        setTourReady(true);
        setTourRunning(true);
      }, 800);
      return () => window.clearTimeout(timer);
    }
  }, [systems.length, isLoading, tourReady, hasCompletedTour]);

  return (
    <div className="w-full h-full relative overflow-hidden" data-tour="galaxy-canvas">
      <GalaxyScene />

      <div className="absolute top-5 left-5 z-50 flex items-center gap-2">
        <HoloMicroExpander
          size="sm"
          text={uiHidden ? 'Show UI' : 'Hide UI'}
          onClick={() => setUiHidden((prev) => !prev)}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              {uiHidden ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" />
              ) : (
                <>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </>
              )}
            </svg>
          }
        />

        {!uiHidden && (
          <span data-tour="download-map" className="flex">
            <HoloMicroExpander
              size="sm"
              text="Download Map"
              onClick={handleDownloadMap}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
                </svg>
              }
            />
          </span>
        )}

        {!uiHidden && (
          <HoloMicroExpander
            size="sm"
            text="Feedback"
            onClick={() => navigate('/feedback')}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h6m-6 4h4M5 3h14a2 2 0 012 2v13a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
              </svg>
            }
          />
        )}

        {!uiHidden && (
          <HoloMicroExpander
            size="sm"
            text="Replay Tour"
            onClick={() => {
              setTourReady(true);
              setTourRunning(true);
            }}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                <circle cx="12" cy="17" r="0.5" fill="currentColor" />
              </svg>
            }
          />
        )}
      </div>

      {!uiHidden && (
        <>
          <IconRail />
          <BottomActionBar />

          <SearchBar />
          <TimelineControl />
          <GalaxyOverview />
          <MapControlsPanel />

          <InfoPanel />

          <AnimatePresence>
            {isAdmin && hasPendingChanges && (
              <motion.div
                className="absolute bottom-20 right-6 z-50 flex items-center gap-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <button
                  onClick={async () => {
                    setSaving(true);
                    await saveAllChanges();
                    setSaving(false);
                  }}
                  disabled={saving}
                  className="holo-button holo-button-sm"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => discardAllChanges()}
                  disabled={saving}
                  className="holo-button holo-button-sm holo-button-danger"
                >
                  Discard
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {viewMode === 'topdown' && (
            <motion.div
              className="absolute top-20 right-6 z-40 flex flex-col gap-2"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut', delay: 0.2 }}
              data-tour="zoom-controls"
            >
              <button
                onClick={() => requestZoom(-1)}
                className="holo-button holo-button-sm"
                title="Zoom in"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12M6 12h12" />
                </svg>
              </button>
              <button
                onClick={() => requestZoom(1)}
                className="holo-button holo-button-sm"
                title="Zoom out"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h12" />
                </svg>
              </button>
              <button
                onClick={() => requestCameraReset()}
                className="holo-button holo-button-sm"
                title="Reset camera to default position"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h4V6" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10a9 9 0 0117.36-2.35" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 14h-4v4" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 14a9 9 0 01-17.36 2.35" />
                </svg>
              </button>
            </motion.div>
          )}

          {viewMode !== 'topdown' && (
            <motion.div
              className="absolute top-20 left-5 z-40"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <button
                onClick={() => {
                  if (viewMode === 'fleet') setSelectedFleet(null);
                  else setSelectedSystem(null);
                }}
                className="holo-button holo-button-sm"
                title="Back to Galaxy Map"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                <span>Galaxy Map</span>
              </button>
            </motion.div>
          )}

          <motion.div
            className="absolute bottom-6 left-6 z-40"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut', delay: 0.2 }}
          >
            <Link to="/" className="holo-button holo-button-sm">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              <span>AlphaSec</span>
            </Link>
          </motion.div>

          <motion.div
            className="absolute bottom-6 right-6 z-40"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut', delay: 0.25 }}
          >
            {isAdmin && (
              <Link to="/admin" className="holo-button holo-button-sm">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Admin</span>
              </Link>
            )}
          </motion.div>

          <motion.div
            className="absolute top-5 right-5 z-40"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut', delay: 0.1 }}
          >
            {session && (
              <div className="holo-account-shell">
                <span
                  className="px-3 py-1 text-[10px] font-semibold tracking-[0.1em] uppercase"
                  style={{ fontFamily: 'Oxanium, Orbitron, monospace', color: 'rgba(255, 255, 255, 0.8)' }}
                >
                  {displayName}
                </span>
                <button
                  onClick={() => signOut()}
                  className="holo-account-action"
                >
                  Sign Out
                </button>
              </div>
            )}
          </motion.div>

          <motion.div
            className="absolute top-5 left-1/2 -translate-x-1/2 text-center pointer-events-none z-0"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut', delay: 0.05 }}
            data-tour="title-bar"
          >
            <div className="holo-title-bar">
              <h1
                className="text-xl font-black tracking-[0.3em] uppercase mb-1"
                style={{
                  fontFamily: 'Orbitron, monospace',
                  color: 'rgba(255, 255, 255, 0.8)',
                }}
              >
                TNIO x ALPHASEC
              </h1>

              <div className="flex items-center justify-center gap-3">
                <div className="h-px w-12" style={{ background: 'linear-gradient(90deg, transparent, rgba(200, 170, 110, 0.3))' }} />
                <div className="flex items-center gap-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: 'var(--holo-amber)', opacity: 0.5 }}
                  />
                  <p
                    className="text-[12px] font-bold tracking-[0.3em] uppercase"
                    style={{
                      fontFamily: 'Oxanium, Orbitron, monospace',
                      color: 'rgba(255, 255, 255, 0.8)',
                    }}
                  >
                    {viewLabel}
                  </p>
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: 'var(--holo-amber)', opacity: 0.5 }}
                  />
                </div>
                <div className="h-px w-12" style={{ background: 'linear-gradient(90deg, rgba(200, 170, 110, 0.3), transparent)' }} />
              </div>
            </div>
          </motion.div>
        </>
      )}

      <LoadingScreen />

      <OnboardingTour
        run={tourRunning && tourReady}
        onFinish={() => setTourRunning(false)}
        isAdmin={isAdmin}
        storageKey={TOUR_STORAGE_KEY}
      />
    </div>
  );
}
