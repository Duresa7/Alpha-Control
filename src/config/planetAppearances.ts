import type { PlanetType } from '@/types';

export const PLANET_APPEARANCES: Record<
  PlanetType,
  {
    color: string;
    roughness: number;
    metalness: number;
    secondaryColor?: string;
    hasRings?: boolean;
    hasClouds?: boolean;
    hasAtmosphere?: boolean;
    atmosphereColor?: string;
  }
> = {
  terrestrial: {
    color: '#4A7C59',
    roughness: 0.8,
    metalness: 0.1,
    secondaryColor: '#8B7355',
    hasAtmosphere: true,
    atmosphereColor: '#87CEEB',
    hasClouds: true,
  },
  gas_giant: {
    color: '#D4A574',
    roughness: 0.9,
    metalness: 0,
    secondaryColor: '#8B6914',
    hasRings: true,
  },
  ice: {
    color: '#E8F4F8',
    roughness: 0.3,
    metalness: 0.2,
    secondaryColor: '#A8D8EA',
    hasAtmosphere: true,
    atmosphereColor: '#CCE5FF',
  },
  desert: {
    color: '#C2956E',
    roughness: 0.9,
    metalness: 0.05,
    secondaryColor: '#D4A574',
  },
  volcanic: {
    color: '#4A3030',
    roughness: 0.7,
    metalness: 0.3,
    secondaryColor: '#8B0000',
  },
  ocean: {
    color: '#1E5F8A',
    roughness: 0.2,
    metalness: 0.1,
    secondaryColor: '#2E8B57',
    hasAtmosphere: true,
    atmosphereColor: '#87CEEB',
    hasClouds: true,
  },
  jungle: {
    color: '#228B22',
    roughness: 0.85,
    metalness: 0.05,
    secondaryColor: '#006400',
    hasAtmosphere: true,
    atmosphereColor: '#90EE90',
    hasClouds: true,
  },
  city: {
    color: '#505060',
    roughness: 0.4,
    metalness: 0.6,
    secondaryColor: '#303040',
  },
  barren: {
    color: '#696969',
    roughness: 1.0,
    metalness: 0.1,
    secondaryColor: '#505050',
  },
  destroyed: {
    color: '#3A3A3A',
    roughness: 0.9,
    metalness: 0.2,
    secondaryColor: '#1A1A1A',
  },
};
