/**
 * Irrigation Turret Targeting Math
 *
 * Converts field world-coordinates to turret pan/tilt angles.
 *
 * Coordinate conventions (Three.js / right-hand Y-up):
 *   X = east,  Y = up,  Z = south
 *
 * Pan  0°  = pointing along +X (east)
 * Pan  90° = pointing along +Z (south, away from viewer in top-down view)
 * Pan 180° = pointing along -X (west)
 * Pan 270° = pointing along -Z (north)
 *
 * Tilt 90° = horizontal spray (level with ground)
 * Tilt >90° = pointing downward (close targets)
 * Tilt <90° = pointing upward  (far targets — arc trajectory)
 */

export interface TurretConfig {
  /** World X position of turret base */
  baseX: number;
  /** World Z position of turret base */
  baseZ: number;
  /** Height of nozzle above ground (metres) */
  nozzleHeightM: number;
  /** Allowed pan range in degrees */
  panMinDeg: number;
  panMaxDeg: number;
  /** Allowed tilt range in degrees */
  tiltMinDeg: number;
  tiltMaxDeg: number;
}

export interface TargetPosition {
  /** World X coordinate */
  x: number;
  /** World Z coordinate */
  z: number;
  /** Ground height (typically 0) */
  y: number;
}

export interface TurretAngle {
  /** Stepper pan angle 0–360° */
  panDeg: number;
  /** Servo tilt angle 0–180° (90 = level) */
  tiltDeg: number;
  /** Straight-line distance from nozzle to target (metres) */
  distanceM: number;
}

// ─── Core angle functions ──────────────────────────────────────────────────────

/**
 * Pan angle from turret base to target.
 *
 * Uses atan2(Δz, Δx) for full-circle coverage with correct quadrant handling.
 */
export function calculatePanAngle(turret: TargetPosition, target: TargetPosition): number {
  const dx = target.x - turret.x;
  const dz = target.z - turret.z;
  const radians = Math.atan2(dz, dx);
  const degrees = (radians * 180) / Math.PI;
  return degrees < 0 ? degrees + 360 : degrees;
}

/**
 * Tilt angle from nozzle to ground-level target.
 *
 * The nozzle is at height `nozzleHeightM` above the target's ground plane.
 * Horizontal distance from nozzle to target determines the depression angle:
 *
 *   elevationAboveHorizontal = atan(nozzleHeight / horizontalDist)
 *   tilt = 90° - elevationAboveHorizontal
 *
 * At close range → large depression → tilt > 90°
 * At far range   → small depression → tilt approaching 90°
 */
export function calculateTiltAngle(
  turret: TargetPosition,
  target: TargetPosition,
  nozzleHeightM: number,
): number {
  const dx = target.x - turret.x;
  const dz = target.z - turret.z;
  const horizDist = Math.sqrt(dx * dx + dz * dz);

  if (horizDist < 0.01) return 90; // directly below nozzle

  const elevationRad = Math.atan(nozzleHeightM / horizDist);
  const tiltDeg = 90 - (elevationRad * 180) / Math.PI;
  return Math.max(0, Math.min(180, tiltDeg));
}

