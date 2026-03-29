/**
 * Irrigation Control Page
 *
 * Three modes:
 *  - Single shot: aim at plot centre, fire pump for chosen duration.
 *  - Full coverage: generate a boustrophedon sweep grid over the plot,
 *    step the turret through every waypoint, fire pump briefly at each.
 *  - Arc path: user draws a freehand path across the field; turret follows
 *    the arc spraying at evenly-spaced waypoints along it.
 */

import { useState, useMemo, useRef, useCallback } from 'react';
import { useFieldStore } from '../lib/socket';
import { useHardwareStore } from '../lib/hardwareStore';
import { IS_STATIC_DEPLOYMENT } from '../lib/runtimeConfig';
import { TurretApiClient } from '../lib/turretApi';
import { IrrigationFieldView, type PlotCell } from '../components/IrrigationFieldView';
import {
  calculateTurretAngles,
  buildSweepPlan,
  buildArcPlan,
  degreesToStepperSteps,
  servoAngleToMicroseconds,
  type ArcPoint,
  type TurretConfig,
  type TurretAngle,
  type SweepWaypoint,
  type SweepPlan,
} from '../lib/irrigationTargeting';
import { polygonPointFromNormalized, DEFAULT_FIELD_POLYGON } from '../lib/fieldShape';
import './IrrigationControlPage.css';

// ─── Move delay helper ──────────────────────────────────────────────────────────
// How long to wait for the turret to physically slew to a new position (ms).
// In a production build this could be derived from step count + speed.
const MOVE_SETTLE_MS = 900;

function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

// ─── Types ──────────────────────────────────────────────────────────────────────

type Mode = 'single' | 'coverage' | 'arc';

interface FiringRecord {
  plotId: string;
  mode: Mode;
  panDeg: number;
  tiltDeg: number;
  distanceM: number;
  durationMs: number;
  waypointCount?: number;
  timestamp: string;
}

