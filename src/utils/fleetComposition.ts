import type { FleetShipEntry } from '@/types';

export const CUSTOM_SHIP_QUANTITY_MIN = 1;
export const CUSTOM_SHIP_QUANTITY_MAX = 999;

export function normalizeCustomShipName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function clampCustomShipQuantity(value: number): number {
  if (!Number.isFinite(value)) return CUSTOM_SHIP_QUANTITY_MIN;
  return Math.min(CUSTOM_SHIP_QUANTITY_MAX, Math.max(CUSTOM_SHIP_QUANTITY_MIN, Math.round(value)));
}

interface AddOrIncrementCustomShipEntryParams {
  name: string;
  shipClass: string;
  quantityToAdd: number;
}

export function addOrIncrementCustomShipEntry(
  entries: FleetShipEntry[],
  { name, shipClass, quantityToAdd }: AddOrIncrementCustomShipEntryParams,
): FleetShipEntry[] {
  const normalizedName = normalizeCustomShipName(name);
  if (!normalizedName) return entries;

  const displayName = name.trim().replace(/\s+/g, ' ');
  const incrementBy = clampCustomShipQuantity(quantityToAdd);
  const existingIndex = entries.findIndex(
    (entry) =>
      entry.isCustomEntry &&
      entry.shipClass === shipClass &&
      normalizeCustomShipName(entry.name) === normalizedName,
  );

  if (existingIndex >= 0) {
    return entries.map((entry, index) =>
      index === existingIndex ? { ...entry, quantity: entry.quantity + incrementBy } : entry,
    );
  }

  const catalogId = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return [
    ...entries,
    {
      catalogId,
      name: displayName,
      shipClass,
      modelType: null,
      quantity: incrementBy,
      isCustomEntry: true,
    },
  ];
}