/** Euclidean distance from turret nozzle to target (3D). */
export function calculateDistance(turret: TargetPosition, target: TargetPosition): number {
  const dx = target.x - turret.x;
  const dy = target.y - turret.y;
  const dz = target.z - turret.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// ─── Main targeting function ───────────────────────────────────────────────────

/**
 * Compute clamped pan/tilt angles for a given target.
 * Returns angles constrained to the turret's safe operating range.
 */
export function calculateTurretAngles(config: TurretConfig, target: TargetPosition): TurretAngle {
  const nozzle: TargetPosition = {
    x: config.baseX,
    z: config.baseZ,
    y: config.nozzleHeightM,
  };

  const panRaw  = calculatePanAngle(nozzle, target);
  const tiltRaw = calculateTiltAngle(nozzle, target, config.nozzleHeightM);
  const dist    = calculateDistance(nozzle, target);

  return {
    panDeg:    Math.max(config.panMinDeg,  Math.min(config.panMaxDeg,  panRaw)),
    tiltDeg:   Math.max(config.tiltMinDeg, Math.min(config.tiltMaxDeg, tiltRaw)),
    distanceM: dist,
  };
}

/** True if target is within max spray range and inside pan/tilt limits. */
export function isTargetInRange(config: TurretConfig, target: TargetPosition, maxRangeM: number): boolean {
  const nozzle: TargetPosition = { x: config.baseX, z: config.baseZ, y: config.nozzleHeightM };
  if (calculateDistance(nozzle, target) > maxRangeM) return false;
  const pan  = calculatePanAngle(nozzle, target);
  const tilt = calculateTiltAngle(nozzle, target, config.nozzleHeightM);
  return pan >= config.panMinDeg && pan <= config.panMaxDeg
      && tilt >= config.tiltMinDeg && tilt <= config.tiltMaxDeg;
}

// ─── Full-coverage sweep ───────────────────────────────────────────────────────

export interface SweepWaypoint {
  /** Sequential index (0-based) */
  index: number;
  /** World X of this spray point */
  x: number;
  /** World Z of this spray point */
  z: number;
  /** Pre-computed pan angle */
  panDeg: number;
  /** Pre-computed tilt angle */
  tiltDeg: number;
  /** Distance from nozzle */
  distanceM: number;
}

export interface SweepPlan {
  waypoints: SweepWaypoint[];
  /** Total estimated run time in ms */
  estimatedMs: number;
  /** Step size used (metres) */
  stepM: number;
  /** Dwell time per waypoint in ms */
  dwellMs: number;
}

/**
 * Generate a boustrophedon (snake) raster sweep over a rectangular plot.
 *
 * The path looks like this from above:
 *
 *   col 0   col 1   col 2
 *   → → → → → → → → →
 *                       ↓
 *   ← ← ← ← ← ← ← ← ←
 *   ↓
 *   → → → → → → → → →
 *
 * stepM controls the spray-point density.  A smaller step gives denser coverage
 * but takes longer.  For a 5 × 5 m plot at stepM = 1.25 m you get 4 × 4 = 16
 * waypoints.
 *
 * The function pre-computes pan/tilt for every waypoint so the sweep runner
 * never needs to call the math again.
 */
export function generateSweepWaypoints(
  plot: { centerX: number; centerZ: number; width: number; depth: number },
  config: TurretConfig,
  stepM = 1.25,
): SweepWaypoint[] {
  const halfW = plot.width  / 2;
  const halfD = plot.depth  / 2;

  // How many sample points fit along each axis (at least 1)
  const cols = Math.max(1, Math.round(plot.width  / stepM));
  const rows = Math.max(1, Math.round(plot.depth  / stepM));

  // Even spacing within the plot boundary
  const colStep = plot.width  / cols;
  const rowStep = plot.depth  / rows;

  const waypoints: SweepWaypoint[] = [];

  for (let row = 0; row < rows; row++) {
    // Boustrophedon: even rows go left→right, odd rows go right→left
    const colIndices = Array.from({ length: cols }, (_, i) => i);
    if (row % 2 === 1) colIndices.reverse();

    for (const col of colIndices) {
      // Sample centre of each sub-cell
      const x = (plot.centerX - halfW) + (col + 0.5) * colStep;
      const z = (plot.centerZ - halfD) + (row + 0.5) * rowStep;

      const target: TargetPosition = { x, z, y: 0 };
      const angles = calculateTurretAngles(config, target);

      waypoints.push({
        index: waypoints.length,
        x,
        z,
        panDeg:    angles.panDeg,
        tiltDeg:   angles.tiltDeg,
        distanceM: angles.distanceM,
      });
    }
  }

  return waypoints;
}

/**
 * Build the full sweep plan from a plot — waypoints + time estimate.
 *
 * @param dwellMs  How long the pump fires at each waypoint (ms)
 * @param moveMs   Estimated time the turret takes to slew to the next point (ms)
 */
export function buildSweepPlan(
  plot: { centerX: number; centerZ: number; width: number; depth: number },
  config: TurretConfig,
  stepM = 1.25,
  dwellMs = 1500,
  moveMs  = 800,
): SweepPlan {
  const waypoints   = generateSweepWaypoints(plot, config, stepM);
  const estimatedMs = waypoints.length * (dwellMs + moveMs);
  return { waypoints, estimatedMs, stepM, dwellMs };
}

// ─── Arc path (user-drawn polyline) ───────────────────────────────────────────

export interface ArcPoint {
  x: number;
  z: number;
}

/**
 * Compute the cumulative arc-length along a polyline.
 * Returns an array of the same length as `pts`, where [0] = 0 and [n] is the
 * total distance from pts[0] to pts[n].
 */
function cumulativeDistances(pts: ArcPoint[]): number[] {
  const d: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    d.push(d[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z));
  }
  return d;
}

