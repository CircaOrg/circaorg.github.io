import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiDroplet,
  FiPlay,
  FiPower,
  FiRefreshCw,
  FiRotateCcw,
  FiRotateCw,
  FiSend,
  FiSquare,
  FiTarget,
  FiXCircle,
} from 'react-icons/fi';
import {
  TurretApiClient,
  SPEED_MIN, SPEED_MAX, SPEED_DEFAULT,
  SERVO_MIN, SERVO_MAX, SERVO_HOME,
  STEPS_PER_REV, PUMP_MAX_MS,
} from '../lib/turretApi';
import type { HardwareResult, StepperDir, NodeReading } from '../lib/turretApi';
import './ControlPage.css';


export default function ControlPage() {
  return <TurretTab />;
}



function TurretTab() {
  const api = useMemo(() => new TurretApiClient('http://192.168.4.1'), []);

  return (
    <div className="turret-tab">
      <h2 className="ctrl-section-title">Hardware Control</h2>
      <p className="ctrl-section-sub">Direct control of the ESP32 turret base station</p>

      {/* ── Auto-detected base station card ── */}
      <div className="hw-connection card">
        <div className="hw-connection-row">
          <div className="hw-auto-info">
            <span className="label">Base Station</span>
            <span className="hw-url mono">http://192.168.4.1</span>
            <span className="hw-auto-hint">Auto-detected — connect to Turret-ESP32 WiFi</span>
          </div>
        </div>
      </div>

      {/* ── Turret controls — always shown ── */}
      <EmergencyStop api={api} />
      <AimPanel api={api} />
      <StepperPanel api={api} />
      <ServoPanel api={api} />
      <PumpPanel api={api} />

      {/* ── Node sensor readings — always visible ── */}
      <NodeReadingsPanel api={api} />
    </div>
  );
}

// ── Emergency Stop ─────────────────────────────────────────
function EmergencyStop({ api }: { api: TurretApiClient }) {
  const [busy, setBusy] = useState(false);

  const stop = async () => {
    setBusy(true);
    await Promise.all([api.stopStepper(), api.pumpOff()]);
    setBusy(false);
  };

  return (
    <div className="hw-estop-bar">
      <button className="hw-estop-btn" disabled={busy} onClick={stop}>
        {busy ? <span className="spinner hw-estop-spinner" /> : <FiAlertTriangle aria-hidden="true" />}
        <span>Emergency Stop</span>
      </button>
      <span className="hw-estop-hint">Stops stepper + pump immediately</span>
    </div>
  );
}

// ── Joystick pad ───────────────────────────────────────────
function JoystickPad({
  x, y, size = 200,
  onChange,
  onRelease,
}: {
  x: number; y: number; size?: number;
  onChange: (x: number, y: number) => void;
  onRelease?: () => void;
}) {
  const padRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const fromEvent = (e: React.PointerEvent | PointerEvent) => {
    if (!padRef.current) return;
    const rect = padRef.current.getBoundingClientRect();
    const r    = rect.width / 2;
    let nx = (e.clientX - (rect.left + r)) / r;
    let ny = (e.clientY - (rect.top  + r)) / r;
    const mag = Math.hypot(nx, ny);
    if (mag > 1) { nx /= mag; ny /= mag; }
    onChange(nx, ny);
  };

  return (
    <div
      ref={padRef}
      className="joystick-pad"
      style={{ width: size, height: size }}
      onPointerDown={(e) => {
        dragging.current = true;
        padRef.current?.setPointerCapture(e.pointerId);
        fromEvent(e);
      }}
      onPointerMove={(e) => { if (dragging.current) fromEvent(e); }}
      onPointerUp={() => { dragging.current = false; onRelease?.(); }}
      onPointerCancel={() => { dragging.current = false; onRelease?.(); }}
    >
      {/* Crosshair */}
      <div className="joystick-line joystick-h" />
      <div className="joystick-line joystick-v" />
      {/* Inner ring */}
      <div className="joystick-ring joystick-ring--inner" />
      {/* Handle */}
      <div
        className="joystick-handle"
        style={{ left: `${50 + x * 50}%`, top: `${50 + y * 50}%` }}
      />
    </div>
  );
}

