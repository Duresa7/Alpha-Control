import type { ShipModelType } from '@/types';

export interface ShipCatalogEntry {
  id: string;
  name: string;
  shipClass: 'Frigate' | 'Cruiser' | 'Dreadnought' | 'Destroyer';
  modelType: ShipModelType;
  description: string;
}

export const shipCatalog: ShipCatalogEntry[] = [
  {
    id: 'republic-frigate',
    name: 'Republic Frigate',
    shipClass: 'Frigate',
    modelType: 'republic',
    description: 'Versatile Hammerhead-class cruiser, the backbone of the Republic Navy.',
  },
  {
    id: 'republic-valor',
    name: 'Valor-class Cruiser',
    shipClass: 'Cruiser',
    modelType: 'valor',
    description:
      'Republic Valor-class cruiser adapted for frontline fleet actions and rapid-response command roles.',
  },
  {
    id: 'sith-dreadnought',
    name: 'Sith Dreadnought',
    shipClass: 'Dreadnought',
    modelType: 'sith',
    description: 'Harrower-class dreadnought, a fearsome capital ship of the Sith Empire.',
  },
  {
    id: 'sith-terminus',
    name: 'Terminus-class Destroyer',
    shipClass: 'Destroyer',
    modelType: 'terminus',
    description:
      'Sith Empire Terminus-class destroyer serving as the backbone of the Imperial fleet for frontline engagements.',
  },
];
