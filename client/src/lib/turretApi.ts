// ── Hardware constants (matches ESP32 firmware spec) ──────────────────────────
export const STEPS_PER_REV   = 8000;
export const SPEED_DEFAULT   = 350;
export const SPEED_MIN       = 50;
export const SPEED_MAX       = 1200;
export const SERVO_HOME      = 90;
export const SERVO_NEAR      = 130;
export const SERVO_FAR       = 45;
export const SERVO_MIN       = 0;
export const SERVO_MAX       = 180;
export const PUMP_MAX_MS     = 60_000;

export type StepperDir = 'cw' | 'ccw';

export interface HardwareResult {
  ok: boolean;
  status: number;
  body: string;
}

export interface NodeReading {
  mac: string;
  id: string;
  soil_pct: number;
  soil_wet: boolean;
  last_seen_s: number;
}

/**
 * Client for the ESP32 turret HTTP API.
 * Calls the ESP32 directly from the browser — connect to Turret-ESP32 Wi-Fi first.
 */
export class TurretApiClient {
  private hardwareUrl: string;

  /** @param hardwareUrl  Base URL of the ESP32, e.g. "http://192.168.4.1" */
  constructor(hardwareUrl = 'http://192.168.4.1') {
    this.hardwareUrl = hardwareUrl.replace(/\/$/, '');
  }

  private async call(path: string, params: Record<string, string | number> = {}): Promise<HardwareResult> {
    const url = new URL(this.hardwareUrl + path);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, String(v));
    }
    try {
      const res = await fetch(url.toString());
      const body = await res.text();
      return { ok: res.ok, status: res.status, body };
    } catch (err: any) {
      return { ok: false, status: 0, body: err?.message ?? 'Network error' };
    }
  }

  /** Check reachability — GETs the root of the ESP32 web server. */
  ping(): Promise<HardwareResult> {
    return this.call('/');
  }

  /** Set servo pitch angle (0–180°). */
  setServo(angle: number): Promise<HardwareResult> {
    return this.call('/api/servo', { angle: Math.round(angle) });
  }

  /** Start continuous stepper rotation. */
  startStepper(dir: StepperDir, speed: number = SPEED_DEFAULT): Promise<HardwareResult> {
    return this.call('/api/stepper/start', { dir, speed: Math.round(speed) });
  }

  /** Rotate exactly N steps then stop. */
  jogStepper(dir: StepperDir, speed: number = SPEED_DEFAULT, steps: number = 100): Promise<HardwareResult> {
    return this.call('/api/stepper/jog', { dir, speed: Math.round(speed), steps: Math.round(steps) });
  }

  /** Stop all stepper motion immediately. */
  stopStepper(): Promise<HardwareResult> {
    return this.call('/api/stepper/stop');
  }

  /**
   * Aim using normalised joystick coordinates (−1.0 to 1.0).
   * The ESP32 converts x/y → yaw + pitch internally.
   */
  aim(x: number, y: number, speed: number = SPEED_DEFAULT): Promise<HardwareResult> {
    return this.call('/api/aim', { x: x.toFixed(4), y: y.toFixed(4), speed: Math.round(speed) });
  }

  /** Turn pump relay on. Pass durationMs to auto-stop; omit for manual control. */
  pumpOn(durationMs?: number): Promise<HardwareResult> {
    return durationMs && durationMs > 0
      ? this.call('/api/pump/on', { duration: durationMs })
      : this.call('/api/pump/on');
  }

  /** Turn pump relay off. */
  pumpOff(): Promise<HardwareResult> {
    return this.call('/api/pump/off');
  }

  /** Fetch latest readings from all connected sensor nodes. */
  async fetchNodes(): Promise<NodeReading[]> {
    const r = await this.call('/api/nodes');
    if (!r.ok) return [];
    try {
      const data = JSON.parse(r.body) as { nodes: NodeReading[] };
      return data.nodes ?? [];
    } catch {
      return [];
    }
  }
}
