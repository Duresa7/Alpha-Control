import { motion } from 'framer-motion';
import { Clock, Globe2, Search } from 'lucide-react';
import { useGalaxyUIStore, type ActiveModule } from '@/store/galaxyUIStore';

const MODULE_OPTIONS: { id: ActiveModule; label: string; icon: React.ReactNode }[] = [
  {
    id: 'search',
    label: 'Search',
    icon: <Search className="w-5 h-5 pointer-events-none" aria-hidden="true" />,
  },
  {
    id: 'overview',
    label: 'Galaxy Overview',
    icon: <Globe2 className="w-5 h-5 pointer-events-none" aria-hidden="true" />,
  },
  {
    id: 'timeline',
    label: 'Timeline',
    icon: <Clock className="w-5 h-5 pointer-events-none" aria-hidden="true" />,
  },
];

const railContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const railItem = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
};

export function IconRail() {
  const activeModule = useGalaxyUIStore((s) => s.activeModule);
  const setActiveModule = useGalaxyUIStore((s) => s.setActiveModule);

  return (
    <motion.div
      className="absolute left-5 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3"
      variants={railContainer}
      initial="hidden"
      animate="visible"
      data-tour="icon-rail"
    >
      {MODULE_OPTIONS.map((mod) => {
        const isActive = activeModule === mod.id;

        return (
          <motion.div key={mod.id} className="holo-rail-item" variants={railItem}>
            <button
              onClick={() => setActiveModule(mod.id)}
              className={`holo-rail-button${isActive ? ' is-active' : ''}`}
              title={mod.label}
            >
              {mod.icon}
            </button>
            <div className="holo-rail-tooltip">
              <span className="text-[11px] uppercase tracking-wider holo-label-orbitron">
                {mod.label}
              </span>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
