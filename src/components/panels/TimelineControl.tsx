import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { useGalaxyDataStore } from '@/store/galaxyDataStore';
import { useGalaxyUIStore } from '@/store/galaxyUIStore';
import { useRole } from '@/hooks/useRole';

export function TimelineControl() {
  const activeModule = useGalaxyUIStore((s) => s.activeModule);
  const { isAdmin } = useRole();
  const currentYear = useGalaxyDataStore((s) => s.currentYear);
  const setCurrentYear = useGalaxyDataStore((s) => s.setCurrentYear);

  const [yearDraft, setYearDraft] = useState(String(currentYear));

  useEffect(() => {
    setYearDraft(String(currentYear));
  }, [currentYear]);

  const commitYear = useCallback(() => {
    const parsed = parseInt(yearDraft, 10);
    if (isNaN(parsed)) {
      setYearDraft(String(currentYear));
      return;
    }
    setCurrentYear(parsed);
    setYearDraft(String(parsed));
  }, [yearDraft, currentYear, setCurrentYear]);

  if (activeModule !== 'timeline') return null;

  return (
    <motion.div
      className="absolute left-20 top-1/2 -translate-y-1/2 z-40 w-80"
      initial={{ x: -12 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="holo-panel">
        <div>
          <label className="holo-label holo-section-header pointer-events-none">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ opacity: 0.7 }} aria-hidden="true" />
              Timeline
            </span>
          </label>
          <p className="text-[14px] mt-1 holo-body-text">Old Republic Era</p>
        </div>

        <div className="holo-year-card">
          <span className="holo-year-label">Current Year</span>
          {isAdmin ? (
            <div className="holo-year-value">
              <input
                type="number"
                value={yearDraft}
                onChange={(e) => setYearDraft(e.target.value)}
                onBlur={commitYear}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitYear();
                }}
                className="holo-input holo-number-input holo-year-input"
              />
              <span className="holo-year-unit">ATC</span>
            </div>
          ) : (
            <div className="holo-year-value">
              <span className="holo-year-number">{currentYear}</span>
              <span className="holo-year-unit">ATC</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