// ── Aim Panel (joystick-driven) ─────────────────────────────
function AimPanel({ api }: { api: TurretApiClient }) {
  const [jx, setJx] = useState(0);
  const [jy, setJy] = useState(0);
  const [aimSpeed, setAimSpeed] = useState(SPEED_DEFAULT);
  const [liveMode, setLiveMode] = useState(false);
  const [sprayMs, setSprayMs] = useState(3000);
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<HardwareResult | null>(null);
  const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestXY    = useRef({ x: 0, y: 0 });

  const sendAim = useCallback(async (x: number, y: number) => {
    const r = await api.aim(x, y, aimSpeed);
    setResult(r);
  }, [api, aimSpeed]);

  const handleJoystick = (x: number, y: number) => {
    setJx(x); setJy(y);
    latestXY.current = { x, y };

    if (liveMode) {
      if (throttleRef.current) return; // already scheduled
      throttleRef.current = setTimeout(() => {
        throttleRef.current = null;
        sendAim(latestXY.current.x, latestXY.current.y);
      }, 150);
    }
  };

  const sendOnce = async () => {
    setBusy('aim');
    setResult(null);
    const r = await api.aim(jx, jy, aimSpeed);
    setResult(r);
    setBusy(null);
  };

  const fire = async () => {
    setBusy('fire');
    setResult(null);
    const aimR = await api.aim(jx, jy, aimSpeed);
    if (!aimR.ok) { setResult(aimR); setBusy(null); return; }
    const pumpR = await api.pumpOn();
    setResult(pumpR);
    setBusy(null);
    // auto-off
    setTimeout(() => api.pumpOff(), sprayMs);
  };

  const radius = Math.min(Math.hypot(jx, jy), 1);
  const yawDeg = (Math.atan2(-jy, jx) * 180 / Math.PI + 360) % 360;

  return (
    <section className="hw-panel card">
      <div className="hw-aim-header">
        <h3 className="hw-panel-title">Aim</h3>
        <label className="hw-live-toggle">
          <input
            type="checkbox"
            checked={liveMode}
            onChange={(e) => setLiveMode(e.target.checked)}
          />
          <span className={`hw-live-pill ${liveMode ? 'active' : ''}`}>Live</span>
        </label>
      </div>

      {liveMode && (
        <p className="hw-panel-sub hw-live-note">
          Aim commands are sent continuously as you drag.
        </p>
      )}

      <div className="hw-aim-body">
        <JoystickPad x={jx} y={jy} size={180} onChange={handleJoystick} />

        <div className="hw-aim-readout">
          <div className="hw-readout-row">
            <span className="hw-readout-label">Yaw</span>
            <span className="hw-readout-val mono">{yawDeg.toFixed(1)}°</span>
          </div>
          <div className="hw-readout-row">
            <span className="hw-readout-label">Radius</span>
            <span className="hw-readout-val mono">{radius.toFixed(2)}</span>
          </div>
          <div className="hw-readout-row">
            <span className="hw-readout-label">X</span>
            <span className="hw-readout-val mono">{jx.toFixed(3)}</span>
          </div>
          <div className="hw-readout-row">
            <span className="hw-readout-label">Y</span>
            <span className="hw-readout-val mono">{jy.toFixed(3)}</span>
          </div>

          <div className="form-row" style={{ marginTop: 12 }}>
            <label className="label">Speed</label>
            <div className="hw-speed-presets">
              {([['Slow', 100], ['Med', 350], ['Fast', 800]] as const).map(([label, val]) => (
                <button
                  key={label}
                  className={`hw-speed-preset ${aimSpeed === val ? 'active' : ''}`}
                  onClick={() => setAimSpeed(val)}
                >{label}</button>
              ))}
            </div>
            <span className="hw-range-hint mono">{aimSpeed} steps/s</span>
          </div>
        </div>
      </div>

      {!liveMode && (
        <button className="btn-primary hw-btn hw-btn--full" disabled={!!busy} onClick={sendOnce}>
          {busy === 'aim' ? <><span className="spinner" /> Aiming…</> : <><FiSend aria-hidden="true" /> Send Aim</>}
        </button>
      )}

      {/* ── Fire row ── */}
      <div className="hw-fire-row">
        <div className="form-row hw-fire-dur">
          <label className="label">Spray — {(sprayMs / 1000).toFixed(0)} s</label>
          <input
            type="range" className="angle-slider"
            min={1000} max={PUMP_MAX_MS} step={1000} value={sprayMs}
            onChange={(e) => setSprayMs(parseInt(e.target.value))}
          />
        </div>
        <button
          className="btn-primary hw-btn hw-fire-btn"
          disabled={!!busy}
          onClick={fire}
        >
          {busy === 'fire' ? <span className="spinner" /> : <><FiTarget aria-hidden="true" /> Fire</>}
        </button>
      </div>

      <HwResult result={result} />
    </section>
  );
}

