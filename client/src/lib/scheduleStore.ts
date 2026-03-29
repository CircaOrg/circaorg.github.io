import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Schedule {
  id: string;
  name: string;
  station_id: string;
  trigger: {
    type: 'time' | 'condition';
    cron?: string;
    metric?: string;
    operator?: string;
    threshold?: number;
  };
  conditions: unknown[];
  actions: { type: string; angle?: number; duration?: number }[];
  enabled: boolean;
  created_at: string;
}

interface ScheduleStore {
  schedules: Schedule[];
  addSchedule: (data: Omit<Schedule, 'id' | 'created_at'>) => Schedule;
  removeSchedule: (id: string) => void;
  updateSchedule: (id: string, patch: Partial<Schedule>) => void;
}

export const useScheduleStore = create<ScheduleStore>()(
  persist(
    (set) => ({
      schedules: [],

      addSchedule: (data) => {
        const s: Schedule = {
          ...data,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
        };
        set((state) => ({ schedules: [s, ...state.schedules] }));
        return s;
      },

      removeSchedule: (id) =>
        set((state) => ({ schedules: state.schedules.filter((s) => s.id !== id) })),

      updateSchedule: (id, patch) =>
        set((state) => ({
          schedules: state.schedules.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        })),
    }),
    { name: 'circa-schedules' },
  ),
);
