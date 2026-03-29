import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DEFAULT_HARDWARE_URL = 'http://192.168.4.1';

export interface HardwareStore {
  urls: Record<string, string>;
  useViam: boolean;
  setUrl: (stationId: string, url: string) => void;
  getUrl: (stationId: string) => string;
  setUseViam: (use: boolean) => void;
}

export const useHardwareStore = create<HardwareStore>()(
  persist(
    (set, get) => ({
      urls: {},
      useViam: true, // Default to Viam
      setUrl: (stationId, url) =>
        set((s) => ({ urls: { ...s.urls, [stationId]: url } })),
      getUrl: (stationId) => get().urls[stationId] ?? DEFAULT_HARDWARE_URL,
      setUseViam: (useViam) => set({ useViam }),
    }),
    {
      name: 'circa-hardware-urls',
      partialize: (s) => ({ urls: s.urls, useViam: s.useViam }),
    },
  ),
);