/**
 * Resample a polyline at evenly-spaced intervals, then compute turret angles
 * for every sample point.  Returns `SweepWaypoint[]` so arc waypoints are
 * compatible with existing sweep runner logic.
 *
 * @param rawPoints  The user-drawn polyline (world XZ coords, at least 2 pts)
 * @param config     Turret placement + limits
 * @param stepM      Distance between sample points along the arc (metres)
 */
export function sampleArcWaypoints(
  rawPoints: ArcPoint[],
  config: TurretConfig,
  stepM = 1.25,
): SweepWaypoint[] {
  if (rawPoints.length < 2) return [];

  const cumDist = cumulativeDistances(rawPoints);
  const totalLen = cumDist[cumDist.length - 1];
  if (totalLen < 0.01) return [];

  // How many samples along the arc?
  const count = Math.max(2, Math.ceil(totalLen / stepM) + 1);
  const interval = totalLen / (count - 1);

  const waypoints: SweepWaypoint[] = [];
  let segIdx = 0; // current segment index into rawPoints

  for (let i = 0; i < count; i++) {
    const targetDist = i * interval;

    // Advance segIdx so cumDist[segIdx] <= targetDist <= cumDist[segIdx+1]
    while (segIdx < rawPoints.length - 2 && cumDist[segIdx + 1] < targetDist) {
      segIdx++;
    }

    const segLen = cumDist[segIdx + 1] - cumDist[segIdx];
    const t = segLen > 1e-9 ? (targetDist - cumDist[segIdx]) / segLen : 0;
    const x = rawPoints[segIdx].x + t * (rawPoints[segIdx + 1].x - rawPoints[segIdx].x);
    const z = rawPoints[segIdx].z + t * (rawPoints[segIdx + 1].z - rawPoints[segIdx].z);

    const target: TargetPosition = { x, z, y: 0 };
    const angles = calculateTurretAngles(config, target);

    waypoints.push({
      index: waypoints.length,
      x,
      z,
      panDeg: angles.panDeg,
      tiltDeg: angles.tiltDeg,
      distanceM: angles.distanceM,
    });
  }

  return waypoints;
}

/**
 * Build a full arc plan — waypoints + time estimate.
 * Returns the same `SweepPlan` shape used by coverage sweeps.
 */
export function buildArcPlan(
  rawPoints: ArcPoint[],
  config: TurretConfig,
  stepM = 1.25,
  dwellMs = 1500,
  moveMs = 800,
): SweepPlan {
  const waypoints = sampleArcWaypoints(rawPoints, config, stepM);
  const estimatedMs = waypoints.length * (dwellMs + moveMs);
  return { waypoints, estimatedMs, stepM, dwellMs };
}

// ─── Hardware conversion helpers ──────────────────────────────────────────────

/**
 * Convert pan degrees to NEMA17 stepper step count.
 * Default: 8000 steps/revolution (matches firmware STEPS_PER_REV).
 */
export function degreesToStepperSteps(degrees: number, stepsPerRev = 8000): number {
  return Math.round((degrees / 360) * stepsPerRev);
}

/**
 * Convert servo tilt angle (0–180°) to PWM pulse width in microseconds.
 * Standard MG996R: 1000 µs = 0°, 1500 µs = 90°, 2000 µs = 180°.
 */
export function servoAngleToMicroseconds(degrees: number): number {
  return Math.round(1000 + (degrees / 180) * 1000);
}
