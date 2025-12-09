// src/lib/js-ink-engine.ts

// Define the same Point interface used in the application
interface AppPoint {
  x: number;
  y: number;
  pressure: number;
}

/**
 * Implements the Catmull-Rom spline formula.
 * @param p0 - The first control point.
 * @param p1 - The second control point (start of the segment).
 * @param p2 - The third control point (end of the segment).
 * @param p3 - The fourth control point.
 * @param t - The interpolation factor (from 0 to 1).
 * @returns The interpolated value.
 */
function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t
  );
}

/**
 * Processes a raw stroke of points into a smoothed curve using a JavaScript implementation
 * of the same algorithm used in the WebAssembly module.
 *
 * @param rawPoints - The array of raw points from pointer events.
 * @returns A new array of smoothed points.
 */
export function processStrokeJS(rawPoints: AppPoint[]): AppPoint[] {
  if (rawPoints.length === 0) {
    return [];
  }

  // 1. Simplify the stroke by filtering out points that are too close.
  const filteredPoints: AppPoint[] = [rawPoints[0]];
  const minDistanceSq = 2.0 * 2.0; // Squared distance for efficiency

  for (let i = 1; i < rawPoints.length; ++i) {
    const dx = rawPoints[i].x - filteredPoints[filteredPoints.length - 1].x;
    const dy = rawPoints[i].y - filteredPoints[filteredPoints.length - 1].y;
    if ((dx * dx + dy * dy) > minDistanceSq) {
      filteredPoints.push(rawPoints[i]);
    }
  }

  // Ensure the last point is always included if it wasn't already
  const lastRawPoint = rawPoints[rawPoints.length - 1];
  const lastFilteredPoint = filteredPoints[filteredPoints.length - 1];
  if (lastFilteredPoint.x !== lastRawPoint.x || lastFilteredPoint.y !== lastRawPoint.y) {
      filteredPoints.push(lastRawPoint);
  }

  // 2. Apply Catmull-Rom smoothing on the simplified stroke.
  if (filteredPoints.length < 3) {
    return filteredPoints;
  }

  const smoothedPoints: AppPoint[] = [];
  const steps = 5; // Number of interpolated points per segment

  for (let i = 0; i < filteredPoints.length - 1; ++i) {
    const p0 = (i === 0) ? filteredPoints[i] : filteredPoints[i - 1];
    const p1 = filteredPoints[i];
    const p2 = filteredPoints[i + 1];
    const p3 = (i + 2 < filteredPoints.length) ? filteredPoints[i + 2] : p2;

    for (let tStep = 0; tStep < steps; ++tStep) {
      const t = tStep / steps;
      const newPoint: AppPoint = {
        x: catmullRom(p0.x, p1.x, p2.x, p3.x, t),
        y: catmullRom(p0.y, p1.y, p2.y, p3.y, t),
        pressure: catmullRom(p0.pressure, p1.pressure, p2.pressure, p3.pressure, t),
      };

      if (newPoint.pressure < 0) {
        newPoint.pressure = 0;
      }

      smoothedPoints.push(newPoint);
    }
  }

  smoothedPoints.push(filteredPoints[filteredPoints.length - 1]);

  return smoothedPoints;
}