interface FireResult {
  ok: boolean;
  message: string;
  at: string;
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function IrrigationControlPage() {
  const { stations }  = useFieldStore();
  const hardwareStore = useHardwareStore();

  const [selectedPlot, setSelectedPlot]   = useState<PlotCell | null>(null);
  const [durationMs, setDurationMs]       = useState(5000);
  const [mode, setMode]                   = useState<Mode>('single');
  const [stepM, setStepM]                 = useState(1.25);
  const [dwellMs, setDwellMs]             = useState(1500);
  const [firing, setFiring]               = useState(false);
  const [lastResult, setLastResult]       = useState<FireResult | null>(null);
  const [history, setHistory]             = useState<FiringRecord[]>([]);

  // Sweep visualisation state
  const [sweepWaypoints, setSweepWaypoints]         = useState<SweepWaypoint[]>([]);
  const [sweepActiveIndex, setSweepActiveIndex]     = useState(-1);
  const [sweepProgress, setSweepProgress]           = useState({ done: 0, total: 0 });

  // Arc state
  const [arcRawPoints, setArcRawPoints]     = useState<ArcPoint[]>([]);
  const [arcActiveIndex, setArcActiveIndex] = useState(-1);

  // Abort ref — set to true mid-sweep to cancel
  const abortRef = useRef(false);

  const station = stations[0] ?? null;

  const turretConfig: TurretConfig = useMemo(() => {
    if (!station) {
      return { baseX: 0, baseZ: 0, nozzleHeightM: 1.2, panMinDeg: 0, panMaxDeg: 360, tiltMinDeg: 5, tiltMaxDeg: 85 };
    }
    const { x, z } = polygonPointFromNormalized(station.field_x, station.field_y, DEFAULT_FIELD_POLYGON);
    return { baseX: x, baseZ: z, nozzleHeightM: 1.2, panMinDeg: 0, panMaxDeg: 360, tiltMinDeg: 5, tiltMaxDeg: 85 };
  }, [station]);

  const singleAngles: TurretAngle | null = useMemo(() => {
    if (!selectedPlot || mode !== 'single') return null;
    return calculateTurretAngles(turretConfig, { x: selectedPlot.centerX, z: selectedPlot.centerZ, y: 0 });
  }, [selectedPlot, turretConfig, mode]);

  const sweepPlan: SweepPlan | null = useMemo(() => {
    if (!selectedPlot || mode !== 'coverage') return null;
    return buildSweepPlan(selectedPlot, turretConfig, stepM, dwellMs, MOVE_SETTLE_MS);
  }, [selectedPlot, turretConfig, mode, stepM, dwellMs]);

  const arcPlan: SweepPlan | null = useMemo(() => {
    if (mode !== 'arc' || arcRawPoints.length < 2) return null;
    return buildArcPlan(arcRawPoints, turretConfig, stepM, dwellMs, MOVE_SETTLE_MS);
  }, [arcRawPoints, turretConfig, mode, stepM, dwellMs]);

  // ── Aim helper: pan + tilt in one call ──────────────────────────────────────

  const aimAt = useCallback(async (
    client: TurretApiClient,
    panDeg: number,
    tiltDeg: number,
  ): Promise<void> => {
    // ESP32 /api/aim expects normalised joystick x/y:
    //   yawDeg = atan2(-y, x) × 180/π
    // Inverse: x = cos(panRad), y = -sin(panRad)
    const panRad = (panDeg * Math.PI) / 180;
    const joyX   = Math.cos(panRad);
    const joyY   = -Math.sin(panRad);

    const aimRes = await client.aim(joyX, joyY);
    if (!aimRes.ok) throw new Error(`Aim failed: ${aimRes.body}`);

    const servoRes = await client.setServo(tiltDeg);
    if (!servoRes.ok) throw new Error(`Servo failed: ${servoRes.body}`);
  }, []);

  // ── Single-shot fire ─────────────────────────────────────────────────────────

  const handleSingleFire = async () => {
    if (!selectedPlot || !station || !singleAngles) return;

    if (IS_STATIC_DEPLOYMENT) {
      setLastResult({
        ok: false,
        message: 'Live turret control is disabled in static deployment mode.',
        at: new Date().toLocaleTimeString(),
      });
      return;
    }

    setFiring(true);
    setLastResult(null);

    const client = new TurretApiClient(hardwareStore.getUrl(station.id));

    try {
      await aimAt(client, singleAngles.panDeg, singleAngles.tiltDeg);
      const pumpRes = await client.pumpOn(durationMs);
      if (!pumpRes.ok) throw new Error(`Pump failed: ${pumpRes.body}`);

      const ts = new Date().toLocaleTimeString();
      setLastResult({ ok: true, message: 'Irrigation started!', at: ts });
      setHistory((h) => [{
        plotId: selectedPlot.id, mode: 'single',
        panDeg: singleAngles.panDeg, tiltDeg: singleAngles.tiltDeg,
        distanceM: singleAngles.distanceM, durationMs, timestamp: ts,
      }, ...h.slice(0, 9)]);
    } catch (e: any) {
      setLastResult({ ok: false, message: e.message ?? 'Unknown error', at: new Date().toLocaleTimeString() });
    } finally {
      setFiring(false);
    }
  };

  // ── Full-coverage sweep ──────────────────────────────────────────────────────

  const handleCoverageFire = async () => {
    if (!selectedPlot || !station || !sweepPlan) return;

    if (IS_STATIC_DEPLOYMENT) {
      setLastResult({
        ok: false,
        message: 'Live turret control is disabled in static deployment mode.',
        at: new Date().toLocaleTimeString(),
      });
      return;
    }

    abortRef.current = false;
    setFiring(true);
    setLastResult(null);
    setSweepWaypoints(sweepPlan.waypoints);
    setSweepActiveIndex(0);
    setSweepProgress({ done: 0, total: sweepPlan.waypoints.length });

    const client = new TurretApiClient(hardwareStore.getUrl(station.id));

    try {
      for (let i = 0; i < sweepPlan.waypoints.length; i++) {
        if (abortRef.current) {
          await client.pumpOff();
          setLastResult({ ok: false, message: 'Sweep cancelled.', at: new Date().toLocaleTimeString() });
          return;
        }

        const wp = sweepPlan.waypoints[i];
        setSweepActiveIndex(i);

        // 1. Aim turret
        await aimAt(client, wp.panDeg, wp.tiltDeg);

        // 2. Wait for physical movement
        await sleep(MOVE_SETTLE_MS);

        // 3. Pulse the pump
        const pumpRes = await client.pumpOn(sweepPlan.dwellMs);
        if (!pumpRes.ok) throw new Error(`Pump failed at waypoint ${i}: ${pumpRes.body}`);

        // 4. Wait for pump dwell to finish
        await sleep(sweepPlan.dwellMs);

        setSweepProgress({ done: i + 1, total: sweepPlan.waypoints.length });
      }

      // Ensure pump is off at end
      await client.pumpOff();

      const ts = new Date().toLocaleTimeString();
      setLastResult({ ok: true, message: `Coverage sweep complete — ${sweepPlan.waypoints.length} waypoints.`, at: ts });
      setHistory((h) => [{
        plotId: selectedPlot.id, mode: 'coverage',
        panDeg: sweepPlan.waypoints[0]?.panDeg ?? 0,
        tiltDeg: sweepPlan.waypoints[0]?.tiltDeg ?? 0,
        distanceM: sweepPlan.waypoints[0]?.distanceM ?? 0,
        durationMs: sweepPlan.estimatedMs,
        waypointCount: sweepPlan.waypoints.length,
        timestamp: ts,
      }, ...h.slice(0, 9)]);
    } catch (e: any) {
      await client.pumpOff().catch(() => {});
      setLastResult({ ok: false, message: e.message ?? 'Unknown error', at: new Date().toLocaleTimeString() });
    } finally {
      setFiring(false);
      setSweepActiveIndex(-1);
      setSweepWaypoints([]);
    }
  };

  // ── Arc-path fire ───────────────────────────────────────────────────────────

  const handleArcFire = async () => {
    if (!station || !arcPlan || arcPlan.waypoints.length === 0) return;

    if (IS_STATIC_DEPLOYMENT) {
      setLastResult({
        ok: false,
        message: 'Live turret control is disabled in static deployment mode.',
        at: new Date().toLocaleTimeString(),
      });
      return;
    }

    abortRef.current = false;
    setFiring(true);
    setLastResult(null);
    setArcActiveIndex(0);
    setSweepProgress({ done: 0, total: arcPlan.waypoints.length });

    const client = new TurretApiClient(hardwareStore.getUrl(station.id));

    try {
      for (let i = 0; i < arcPlan.waypoints.length; i++) {
        if (abortRef.current) {
          await client.pumpOff();
          setLastResult({ ok: false, message: 'Arc sweep cancelled.', at: new Date().toLocaleTimeString() });
          return;
        }

        const wp = arcPlan.waypoints[i];
        setArcActiveIndex(i);

        await aimAt(client, wp.panDeg, wp.tiltDeg);
        await sleep(MOVE_SETTLE_MS);

        const pumpRes = await client.pumpOn(arcPlan.dwellMs);
        if (!pumpRes.ok) throw new Error(`Pump failed at arc point ${i}: ${pumpRes.body}`);

        await sleep(arcPlan.dwellMs);
        setSweepProgress({ done: i + 1, total: arcPlan.waypoints.length });
      }

      await client.pumpOff();

      const ts = new Date().toLocaleTimeString();
      setLastResult({ ok: true, message: `Arc sweep complete — ${arcPlan.waypoints.length} points.`, at: ts });
      setHistory((h) => [{
        plotId: 'arc-path', mode: 'arc',
        panDeg: arcPlan.waypoints[0]?.panDeg ?? 0,
        tiltDeg: arcPlan.waypoints[0]?.tiltDeg ?? 0,
        distanceM: arcPlan.waypoints[0]?.distanceM ?? 0,
        durationMs: arcPlan.estimatedMs,
        waypointCount: arcPlan.waypoints.length,
        timestamp: ts,
      }, ...h.slice(0, 9)]);
    } catch (e: any) {
      await client.pumpOff().catch(() => {});
      setLastResult({ ok: false, message: e.message ?? 'Unknown error', at: new Date().toLocaleTimeString() });
    } finally {
      setFiring(false);
      setArcActiveIndex(-1);
    }
  };

  const handleAbort = () => { abortRef.current = true; };

  const handleArcDrawn = useCallback((points: ArcPoint[]) => {
    setArcRawPoints(points);
  }, []);

  const clearArc = () => {
    setArcRawPoints([]);
    setArcActiveIndex(-1);
  };

  const handleFire = mode === 'single' ? handleSingleFire
    : mode === 'coverage' ? handleCoverageFire
    : handleArcFire;

  const canFire = !!station && !firing && (
    mode === 'single' ? (!!selectedPlot && !!singleAngles)
    : mode === 'coverage' ? (!!selectedPlot && !!sweepPlan)
    : (!!arcPlan && arcPlan.waypoints.length > 0)
  );

  const fmtTime = (ms: number) =>
    ms < 60_000 ? `~${(ms / 1000).toFixed(0)} s` : `~${(ms / 60_000).toFixed(1)} min`;

  return (
    <div className="irr-page">
      {/* 3D canvas */}
      <div className="irr-canvas">
        {station ? (
          <IrrigationFieldView
            selectedPlot={selectedPlot}
            onSelectPlot={setSelectedPlot}
            onHoverPlot={() => {}}
            sweepWaypoints={sweepWaypoints}
            sweepActiveIndex={sweepActiveIndex}
            arcDrawEnabled={mode === 'arc' && !firing}
            arcRawPoints={arcRawPoints}
            arcWaypoints={arcPlan?.waypoints ?? []}
            arcActiveIndex={arcActiveIndex}
            onArcDrawn={handleArcDrawn}
          />
        ) : (
          <div className="irr-empty">
            No turret stations configured.
            <br /><span>Add one from the Configure page.</span>
          </div>
        )}

        {/* Arc draw instruction overlay */}
        {mode === 'arc' && !firing && station && (
          <div className="irr-arc-overlay">
            <span className="irr-arc-overlay-icon">✏️</span>
            <span>{arcRawPoints.length >= 2 ? 'Drag again to re-draw path' : 'Click & drag to draw spray path'}</span>
          </div>
        )}
      </div>

      {/* Control panel */}
      <div className="irr-panel">
        <div className="irr-section">
          <h2 className="irr-heading">Irrigation Targeting</h2>

          {!station ? (
            <div className="irr-card irr-card--error">
              <p>No turret base configured.</p>
              <p>Add a station on the Configure page first.</p>
            </div>
          ) : (
            <>
              {/* Station info */}
              <div className="irr-card">
                <div className="irr-row">
                  <span className="irr-label">Turret</span>
                  <span className="irr-value">{station.name}</span>
                </div>
                <div className="irr-row">
                  <span className="irr-label">World pos</span>
                  <span className="irr-value irr-mono">
                    X {turretConfig.baseX.toFixed(1)} m · Z {turretConfig.baseZ.toFixed(1)} m
                  </span>
                </div>
              </div>

              {/* Mode toggle */}
              <div className="irr-card irr-card--mode">
                <div className="irr-card-title">Fire Mode</div>
                <div className="irr-mode-toggle">
                  <button
                    className={`irr-mode-btn ${mode === 'single' ? 'active' : ''}`}
                    onClick={() => setMode('single')}
                    disabled={firing}
                  >
                    💧 Single Shot
                  </button>
                  <button
                    className={`irr-mode-btn ${mode === 'coverage' ? 'active' : ''}`}
                    onClick={() => setMode('coverage')}
                    disabled={firing}
                  >
                    ⬛ Full Coverage
                  </button>
                  <button
                    className={`irr-mode-btn ${mode === 'arc' ? 'active' : ''}`}
                    onClick={() => setMode('arc')}
                    disabled={firing}
                  >
                    ✏️ Arc Path
                  </button>
                </div>
              </div>

              {/* Selected plot (for single + coverage) */}
              {mode !== 'arc' && (
                <div className="irr-card">
                  <div className="irr-card-title">Selected Plot</div>
                  {selectedPlot ? (
                    <>
                      <div className="irr-row">
                        <span className="irr-label">ID</span>
                        <span className="irr-value irr-mono">{selectedPlot.id}</span>
                      </div>
                      <div className="irr-row">
                        <span className="irr-label">Size</span>
                        <span className="irr-value irr-mono">
                          {selectedPlot.width} × {selectedPlot.depth} m
                        </span>
                      </div>
                      <div className="irr-row">
                        <span className="irr-label">Centre</span>
                        <span className="irr-value irr-mono">
                          ({selectedPlot.centerX.toFixed(1)}, {selectedPlot.centerZ.toFixed(1)}) m
                        </span>
                      </div>
                      <div className="irr-row">
                        <span className="irr-label">Moisture</span>
                        <span className={`irr-value irr-moisture-${selectedPlot.moisture < 30 ? 'low' : selectedPlot.moisture < 60 ? 'med' : 'high'}`}>
                          {selectedPlot.moisture.toFixed(1)}%
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="irr-hint">Click a coloured plot in the field to target it.</p>
                  )}
                </div>
              )}

              {/* ── SINGLE SHOT controls ── */}
              {mode === 'single' && singleAngles && selectedPlot && (
                <div className="irr-card">
                  <div className="irr-card-title">Targeting Angles</div>
                  <div className="irr-angles">
                    <div className="irr-angle-item">
                      <span className="irr-angle-label">Pan</span>
                      <span className="irr-angle-value">{singleAngles.panDeg.toFixed(1)}°</span>
                      <span className="irr-angle-sub">{Math.round(degreesToStepperSteps(singleAngles.panDeg) / 100) / 10}k steps</span>
                    </div>
                    <div className="irr-angle-item">
                      <span className="irr-angle-label">Tilt</span>
                      <span className="irr-angle-value">{singleAngles.tiltDeg.toFixed(1)}°</span>
                      <span className="irr-angle-sub">{servoAngleToMicroseconds(singleAngles.tiltDeg)} µs</span>
                    </div>
                    <div className="irr-angle-item">
                      <span className="irr-angle-label">Dist</span>
                      <span className="irr-angle-value">{singleAngles.distanceM.toFixed(1)}</span>
                      <span className="irr-angle-sub">metres</span>
                    </div>
                  </div>
                  <div className="irr-slider-wrap">
                    <label className="irr-label">Duration: {(durationMs / 1000).toFixed(1)} s</label>
                    <input type="range" className="irr-slider"
                      min={1000} max={30000} step={500} value={durationMs}
                      onChange={(e) => setDurationMs(Number(e.target.value))} />
                    <div className="irr-slider-range"><span>1 s</span><span>30 s</span></div>
                  </div>
                </div>
              )}

              {/* ── FULL COVERAGE controls ── */}
              {mode === 'coverage' && selectedPlot && (
                <div className="irr-card">
                  <div className="irr-card-title">Coverage Settings</div>

                  {/* Step size */}
                  <div className="irr-slider-wrap">
                    <label className="irr-label">
                      Step size: {stepM.toFixed(2)} m
                      {sweepPlan && (
                        <span className="irr-label-sub"> ({sweepPlan.waypoints.length} waypoints)</span>
                      )}
                    </label>
                    <input type="range" className="irr-slider"
                      min={0.5} max={3.0} step={0.25} value={stepM}
                      onChange={(e) => setStepM(Number(e.target.value))} />
                    <div className="irr-slider-range">
                      <span>Dense 0.5 m</span><span>Coarse 3 m</span>
                    </div>
                  </div>

                  {/* Dwell per waypoint */}
                  <div className="irr-slider-wrap">
                    <label className="irr-label">Dwell per point: {(dwellMs / 1000).toFixed(1)} s</label>
                    <input type="range" className="irr-slider"
                      min={500} max={5000} step={250} value={dwellMs}
                      onChange={(e) => setDwellMs(Number(e.target.value))} />
                    <div className="irr-slider-range"><span>0.5 s</span><span>5 s</span></div>
                  </div>

                  {/* Estimated time */}
                  {sweepPlan && (
                    <div className="irr-sweep-summary">
                      <div className="irr-sweep-stat">
                        <span className="irr-sweep-val">{sweepPlan.waypoints.length}</span>
                        <span className="irr-sweep-lbl">waypoints</span>
                      </div>
                      <div className="irr-sweep-stat">
                        <span className="irr-sweep-val">{sweepPlan.stepM.toFixed(2)} m</span>
                        <span className="irr-sweep-lbl">grid step</span>
                      </div>
                      <div className="irr-sweep-stat">
                        <span className="irr-sweep-val">{fmtTime(sweepPlan.estimatedMs)}</span>
                        <span className="irr-sweep-lbl">est. time</span>
                      </div>
                    </div>
                  )}

                  {/* Live sweep progress */}
                  {firing && mode === 'coverage' && sweepProgress.total > 0 && (
                    <div className="irr-sweep-progress">
                      <div className="irr-sweep-track">
                        <div
                          className="irr-sweep-fill"
                          style={{ width: `${(sweepProgress.done / sweepProgress.total) * 100}%` }}
                        />
                      </div>
                      <span className="irr-sweep-counter">
                        {sweepProgress.done} / {sweepProgress.total}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* ── ARC PATH controls ── */}
              {mode === 'arc' && (
                <div className="irr-card">
                  <div className="irr-card-title">Arc Path</div>

                  {arcRawPoints.length < 2 ? (
                    <div className="irr-arc-prompt">
                      <span className="irr-arc-prompt-icon">✏️</span>
                      <p>Draw a path on the field by clicking and dragging across the 3D view.</p>
                      <p className="irr-hint">The turret will follow your drawn arc and spray at each waypoint.</p>
                    </div>
                  ) : (
                    <>
                      {/* Step size */}
                      <div className="irr-slider-wrap">
                        <label className="irr-label">
                          Step size: {stepM.toFixed(2)} m
                          {arcPlan && (
                            <span className="irr-label-sub"> ({arcPlan.waypoints.length} waypoints)</span>
                          )}
                        </label>
                        <input type="range" className="irr-slider"
                          min={0.5} max={3.0} step={0.25} value={stepM}
                          onChange={(e) => setStepM(Number(e.target.value))} />
                        <div className="irr-slider-range">
                          <span>Dense 0.5 m</span><span>Coarse 3 m</span>
                        </div>
                      </div>

                      {/* Dwell per waypoint */}
                      <div className="irr-slider-wrap">
                        <label className="irr-label">Dwell per point: {(dwellMs / 1000).toFixed(1)} s</label>
                        <input type="range" className="irr-slider"
                          min={500} max={5000} step={250} value={dwellMs}
                          onChange={(e) => setDwellMs(Number(e.target.value))} />
                        <div className="irr-slider-range"><span>0.5 s</span><span>5 s</span></div>
                      </div>

                      {/* Arc summary */}
                      {arcPlan && (
                        <div className="irr-sweep-summary">
                          <div className="irr-sweep-stat">
                            <span className="irr-sweep-val irr-arc-val">{arcPlan.waypoints.length}</span>
                            <span className="irr-sweep-lbl">waypoints</span>
                          </div>
                          <div className="irr-sweep-stat">
                            <span className="irr-sweep-val irr-arc-val">{arcPlan.stepM.toFixed(2)} m</span>
                            <span className="irr-sweep-lbl">spacing</span>
                          </div>
                          <div className="irr-sweep-stat">
                            <span className="irr-sweep-val irr-arc-val">{fmtTime(arcPlan.estimatedMs)}</span>
                            <span className="irr-sweep-lbl">est. time</span>
                          </div>
                        </div>
                      )}

                      {/* Clear arc button */}
                      {!firing && (
                        <button className="irr-btn-clear" onClick={clearArc}>
                          ✕ Clear Path
                        </button>
                      )}

                      {/* Live arc progress */}
                      {firing && mode === 'arc' && sweepProgress.total > 0 && (
                        <div className="irr-sweep-progress">
                          <div className="irr-sweep-track">
                            <div
                              className="irr-sweep-fill irr-sweep-fill--arc"
                              style={{ width: `${(sweepProgress.done / sweepProgress.total) * 100}%` }}
                            />
                          </div>
                          <span className="irr-sweep-counter">
                            {sweepProgress.done} / {sweepProgress.total}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Fire / Abort buttons */}
              {(mode !== 'arc' ? selectedPlot : arcRawPoints.length >= 2) && (
                <div className="irr-card">
                  {firing ? (
                    <button className="irr-btn-abort" onClick={handleAbort}>
                      ✕ Stop {mode === 'arc' ? 'Arc' : 'Sweep'}
                    </button>
                  ) : (
                    <button className="irr-btn-fire" disabled={!canFire} onClick={handleFire}>
                      {mode === 'single' ? '💧 Fire Turret'
                        : mode === 'coverage' ? '⬛ Start Coverage Sweep'
                        : '✏️ Start Arc Sweep'}
                    </button>
                  )}

                  {lastResult && (
                    <div className={`irr-result ${lastResult.ok ? 'irr-result--ok' : 'irr-result--err'}`}>
                      <span>{lastResult.ok ? '✓' : '✗'}</span>
                      <span>{lastResult.message}</span>
                      <span className="irr-result-time">{lastResult.at}</span>
                    </div>
                  )}
                </div>
              )}

              {/* History */}
              {history.length > 0 && (
                <div className="irr-card">
                  <div className="irr-card-title">Recent Fires</div>
                  <div className="irr-history">
                    {history.map((r, i) => (
                      <div key={i} className="irr-history-row irr-mono">
                        <span className="irr-h-mode">{r.mode === 'coverage' ? '⬛' : r.mode === 'arc' ? '✏️' : '💧'}</span>
                        <span className="irr-h-pan">Pan {r.panDeg.toFixed(0)}°</span>
                        <span className="irr-h-tilt">Tilt {r.tiltDeg.toFixed(0)}°</span>
                        {r.waypointCount
                          ? <span className="irr-h-dist">{r.waypointCount} pts</span>
                          : <span className="irr-h-dist">{r.distanceM.toFixed(1)} m</span>
                        }
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Tips */}
        <div className="irr-section irr-section--tips">
          <div className="irr-tips-title">How to use</div>
          <ul className="irr-tips">
            <li><strong>Single Shot</strong> — aims at the plot centre and fires once</li>
            <li><strong>Full Coverage</strong> — sweeps the entire rectangle in a snake pattern</li>
            <li><strong>Arc Path</strong> — draw a custom spray path by dragging across the field</li>
            <li>Adjust step size to control waypoint density vs. speed</li>
            <li>Click "Stop" at any time to abort the run</li>
            <li>Blue dots = coverage path · Orange dots = arc path · White dot = active spray</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
