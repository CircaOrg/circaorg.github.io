/**
 * useSimulatedData — temporary demo hook.
 *
 * Injects 1 base station + 2 sensor nodes into the Zustand field store and
 * continuously fires simulated sensor readings every 1.5 s (simulating live
 * transmissions). Also intercepts fetch() so the Control-page Scheduler and
 * Configure-page device lists look fully populated without a real server.
 *
 * To restore real data: remove the import + useSimulatedData() call from App.tsx.
 */
import { useEffect } from 'react';
import { useFieldStore } from '../lib/socket';
import type { BaseStation, Node } from '../lib/socket';

// ─── Static device definitions ────────────────────────────────────────────────

const SIMULATED_STATION: BaseStation = {
  id:             'demo-station-01',
  name:           'Base Station Alpha',
  field_x:        0.5,
  field_y:        0.5,
  crop_type:      'Wheat',
  online:         true,
  humidity:       62,
  temperature:    23.4,
  soil_moisture:  47,
  turret_range_m: 18,
};

const SIMULATED_NODES: Node[] = [
  {
    id:                  'demo-node-01',
    station_id:          'demo-station-01',
    name:                'Node A',
    field_x:             0.28,
    field_y:             0.35,
    crop_type:           'Wheat',
    online:              true,
    soil_moisture:       54,
    irrigation_radius_m: 8,
  },
  {
    id:                  'demo-node-02',
    station_id:          'demo-station-01',
    name:                'Node B',
    field_x:             0.73,
    field_y:             0.65,
    crop_type:           'Wheat',
    online:              true,
    soil_moisture:       38,
    irrigation_radius_m: 8,
  },
];

// ─── Simulated schedules for the Control → Scheduler tab ───────────────────────

