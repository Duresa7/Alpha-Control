import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Globe2 } from 'lucide-react';
import { useGalaxyDataStore } from '@/store/galaxyDataStore';
import { useFactionStore } from '@/store/factionStore';
import { useGalaxyUIStore } from '@/store/galaxyUIStore';

export function GalaxyOverview() {
  const systems = useGalaxyDataStore((s) => s.systems);
  const fleets = useGalaxyDataStore((s) => s.fleets);
  const factions = useFactionStore((s) => s.factions);
  const activeModule = useGalaxyUIStore((s) => s.activeModule);
  const getFactionStats = useGalaxyDataStore((s) => s.getFactionStats);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const factionStats = useMemo(() => getFactionStats(), [systems, fleets, factions, getFactionStats]);

  if (activeModule !== 'overview') return null;

  return (
    <motion.div
      className="absolute left-20 top-1/2 -translate-y-1/2 z-40 w-80"
      initial={{ x: -12 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="holo-panel">
        <label className="holo-label holo-section-header mb-3 pointer-events-none">
          <span className="flex items-center gap-2">
            <Globe2 className="w-4 h-4" style={{ opacity: 0.7 }} aria-hidden="true" />
            Galaxy Overview
          </span>
        </label>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
          {factions.map((f, i) => {
            const stats = factionStats[f.id];
            const color = f.barColor;
            if (!stats || (stats.planets === 0 && stats.fleets === 0 && stats.shipUnits === 0)) return null;
            return (
              <motion.div
                key={f.id}
                className="holo-overview-row"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.06, duration: 0.3, ease: 'easeOut' }}
              >
                <div
                  className="holo-status-dot"
                  style={{ backgroundColor: color, boxShadow: `0 0 0 3px ${color}40` }}
                />
                <span className="flex-1 text-[13px] font-medium holo-body-text" style={{ color }}>
                  {f.label}
                </span>
                <div className="flex gap-3 text-right">
                  <div className="holo-overview-metric">
                    <div className="holo-overview-metric-value">{stats.planets}</div>
                    <div className="holo-overview-metric-label">PLN</div>
                  </div>
                  <div className="holo-overview-metric">
                    <div className="holo-overview-metric-value">{stats.fleets}</div>
                    <div className="holo-overview-metric-label">FLTS</div>
                  </div>
                  <div className="holo-overview-metric">
                    <div className="holo-overview-metric-value">{stats.shipUnits}</div>
                    <div className="holo-overview-metric-label">SHIPS</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