// ── Stepper Panel ──────────────────────────────────────────
function StepperPanel({ api }: { api: TurretApiClient }) {
  const [speed, setSpeed] = useState(SPEED_DEFAULT);
  const [jogSteps, setJogSteps] = useState(200);
  const [jogDir, setJogDir] = useState<StepperDir>('cw');
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<HardwareResult | null>(null);

  const run = async (label: string, fn: () => Promise<HardwareResult>) => {
    setBusy(label);
    setResult(null);
    const r = await fn();
    setResult(r);
    setBusy(null);
  };

  return (
    <section className="hw-panel card">
      <h3 className="hw-panel-title">Stepper — Yaw Rotation</h3>

      <div className="form-row">
        <label className="label">Speed — {speed} steps/s</label>
        <div className="hw-speed-presets">
          {([['Slow', 100], ['Med', 350], ['Fast', 800]] as const).map(([label, val]) => (
            <button
              key={label}
              className={`hw-speed-preset ${speed === val ? 'active' : ''}`}
              onClick={() => setSpeed(val)}
            >{label}</button>
          ))}
        </div>
        <input
          type="range" className="angle-slider"
          min={SPEED_MIN} max={SPEED_MAX} step={50} value={speed}
          onChange={(e) => setSpeed(parseInt(e.target.value))}
        />
      </div>

      <div className="hw-btn-row">
        <button className="btn-primary hw-btn" disabled={!!busy}
          onClick={() => run('cw', () => api.startStepper('cw', speed))}>
          {busy === 'cw' ? <span className="spinner" /> : <><FiRotateCw aria-hidden="true" /> CW</>}
        </button>
        <button className="btn-primary hw-btn" disabled={!!busy}
          onClick={() => run('ccw', () => api.startStepper('ccw', speed))}>
          {busy === 'ccw' ? <span className="spinner" /> : <><FiRotateCcw aria-hidden="true" /> CCW</>}
        </button>
        <button className="btn-ghost hw-btn hw-btn--stop" disabled={busy === 'stop'}
          onClick={() => run('stop', () => api.stopStepper())}>
          {busy === 'stop' ? <span className="spinner" /> : <><FiSquare aria-hidden="true" /> Stop</>}
        </button>
      </div>

      <div className="hw-jog-row">
        <div className="form-row hw-jog-steps">
          <label className="label">Steps</label>
          <input className="input mono" type="number" min="1" max={STEPS_PER_REV * 10}
            value={jogSteps} onChange={(e) => setJogSteps(parseInt(e.target.value))} />
        </div>
        <div className="form-row hw-jog-dir">
          <label className="label">Dir</label>
          <select className="input" value={jogDir} onChange={(e) => setJogDir(e.target.value as StepperDir)}>
            <option value="cw">CW</option>
            <option value="ccw">CCW</option>
          </select>
        </div>
        <button className="btn-primary hw-btn hw-jog-btn" disabled={!!busy}
          onClick={() => run('jog', () => api.jogStepper(jogDir, speed, jogSteps))}>
          {busy === 'jog' ? <span className="spinner" /> : 'Jog'}
        </button>
      </div>

      <HwResult result={result} />
    </section>
  );
}

// ── Servo Panel ────────────────────────────────────────────
function ServoPanel({ api }: { api: TurretApiClient }) {
  const [angle, setAngle] = useState(SERVO_HOME);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<HardwareResult | null>(null);

  const send = async (a: number) => {
    setBusy(true);
    setResult(null);
    const r = await api.setServo(a);
    setResult(r);
    setBusy(false);
  };

  const PRESETS = [
    { label: 'Near', value: 130 },
    { label: 'Home', value: SERVO_HOME },
    { label: 'Far',  value: 45 },
  ] as const;

  return (
    <section className="hw-panel card">
      <h3 className="hw-panel-title">Servo — Pitch / Tilt</h3>

      <div className="hw-servo-presets">
        {PRESETS.map(({ label, value }) => (
          <button
            key={label}
            className={`hw-servo-preset ${angle === value ? 'active' : ''}`}
            disabled={busy}
            onClick={() => { setAngle(value); send(value); }}
          >
            <span className="hw-servo-preset-label">{label}</span>
            <span className="hw-servo-preset-deg mono">{value}°</span>
          </button>
        ))}
      </div>

      <div className="form-row">
        <label className="label">Custom — {angle}° <span className="hw-range-hint">({SERVO_MIN}–{SERVO_MAX}°)</span></label>
        <div className="angle-wrap">
          <input type="range" className="angle-slider"
            min={SERVO_MIN} max={SERVO_MAX} value={angle}
            onChange={(e) => setAngle(parseInt(e.target.value))} />
          <span className="angle-val mono">{angle}°</span>
        </div>
      </div>

      <button className="btn-primary hw-btn" disabled={busy} onClick={() => send(angle)}>
        {busy ? <span className="spinner" /> : 'Set Angle'}
      </button>

      <HwResult result={result} />
    </section>
  );
}

