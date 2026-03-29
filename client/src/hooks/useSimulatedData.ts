/**
 * useSimulatedData — demo hook.
 *
 * Injects 1 base station + 2 sensor nodes into the Zustand field store,
 * seeds the schedule store with example schedules, and continuously fires
 * simulated sensor readings every 1.5 s to mimic live transmissions.
 *
 * To restore real hardware data: remove the import + useSimulatedData() call from App.tsx.
 */
import { useEffect } from 'react';
import { useFieldStore } from '../lib/socket';
import { useScheduleStore } from '../lib/scheduleStore';
import type { BaseStation, Node } from '../lib/socket';
import type { Schedule } from '../lib/scheduleStore';

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

const SIMULATED_SCHEDULES: Omit<Schedule, 'id' | 'created_at'>[] = [
  {
    name:       'Morning Moisture Check',
    station_id: 'demo-station-01',
    trigger:    { type: 'condition', metric: 'soil_moisture', operator: '<', threshold: 30 },
    conditions: [],
    actions:    [{ type: 'fire_turret', angle: 90, duration: 8 }],
    enabled:    true,
  },
  {
    name:       'Sunrise Irrigation',
    station_id: 'demo-station-01',
    trigger:    { type: 'time', cron: '0 6 * * *' },
    conditions: [],
    actions:    [{ type: 'fire_turret', angle: 45, duration: 15 }],
    enabled:    true,
  },
  {
    name:       'Evening Top-Up',
    station_id: 'demo-station-01',
    trigger:    { type: 'time', cron: '0 19 * * *' },
    conditions: [],
    actions:    [{ type: 'fire_turret', angle: 135, duration: 10 }],
    enabled:    false,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fluctuate(base: number, noise: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, base + (Math.random() - 0.5) * 2 * noise));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSimulatedData() {
  useEffect(() => {
    const fieldStore    = useFieldStore.getState();
    const scheduleStore = useScheduleStore.getState();

    // Seed field store devices
    fieldStore.upsertStation(SIMULATED_STATION);
    SIMULATED_NODES.forEach((n) => fieldStore.upsertNode(n));

    // Seed schedule store (only if empty to avoid duplicating on re-mount)
    if (scheduleStore.schedules.length === 0) {
      SIMULATED_SCHEDULES.forEach((s) => scheduleStore.addSchedule(s));
    }

    // Continuously emit simulated sensor readings — mimics live transmissions
    const interval = setInterval(() => {
      const now = new Date().toISOString();
      fieldStore.applyReading({ entityType: 'station', entityId: SIMULATED_STATION.id, metric: 'humidity',      value: fluctuate(62,   3,   40, 95),  timestamp: now });
      fieldStore.applyReading({ entityType: 'station', entityId: SIMULATED_STATION.id, metric: 'temperature',   value: fluctuate(23.4, 0.8, 10, 45),  timestamp: now });
      fieldStore.applyReading({ entityType: 'station', entityId: SIMULATED_STATION.id, metric: 'soil_moisture', value: fluctuate(47,   2,   10, 100), timestamp: now });
      fieldStore.applyReading({ entityType: 'node',    entityId: SIMULATED_NODES[0].id, metric: 'soil_moisture', value: fluctuate(54, 3, 10, 100), timestamp: now });
      fieldStore.applyReading({ entityType: 'node',    entityId: SIMULATED_NODES[1].id, metric: 'soil_moisture', value: fluctuate(38, 3, 10, 100), timestamp: now });
    }, 1500);

    return () => {
      clearInterval(interval);
      fieldStore.removeStation(SIMULATED_STATION.id);
      SIMULATED_NODES.forEach((n) => fieldStore.removeNode(n.id));
    };
  }, []);
}
