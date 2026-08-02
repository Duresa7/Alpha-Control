import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGalaxySelectionStore } from '@/store/galaxySelectionStore';
import { useGalaxyUIStore } from '@/store/galaxyUIStore';
import { useGalaxyDataStore } from '@/store/galaxyDataStore';
import type { SearchResult } from '@/types';

export function SearchBar() {
  const searchQuery = useGalaxyUIStore((s) => s.searchQuery);
  const setSearchQuery = useGalaxyUIStore((s) => s.setSearchQuery);
  const systems = useGalaxyDataStore((s) => s.systems);
  const fleets = useGalaxyDataStore((s) => s.fleets);
  const setSelectedSystem = useGalaxySelectionStore((s) => s.setSelectedSystem);
  const setSelectedPlanet = useGalaxySelectionStore((s) => s.setSelectedPlanet);
  const setSelectedFleet = useGalaxySelectionStore((s) => s.setSelectedFleet);
  const setInfoPanelData = useGalaxySelectionStore((s) => s.setInfoPanelData);
  const activeModule = useGalaxyUIStore((s) => s.activeModule);

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchResults = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query || query.length < 2) return [];

    const results: SearchResult[] = [];

    systems.forEach((system) => {
      if (system.name.toLowerCase().includes(query)) {
        results.push({ type: 'system', id: system.id, name: system.name });
      }

      system.planets.forEach((planet) => {
        if (planet.name.toLowerCase().includes(query)) {
          results.push({
            type: 'planet',
            id: planet.id,
            name: planet.name,
            parentName: system.name,
            parentSystemId: system.id,
          });
        }
      });
    });

    fleets.forEach((fleet) => {
      if (fleet.name.toLowerCase().includes(query)) {
        results.push({ type: 'fleet', id: fleet.id, name: fleet.name });
      }
    });

    return results.slice(0, 10);
  }, [searchQuery, systems, fleets]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectResult = (result: SearchResult) => {
    if (result.type === 'system') {
      const system = systems.find(s => s.id === result.id);
      if (system) {
        setSelectedSystem(system.id);
        setInfoPanelData({ type: 'system', data: system });
      }
    } else if (result.type === 'planet') {
      const system =
        (result.parentSystemId ? systems.find((s) => s.id === result.parentSystemId) : null)
        ?? (result.parentName ? systems.find((s) => s.name === result.parentName) : null);
      if (system) {
        setSelectedSystem(system.id);
        const planet = system.planets.find(p => p.id === result.id);
        if (planet) {
          setSelectedPlanet(planet.id);
          setInfoPanelData({ type: 'planet', data: planet });
        }
      }
    } else if (result.type === 'fleet') {
      const fleet = fleets.find(f => f.id === result.id);
      if (fleet) {
        setSelectedFleet(fleet.id);
        setInfoPanelData({ type: 'fleet', data: fleet });
      }
    }
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  if (activeModule !== 'search') return null;

  return (
    <motion.div
      ref={searchRef}
      className="absolute left-20 top-1/2 -translate-y-1/2 z-40 w-80"
      initial={{ x: -12 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="holo-panel">
        <label className="holo-label holo-section-header mb-3 pointer-events-none">
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity: 0.7 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search Nav
          </span>
        </label>
        
        <div className="holo-search-wrapper">
            <svg className="holo-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="System, planet, fleet..."
              className="holo-input w-full py-2 text-[13px]"
              autoFocus
            />
          </div>
      </div>

      <AnimatePresence>
        {isSearchFocused && searchResults.length > 0 && (
          <motion.div
            className="absolute top-full left-0 right-0 mt-2 z-50"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="holo-panel max-h-[32vh] overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelectResult(result)}
                  className="w-full px-4 py-3 text-left hover:bg-amber-500/5 transition-colors flex items-center gap-3 border-b border-amber-500/10 last:border-0"
                >
                  <span className={`text-[10px] font-semibold px-2 py-0.5 holo-badge holo-label-orbitron ${
                    result.type === 'system'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : result.type === 'fleet'
                      ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                      : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  }`}>
                    {result.type === 'system' ? 'LOC' : result.type === 'fleet' ? 'FLT' : 'PLN'}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-gray-100 text-[14px] font-medium holo-body-text">{result.name}</span>
                    {result.parentName && (
                      <span className="text-gray-500 text-[12px]">in {result.parentName}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