const SIMULATED_SCHEDULES = [
  {
    id:         'demo-sched-01',
    name:       'Morning Moisture Check',
    station_id: 'demo-station-01',
    trigger:    { type: 'condition', metric: 'soil_moisture', operator: '<', threshold: 30 },
    conditions: [],
    actions:    [{ type: 'fire_turret', angle: 90, duration: 8 }],
    enabled:    true,
    created_at: new Date(Date.now() - 86_400_000 * 2).toISOString(),
  },
  {
    id:         'demo-sched-02',
    name:       'Sunrise Irrigation',
    station_id: 'demo-station-01',
    trigger:    { type: 'time', cron: '0 6 * * *' },
    conditions: [],
    actions:    [{ type: 'fire_turret', angle: 45, duration: 15 }],
    enabled:    true,
    created_at: new Date(Date.now() - 86_400_000 * 5).toISOString(),
  },
  {
    id:         'demo-sched-03',
    name:       'Evening Top-Up',
    station_id: 'demo-station-01',
    trigger:    { type: 'time', cron: '0 19 * * *' },
    conditions: [],
    actions:    [{ type: 'fire_turret', angle: 135, duration: 10 }],
    enabled:    false,
    created_at: new Date(Date.now() - 86_400_000 * 1).toISOString(),
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fluctuate(base: number, noise: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, base + (Math.random() - 0.5) * 2 * noise));
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ─── Fetch interceptor ────────────────────────────────────────────────────────

// A mutable list of simulated schedules so create/delete work within the session.
let simulatedSchedules = [...SIMULATED_SCHEDULES];

const originalFetch = window.fetch.bind(window);

function simulatedScheduleId(): string {
  return 'demo-sched-' + Math.random().toString(36).slice(2, 8);
}

function interceptedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url   = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
  const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();

  // ── GET /api/schedules ──────────────────────────────────────────────────────
  if (url.includes('/api/schedules') && method === 'GET' && !url.match(/\/api\/schedules\/[^/]+$/)) {
    return Promise.resolve(jsonResponse(simulatedSchedules));
  }

  // ── POST /api/schedules ─────────────────────────────────────────────────────
  if (url.includes('/api/schedules') && method === 'POST' && !url.match(/\/api\/schedules\/[^/]+$/)) {
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : {};
    const newSchedule = { ...body, id: simulatedScheduleId(), created_at: new Date().toISOString() };
    simulatedSchedules = [newSchedule, ...simulatedSchedules];
    return Promise.resolve(jsonResponse(newSchedule, 201));
  }

  // ── PATCH /api/schedules/:id ────────────────────────────────────────────────
  if (url.match(/\/api\/schedules\/[^/]+$/) && method === 'PATCH') {
    const id   = url.split('/').pop()!;
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : {};
    simulatedSchedules = simulatedSchedules.map((s) => s.id === id ? { ...s, ...body } : s);
    return Promise.resolve(jsonResponse({ ok: true }));
  }

  // ── DELETE /api/schedules/:id ───────────────────────────────────────────────
  if (url.match(/\/api\/schedules\/[^/]+$/) && method === 'DELETE') {
    const id = url.split('/').pop()!;
    simulatedSchedules = simulatedSchedules.filter((s) => s.id !== id);
    return Promise.resolve(jsonResponse({ ok: true }));
  }

  // ── GET/POST /api/stations ──────────────────────────────────────────────────
  if (url.match(/\/api\/stations$/) && method === 'GET') {
    return Promise.resolve(jsonResponse([SIMULATED_STATION]));
  }
  if (url.match(/\/api\/stations$/) && method === 'POST') {
    return Promise.resolve(jsonResponse({ ok: true }, 201));
  }

  // ── DELETE /api/stations/:id ────────────────────────────────────────────────
  if (url.match(/\/api\/stations\/[^/]+$/) && !url.includes('/nodes') && method === 'DELETE') {
    return Promise.resolve(jsonResponse({ ok: true }));
  }

  // ── GET/POST /api/stations/nodes ────────────────────────────────────────────
  if (url.includes('/api/stations/nodes') && method === 'GET') {
    return Promise.resolve(jsonResponse(SIMULATED_NODES));
  }
  if (url.includes('/api/stations/nodes') && method === 'POST') {
    return Promise.resolve(jsonResponse({ ok: true }, 201));
  }

  // ── DELETE /api/stations/nodes/:id ─────────────────────────────────────────
  if (url.match(/\/api\/stations\/nodes\/[^/]+$/) && method === 'DELETE') {
    return Promise.resolve(jsonResponse({ ok: true }));
  }

  // All other requests pass through unmodified
  return originalFetch(input, init);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSimulatedData() {
  useEffect(() => {
    const store = useFieldStore.getState();

    // Seed field store devices
    store.upsertStation(SIMULATED_STATION);
    SIMULATED_NODES.forEach((n) => store.upsertNode(n));

    // Install fetch interceptor (so Control/Configure pages see simulated server data)
    simulatedSchedules = [...SIMULATED_SCHEDULES]; // reset to defaults each mount
    window.fetch = interceptedFetch as typeof fetch;

    // Continuously emit simulated sensor readings — mimics live transmissions
    const interval = setInterval(() => {
      const now = new Date().toISOString();
      store.applyReading({ entityType: 'station', entityId: SIMULATED_STATION.id, metric: 'humidity',      value: fluctuate(62,   3,   40, 95),  timestamp: now });
      store.applyReading({ entityType: 'station', entityId: SIMULATED_STATION.id, metric: 'temperature',   value: fluctuate(23.4, 0.8, 10, 45),  timestamp: now });
      store.applyReading({ entityType: 'station', entityId: SIMULATED_STATION.id, metric: 'soil_moisture', value: fluctuate(47,   2,   10, 100), timestamp: now });
      store.applyReading({ entityType: 'node',    entityId: SIMULATED_NODES[0].id, metric: 'soil_moisture', value: fluctuate(54, 3, 10, 100), timestamp: now });
      store.applyReading({ entityType: 'node',    entityId: SIMULATED_NODES[1].id, metric: 'soil_moisture', value: fluctuate(38, 3, 10, 100), timestamp: now });
    }, 1500);

    return () => {
      clearInterval(interval);
      window.fetch = originalFetch as typeof fetch; // restore real fetch
      store.removeStation(SIMULATED_STATION.id);
      SIMULATED_NODES.forEach((n) => store.removeNode(n.id));
    };
  }, []);
}

