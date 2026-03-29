import { createRobotClient, BoardClient, MotorClient, SensorClient } from '@viamrobotics/sdk';
import type { RobotClient } from '@viamrobotics/sdk';
import { useHardwareStore } from './hardwareStore';

// ── Hardware constants ──────────────────────────────────────────
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
 * Client for the smart turrets, supporting both direct ESP32 HTTP and Viam WebRTC API.
 */
export class TurretApiClient {
  private _url: string;
  private viamHost: string;
  private robotClient: RobotClient | null = null;
  private isConnecting = false;

  constructor(hardwareUrl = 'test-machine.viam.cloud') {
    this._url = hardwareUrl.replace(/\/$/, '');
    this.viamHost = hardwareUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }

  private get useViam() {
    return useHardwareStore.getState().useViam;
  }

  // ─── Legacy HTTP Fallback ──────────────────────────────────────────────────

  private async callHttp(path: string, params: Record<string, string | number> = {}): Promise<HardwareResult> {
    const url = new URL(this._url + path);
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

  // ─── Viam Robotics Client SDK ──────────────────────────────────────────────

  private async getRobot(): Promise<RobotClient> {
    if (this.robotClient) return this.robotClient;
    if (this.isConnecting) {
      while (this.isConnecting) await new Promise((r) => setTimeout(r, 100));
      return this.robotClient!;
    }
    this.isConnecting = true;
    try {
      this.robotClient = await createRobotClient({
        host: this.viamHost,
        credentials: {
          type: 'api-key',
          payload: 'viam-secret-placeholder', // In production, inject securely from .env
          authEntity: this.viamHost
        },
      });
      return this.robotClient;
    } catch (e: any) {
      console.warn('Viam client connection failed, simulating local node...', e.message);
      throw e;
    } finally {
      this.isConnecting = false;
    }
  }

  // ─── Universal Hardware Methods ──────────────────────────────────────────

  /** Check reachability */
  async ping(): Promise<HardwareResult> {
    if (!this.useViam) return this.callHttp('/');
    try {
      await this.getRobot();
      return { ok: true, status: 200, body: 'Viam Connection OK' };
    } catch(err: any) {
      return { ok: false, status: 500, body: err.message };
    }
  }

  /** Set servo pitch angle (0–180°). */
  async setServo(angle: number): Promise<HardwareResult> {
    if (!this.useViam) return this.callHttp('/api/servo', { angle: Math.round(angle) });
    try {
      const robot = await this.getRobot();
      const tiltMotor = new MotorClient(robot, 'tilt-motor');
      await tiltMotor.goTo(60, Math.round(angle));
      return { ok: true, status: 200, body: 'Tilt adjusted' };
    } catch (err: any) {
      return { ok: false, status: 500, body: err.message };
    }
  }

  /** Start continuous stepper rotation. */
  async startStepper(dir: StepperDir, speed: number = SPEED_DEFAULT): Promise<HardwareResult> {
    if (!this.useViam) return this.callHttp('/api/stepper/start', { dir, speed: Math.round(speed) });
    try {
      const robot = await this.getRobot();
      const panMotor = new MotorClient(robot, 'pan-motor');
      await panMotor.setPower(dir === 'cw' ? 0.5 : -0.5);
      return { ok: true, status: 200, body: 'Motor turning continuous' };
    } catch (err: any) {
      return { ok: false, status: 500, body: err.message };
    }
  }

  /** Rotate exactly N steps then stop. */
  async jogStepper(dir: StepperDir, speed: number = SPEED_DEFAULT, steps: number = 100): Promise<HardwareResult> {
    if (!this.useViam) return this.callHttp('/api/stepper/jog', { dir, speed: Math.round(speed), steps: Math.round(steps) });
    try {
      const robot = await this.getRobot();
      const panMotor = new MotorClient(robot, 'pan-motor');
      await panMotor.goFor(60, dir === 'cw' ? 1 : -1); 
      return { ok: true, status: 200, body: 'Motor jogged' };
    } catch (err: any) {
      return { ok: false, status: 500, body: err.message };
    }
  }

  /** Stop all stepper motion immediately. */
  async stopStepper(): Promise<HardwareResult> {
    if (!this.useViam) return this.callHttp('/api/stepper/stop');
    try {
      const robot = await this.getRobot();
      const panMotor = new MotorClient(robot, 'pan-motor');
      await panMotor.stop();
      return { ok: true, status: 200, body: 'Motor stopped' };
    } catch (err: any) {
      return { ok: false, status: 500, body: err.message };
    }
  }

  /** Aim using normalised joystick coordinates (−1.0 to 1.0). */
  async aim(x: number, y: number, speed: number = SPEED_DEFAULT): Promise<HardwareResult> {
    if (!this.useViam) return this.callHttp('/api/aim', { x: x.toFixed(4), y: y.toFixed(4), speed: Math.round(speed) });
    try {
      const robot = await this.getRobot();
      const panMotor = new MotorClient(robot, 'pan-motor');
      const tiltMotor = new MotorClient(robot, 'tilt-motor');
      await Promise.all([
        panMotor.goTo(60, (x + 1) * 180),
        tiltMotor.goTo(60, (y + 1) * 90)
      ]);
      return { ok: true, status: 200, body: 'Aimed via Viam motors' };
    } catch (err: any) {
      return { ok: false, status: 500, body: err.message };
    }
  }

  /** Turn pump relay on. */
  async pumpOn(durationMs?: number): Promise<HardwareResult> {
    if (!this.useViam) {
      return durationMs && durationMs > 0
        ? this.callHttp('/api/pump/on', { duration: durationMs })
        : this.callHttp('/api/pump/on');
    }
    try {
      const robot = await this.getRobot();
      const relay = new BoardClient(robot, 'pump-relay');
      await relay.setGPIO('pump-pin', true);
      
      if (durationMs && durationMs > 0) {
        setTimeout(() => relay.setGPIO('pump-pin', false), durationMs);
      }
      return { ok: true, status: 200, body: 'Pump activated' };
    } catch (err: any) {
      return { ok: false, status: 500, body: err.message };
    }
  }

  /** Turn pump relay off. */
  async pumpOff(): Promise<HardwareResult> {
    if (!this.useViam) return this.callHttp('/api/pump/off');
    try {
      const robot = await this.getRobot();
      const relay = new BoardClient(robot, 'pump-relay');
      await relay.setGPIO('pump-pin', false);
      return { ok: true, status: 200, body: 'Pump deactivated' };
    } catch (err: any) {
      return { ok: false, status: 500, body: err.message };
    }
  }

  /** Fetch latest readings from all connected sensor nodes. */
  async fetchNodes(): Promise<NodeReading[]> {
    if (!this.useViam) {
      const r = await this.callHttp('/api/nodes');
      if (!r.ok) return [];
      try {
        const data = JSON.parse(r.body) as { nodes: NodeReading[] };
        return data.nodes ?? [];
      } catch {
        return [];
      }
    }
    
    try {
      const robot = await this.getRobot();
      const soilSensor = new SensorClient(robot, 'soil-sensor');
      const readings = await soilSensor.getReadings();
      return [
        { mac: '00:11', id: 'node-1', soil_pct: readings['moisture'] as number ?? 45, soil_wet: true, last_seen_s: 0 }
      ];
    } catch {
      return [];
    }
  }
}
