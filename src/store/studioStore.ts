import { create } from 'zustand';
import { Studio } from '@/types';
import { studios } from '@/data/studios';

interface StudioStore {
  studios: Studio[];
  selectedStudio: Studio | null;
  filterStatus: 'all' | 'available' | 'busy' | 'maintenance';
  setSelectedStudio: (studio: Studio | null) => void;
  setFilterStatus: (status: 'all' | 'available' | 'busy' | 'maintenance') => void;
  getFilteredStudios: () => Studio[];
  getStudioById: (id: string) => Studio | undefined;
}

export const useStudioStore = create<StudioStore>((set, get) => ({
  studios,
  selectedStudio: null,
  filterStatus: 'all',

  setSelectedStudio: (studio) => set({ selectedStudio: studio }),

  setFilterStatus: (status) => {
    console.log('[StudioStore] 筛选状态变更', status);
    set({ filterStatus: status });
  },

  getFilteredStudios: () => {
    const { studios, filterStatus } = get();
    if (filterStatus === 'all') return studios;
    return studios.filter((s) => s.status === filterStatus);
  },

  getStudioById: (id) => {
    return get().studios.find((s) => s.id === id);
  }
}));
