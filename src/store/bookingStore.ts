import { create } from 'zustand';
import dayjs from 'dayjs';
import { Booking, WaitlistItem, TimeSlot } from '@/types';
import { getBookingsByStatus } from '@/data/bookings';
import { getWaitlistByStatus } from '@/data/waitlist';
import { getSchedulesByDate } from '@/data/schedules';

interface BookingStore {
  bookings: Booking[];
  waitlist: WaitlistItem[];
  schedules: TimeSlot[];
  selectedDate: string;
  selectedStudioId: string | null;
  selectedStartTime: string | null;
  selectedEndTime: string | null;
  setSelectedDate: (date: string) => void;
  setSelectedStudioId: (id: string | null) => void;
  setSelectedTimeRange: (start: string | null, end: string | null) => void;
  refreshBookings: () => void;
  refreshWaitlist: () => void;
  refreshSchedules: () => void;
  addWaitlist: (item: Omit<WaitlistItem, 'id' | 'position' | 'status' | 'createdAt'>) => void;
  cancelWaitlist: (id: string) => void;
}

export const useBookingStore = create<BookingStore>((set, get) => ({
  bookings: getBookingsByStatus(),
  waitlist: getWaitlistByStatus(),
  schedules: [],
  selectedDate: dayjs().format('YYYY-MM-DD'),
  selectedStudioId: null,
  selectedStartTime: null,
  selectedEndTime: null,

  setSelectedDate: (date) => {
    console.log('[BookingStore] 选择日期', date);
    set({ selectedDate: date });
    get().refreshSchedules();
  },

  setSelectedStudioId: (id) => {
    console.log('[BookingStore] 选择影棚', id);
    set({ selectedStudioId: id, selectedStartTime: null, selectedEndTime: null });
    get().refreshSchedules();
  },

  setSelectedTimeRange: (start, end) => {
    console.log('[BookingStore] 选择时段', { start, end });
    set({ selectedStartTime: start, selectedEndTime: end });
  },

  refreshBookings: () => {
    set({ bookings: getBookingsByStatus() });
  },

  refreshWaitlist: () => {
    set({ waitlist: getWaitlistByStatus() });
  },

  refreshSchedules: () => {
    const { selectedDate, selectedStudioId } = get();
    const schedules = getSchedulesByDate(selectedDate, selectedStudioId || undefined);
    set({ schedules });
  },

  addWaitlist: (item) => {
    const newItem: WaitlistItem = {
      ...item,
      id: `waitlist-${Date.now()}`,
      position: get().waitlist.length + 1,
      status: 'waiting',
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    };
    set({ waitlist: [...get().waitlist, newItem] });
    console.log('[BookingStore] 加入候补成功', newItem);
  },

  cancelWaitlist: (id) => {
    set({
      waitlist: get().waitlist.map((w) =>
        w.id === id ? { ...w, status: 'cancelled' as const } : w
      )
    });
    console.log('[BookingStore] 取消候补', id);
  }
}));