// ── Pump Panel ─────────────────────────────────────────────
function PumpPanel({ api }: { api: TurretApiClient }) {
  const [sprayMs, setSprayMs] = useState(5000);
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<HardwareResult | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = async (label: string, fn: () => Promise<HardwareResult>) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setBusy(label);
    setResult(null);
    const r = await fn();
    setResult(r);
    setBusy(null);
  };

  const spray = async () => {
    await run('spray', () => api.pumpOn());
    timerRef.current = setTimeout(async () => {
      const r = await api.pumpOff();
      setResult(r);
    }, sprayMs);
  };

  return (
    <section className="hw-panel card">
      <h3 className="hw-panel-title">Pump</h3>

      <div className="hw-btn-row">
        <button className="btn-primary hw-btn hw-pump-on" disabled={!!busy}
          onClick={() => run('on', () => api.pumpOn())}>
          {busy === 'on' ? <span className="spinner" /> : <><FiDroplet aria-hidden="true" /> Pump On</>}
        </button>
        <button className="btn-ghost hw-btn" disabled={!!busy}
          onClick={() => run('off', () => api.pumpOff())}>
          {busy === 'off' ? <span className="spinner" /> : <><FiPower aria-hidden="true" /> Pump Off</>}
        </button>
      </div>

      <div className="hw-spray-row">
        <div className="form-row hw-spray-dur">
          <label className="label">
            Timed spray — {(sprayMs / 1000).toFixed(0)} s
            <span className="hw-range-hint"> (max {PUMP_MAX_MS / 1000} s)</span>
          </label>
          <input type="range" className="angle-slider"
            min={1000} max={PUMP_MAX_MS} step={1000} value={sprayMs}
            onChange={(e) => setSprayMs(parseInt(e.target.value))} />
        </div>
        <button className="btn-primary hw-btn hw-spray-btn" disabled={!!busy} onClick={spray}>
          {busy === 'spray' ? <span className="spinner" /> : <><FiPlay aria-hidden="true" /> Spray</>}
        </button>
      </div>

      <HwResult result={result} />
    </section>
  );
}

// ── Shared result badge ────────────────────────────────────
function HwResult({ result }: { result: HardwareResult | null }) {
  if (!result) return null;
  return (
    <p className={`fire-result ${result.ok ? 'success' : 'error'}`}>
      {result.ok ? <FiCheckCircle aria-hidden="true" /> : <FiXCircle aria-hidden="true" />} {result.ok ? 'OK' : `Error ${result.status}`}
      {result.body ? ` — ${result.body.slice(0, 80)}` : ''}
    </p>
  );
}

// ── Node Readings Panel ─────────────────────────────────────
function NodeReadingsPanel({ api }: { api: TurretApiClient }) {
  const [nodes, setNodes] = useState<NodeReading[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await api.fetchNodes();
    setNodes(data);
    setLastFetch(new Date());
    setLoading(false);
  }, [api]);

  // Auto-refresh every 35 s (slightly longer than node sleep interval)
  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 35_000);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <div className="hw-panel">
      <div className="hw-panel-header">
        <span className="hw-panel-title">Sensor Nodes</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {lastFetch && (
            <span className="hw-result hw-result--ok" style={{ fontSize: 10 }}>
              {lastFetch.toLocaleTimeString()}
            </span>
          )}
          <button className="btn-ghost hw-ping-btn" onClick={refresh} disabled={loading}>
            {loading ? <span className="spinner" /> : <FiRefreshCw aria-hidden="true" />}
          </button>
        </div>
      </div>

      {nodes.length === 0 ? (
        <p className="hw-empty-hint">
          {loading
            ? 'Searching for nodes…'
            : 'No nodes detected — connect to Turret-ESP32 WiFi and wait up to 30 s for a reading.'}
        </p>
      ) : (
        <div className="node-readings-grid">
          {nodes.map((n) => (
            <div key={n.mac} className={`node-card ${n.soil_wet ? 'node-card--wet' : 'node-card--dry'}`}>
              <div className="node-card-header">
                <span className="node-card-id">{n.id}</span>
                <span className={`hw-badge ${n.last_seen_s < 120 ? 'hw-badge--ok' : 'hw-badge--fail'}`}>
                  {n.last_seen_s < 60 ? `${n.last_seen_s}s ago` : `${Math.floor(n.last_seen_s / 60)}m ago`}
                </span>
              </div>
              <div className="node-soil-bar-wrap">
                <div className="node-soil-bar" style={{ width: `${n.soil_pct}%` }} />
              </div>
              <div className="node-card-row">
                <span className="node-soil-val">{n.soil_pct.toFixed(1)}%</span>
                <span className={`node-wet-badge ${n.soil_wet ? 'wet' : 'dry'}`}>
                  {n.soil_wet ? 'WET' : 'DRY'}
                </span>
              </div>
              <span className="node-mac mono">{n.mac}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


