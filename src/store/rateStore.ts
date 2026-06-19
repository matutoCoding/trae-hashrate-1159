import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Taro from '@tarojs/taro';
import { TimeRate } from '@/types';
import { rates as defaultRates } from '@/data/rates';

const storage = {
  getItem: (name: string) => {
    try {
      return Taro.getStorageSync(name);
    } catch (e) {
      console.error('[Storage] getItem error', name, e);
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      Taro.setStorageSync(name, value);
    } catch (e) {
      console.error('[Storage] setItem error', name, e);
    }
  },
  removeItem: (name: string) => {
    try {
      Taro.removeStorageSync(name);
    } catch (e) {
      console.error('[Storage] removeItem error', name, e);
    }
  }
};

interface RateStore {
  rates: TimeRate[];
  updateRate: (id: string, patch: Partial<TimeRate>) => void;
  setRates: (rates: TimeRate[]) => void;
  resetRates: () => void;
}

export const useRateStore = create<RateStore>()(
  persist(
    (set, get) => ({
      rates: defaultRates,

      updateRate: (id, patch) => {
        set({
          rates: get().rates.map((r) => (r.id === id ? { ...r, ...patch } : r))
        });
        console.log('[RateStore] 更新费率', { id, patch });
      },

      setRates: (rates) => {
        set({ rates });
        console.log('[RateStore] 批量设置费率', rates.length);
      },

      resetRates: () => {
        set({ rates: defaultRates });
        console.log('[RateStore] 恢复默认费率');
      }
    }),
    {
      name: 'rate-store',
      storage: {
        getItem: async (name) => storage.getItem(name),
        setItem: async (name, value) => storage.setItem(name, value),
        removeItem: async (name) => storage.removeItem(name)
      }
    }
  )
);

export function getRates(): TimeRate[] {
  try {
    return useRateStore.getState().rates;
  } catch (e) {
    return defaultRates;
  }
}
