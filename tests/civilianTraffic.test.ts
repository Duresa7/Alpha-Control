import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  DEFAULT_CIVILIAN_TRAFFIC_SETTINGS,
  advanceShipProgress,
  appendTrailPoint,
  calculateDensityPlan,
  sampleQuadraticBezier,
  selectRouteEndpoints,
  tangentQuadraticBezier,
} from '@/utils/civilianTraffic';

describe('civilianTraffic utilities', () => {
  it('selects distinct endpoints that satisfy min distance when viable routes exist', () => {
    const systems = [
      { id: 'a', position: new THREE.Vector3(0, 0, 0) },
      { id: 'b', position: new THREE.Vector3(10, 0, 0) },
      { id: 'c', position: new THREE.Vector3(50, 0, 0) },
    ];

    const selection = selectRouteEndpoints(systems, 20, () => 0.2);
    expect(selection).not.toBeNull();
    if (!selection) return;

    expect(selection.origin.id).not.toBe(selection.destination.id);
    expect(
      selection.origin.position.distanceTo(selection.destination.position),
    ).toBeGreaterThanOrEqual(20);
  });

  it('samples quadratic bezier endpoints and tangent direction', () => {
    const start = new THREE.Vector3(0, 0, 0);
    const control = new THREE.Vector3(5, 0, 10);
    const end = new THREE.Vector3(10, 0, 0);

    expect(sampleQuadraticBezier(start, control, end, 0)).toEqual(start);
    expect(sampleQuadraticBezier(start, control, end, 1)).toEqual(end);

    const midpoint = sampleQuadraticBezier(start, control, end, 0.5);
    expect(midpoint.x).toBeCloseTo(5);
    expect(midpoint.z).toBeGreaterThan(0);

    const tangentStart = tangentQuadraticBezier(start, control, end, 0);
    expect(tangentStart.length()).toBeCloseTo(1, 5);
    expect(tangentStart.z).toBeGreaterThan(0);
  });

  it('reaches completion and requests replacement through density planning', () => {
    let progress = 0;
    for (let i = 0; i < 10; i++) {
      progress = advanceShipProgress(progress, 1, 25, 100);
    }

    expect(progress).toBe(1);

    const { spawnCount } = calculateDensityPlan(27, DEFAULT_CIVILIAN_TRAFFIC_SETTINGS);
    expect(spawnCount).toBe(1);
  });

  it('keeps trail bounded and ordered from oldest to newest', () => {
    let trail: THREE.Vector3[] = [];
    for (let i = 0; i < 5; i++) {
      trail = appendTrailPoint(trail, new THREE.Vector3(i, 0, 0), 3);
    }

    expect(trail).toHaveLength(3);
    expect(trail[0].x).toBe(2);
    expect(trail[1].x).toBe(3);
    expect(trail[2].x).toBe(4);
  });

  it('calculates density plans that converge toward target range', () => {
    const lowPlan = calculateDensityPlan(8, DEFAULT_CIVILIAN_TRAFFIC_SETTINGS);
    const lowNextCount = 8 + lowPlan.spawnCount - lowPlan.trimCount;
    expect(lowNextCount).toBe(DEFAULT_CIVILIAN_TRAFFIC_SETTINGS.targetConcurrent);
    expect(lowNextCount).toBeGreaterThanOrEqual(DEFAULT_CIVILIAN_TRAFFIC_SETTINGS.minConcurrent);
    expect(lowNextCount).toBeLessThanOrEqual(DEFAULT_CIVILIAN_TRAFFIC_SETTINGS.maxConcurrent);

    const stablePlan = calculateDensityPlan(
      DEFAULT_CIVILIAN_TRAFFIC_SETTINGS.targetConcurrent,
      DEFAULT_CIVILIAN_TRAFFIC_SETTINGS,
    );
    expect(stablePlan).toEqual({ spawnCount: 0, trimCount: 0 });

    const highCurrent = DEFAULT_CIVILIAN_TRAFFIC_SETTINGS.maxConcurrent + 3;
    const highPlan = calculateDensityPlan(highCurrent, DEFAULT_CIVILIAN_TRAFFIC_SETTINGS);
    const highNextCount = highCurrent + highPlan.spawnCount - highPlan.trimCount;
    expect(highNextCount).toBe(DEFAULT_CIVILIAN_TRAFFIC_SETTINGS.targetConcurrent);
  });
});
