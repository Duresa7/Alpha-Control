import { describe, expect, it } from 'vitest';
import { addOrIncrementCustomShipEntry } from '../src/utils/fleetComposition';

describe('addOrIncrementCustomShipEntry', () => {
  it('adds a new custom entry when no match exists', () => {
    const result = addOrIncrementCustomShipEntry([], {
      name: 'Arc-170',
      shipClass: 'Fighter Wing',
      quantityToAdd: 5,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: 'Arc-170',
      shipClass: 'Fighter Wing',
      quantity: 5,
      modelType: null,
      isCustomEntry: true,
    });
    expect(result[0].catalogId.startsWith('custom-')).toBe(true);
  });

  it('increments an existing matching custom entry (case/whitespace-insensitive)', () => {
    const existing = [
      {
        catalogId: 'custom-1',
        name: ' ARC   170 ',
        shipClass: 'Fighter Wing',
        modelType: null,
        quantity: 3,
        isCustomEntry: true,
      },
    ];

    const result = addOrIncrementCustomShipEntry(existing, {
      name: 'arc 170',
      shipClass: 'Fighter Wing',
      quantityToAdd: 2,
    });

    expect(result).toHaveLength(1);
    expect(result[0].catalogId).toBe('custom-1');
    expect(result[0].quantity).toBe(5);
  });

  it('does not merge when ship class is different', () => {
    const existing = [
      {
        catalogId: 'custom-1',
        name: 'Arc-170',
        shipClass: 'Fighter Wing',
        modelType: null,
        quantity: 3,
        isCustomEntry: true,
      },
    ];

    const result = addOrIncrementCustomShipEntry(existing, {
      name: 'Arc-170',
      shipClass: 'Corvette',
      quantityToAdd: 2,
    });

    expect(result).toHaveLength(2);
    expect(result[0].quantity).toBe(3);
    expect(result[1]).toMatchObject({
      name: 'Arc-170',
      shipClass: 'Corvette',
      quantity: 2,
      isCustomEntry: true,
    });
  });

  it('does not merge with non-custom catalog entries', () => {
    const existing = [
      {
        catalogId: 'victory-i',
        name: 'Arc-170',
        shipClass: 'Fighter Wing',
        modelType: 'republic' as const,
        quantity: 7,
      },
    ];

    const result = addOrIncrementCustomShipEntry(existing, {
      name: 'Arc-170',
      shipClass: 'Fighter Wing',
      quantityToAdd: 1,
    });

    expect(result).toHaveLength(2);
    expect(result[0].quantity).toBe(7);
    expect(result[1]).toMatchObject({
      name: 'Arc-170',
      shipClass: 'Fighter Wing',
      quantity: 1,
      isCustomEntry: true,
    });
  });

  it('clamps invalid quantities to 1', () => {
    const added = addOrIncrementCustomShipEntry([], {
      name: 'Nebulon-B',
      shipClass: 'Frigate',
      quantityToAdd: 0,
    });
    expect(added[0].quantity).toBe(1);

    const incremented = addOrIncrementCustomShipEntry(
      [
        {
          catalogId: 'custom-2',
          name: 'Nebulon-B',
          shipClass: 'Frigate',
          modelType: null,
          quantity: 4,
          isCustomEntry: true,
        },
      ],
      {
        name: 'Nebulon-B',
        shipClass: 'Frigate',
        quantityToAdd: Number.NaN,
      },
    );

    expect(incremented[0].quantity).toBe(5);
  });
});
