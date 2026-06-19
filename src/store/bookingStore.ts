import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import dayjs from 'dayjs';
import Taro from '@tarojs/taro';
import { Booking, WaitlistItem, TimeSlot, BookingStatus, WaitlistStatus } from '@/types';
import { calculatePricing } from '@/utils/pricing';
import { getSchedulesByDate } from '@/data/schedules';
import { getBookingsByStatus as getMockBookings } from '@/data/bookings';
import { getWaitlistByStatus as getMockWaitlist } from '@/data/waitlist';
import { getRates } from './rateStore';

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
  refreshSchedules: () => void;
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'status'> & { status?: BookingStatus }) => Booking;
  getBookingById: (id: string) => Booking | undefined;
  addWaitlist: (item: Omit<WaitlistItem, 'id' | 'position' | 'status' | 'createdAt'>) => WaitlistItem;
  confirmWaitlist: (id: string) => { booking: Booking; waitlist: WaitlistItem } | null;
  cancelWaitlist: (id: string) => void;
  processTimeoutBookings: () => void;
  processExpiredWaitlistNotifications: () => void;
  notifyNextWaitlist: (studioId: string, date: string, startTime: string, endTime: string) => WaitlistItem | null;
  recalcWaitlistPositions: () => void;
  getWaitlistPosition: (studioId: string, date: string, startTime: string, endTime: string) => number;
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
}

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

export const useBookingStore = create<BookingStore>()(
  persist(
    (set, get) => ({
      bookings: getMockBookings(),
      waitlist: getMockWaitlist(),
      schedules: [],
      selectedDate: dayjs().format('YYYY-MM-DD'),
      selectedStudioId: null,
      selectedStartTime: null,
      selectedEndTime: null,
      _hasHydrated: false,

      setHasHydrated: (v) => set({ _hasHydrated: v }),

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

      refreshSchedules: () => {
        const { selectedDate, selectedStudioId } = get();
        const schedules = getSchedulesByDate(selectedDate, selectedStudioId || undefined);
        const { bookings, waitlist } = get();

        const processedSchedules = schedules.map((slot) => {
          const activeBooking = bookings.find(
            (b) =>
              b.studioId === slot.studioId &&
              b.date === slot.date &&
              b.startTime <= slot.startTime &&
              b.endTime > slot.startTime &&
              (b.status === 'confirmed' || b.status === 'pending')
          );

          if (activeBooking) {
            return { ...slot, status: 'booked' as const, bookingId: activeBooking.id };
          }

          const notifiedWaitlist = waitlist.find(
            (w) =>
              w.studioId === slot.studioId &&
              w.date === slot.date &&
              w.startTime <= slot.startTime &&
              w.endTime > slot.startTime &&
              w.status === 'notified'
          );

          if (notifiedWaitlist) {
            return { ...slot, status: 'notified' as const };
          }

          const hasWaiting = waitlist.some(
            (w) =>
              w.studioId === slot.studioId &&
              w.date === slot.date &&
              w.startTime <= slot.startTime &&
              w.endTime > slot.startTime &&
              w.status === 'waiting'
          );

          if (hasWaiting) {
            return { ...slot, status: 'waitlist' as const };
          }

          return slot;
        });

        console.log('[BookingStore] 刷新排期状态', {
          date: selectedDate,
          studioId: selectedStudioId,
          total: processedSchedules.length,
          booked: processedSchedules.filter((s) => s.status === 'booked').length,
          notified: processedSchedules.filter((s) => s.status === 'notified').length,
          waitlist: processedSchedules.filter((s) => s.status === 'waitlist').length,
          available: processedSchedules.filter((s) => s.status === 'available').length
        });

        set({ schedules: processedSchedules });
      },

      addBooking: (booking) => {
        const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
        let rateSnapshot = '';
        try {
          rateSnapshot = JSON.stringify(getRates());
        } catch (e) {
          console.error('[BookingStore] 生成费率快照失败', e);
        }
        const newBooking: Booking = {
          ...booking,
          id: `booking-${Date.now()}`,
          status: booking.status || 'confirmed',
          createdAt: now,
          rateSnapshot
        };
        set({ bookings: [newBooking, ...get().bookings] });
        console.log('[BookingStore] 新增预约成功', newBooking);
        get().refreshSchedules();
        return newBooking;
      },

      getBookingById: (id) => {
        return get().bookings.find((b) => b.id === id);
      },

      getWaitlistPosition: (studioId, date, startTime, endTime) => {
        const sameSlotWaiting = get().waitlist.filter(
          (w) =>
            w.studioId === studioId &&
            w.date === date &&
            w.startTime === startTime &&
            w.endTime === endTime &&
            (w.status === 'waiting' || w.status === 'notified')
        );
        return sameSlotWaiting.length + 1;
      },

      recalcWaitlistPositions: () => {
        const { waitlist } = get();
        const positionMap: Record<string, number> = {};
        const recalculated = waitlist
          .sort((a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf())
          .map((w) => {
            if (w.status !== 'waiting' && w.status !== 'notified') {
              return w;
            }
            const key = `${w.studioId}-${w.date}-${w.startTime}-${w.endTime}`;
            positionMap[key] = (positionMap[key] || 0) + 1;
            return { ...w, position: positionMap[key] };
          });
        set({ waitlist: recalculated });
      },

      addWaitlist: (item) => {
        const position = get().getWaitlistPosition(
          item.studioId,
          item.date,
          item.startTime,
          item.endTime
        );
        const newItem: WaitlistItem = {
          ...item,
          id: `waitlist-${Date.now()}`,
          position,
          status: 'waiting',
          createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
        };
        set({ waitlist: [...get().waitlist, newItem] });
        console.log('[BookingStore] 加入候补成功', { ...newItem, position });
        get().refreshSchedules();
        return newItem;
      },

      confirmWaitlist: (id) => {
        const { waitlist, addBooking } = get();
        const item = waitlist.find((w) => w.id === id);
        if (!item) return null;

        const updatedWaitlist = waitlist.map((w) =>
          w.id === id
            ? {
                ...w,
                status: 'confirmed' as WaitlistStatus,
                expiresAt: undefined
              }
            : w
        );
        set({ waitlist: updatedWaitlist });

        const pricing = calculatePricing(item.date, item.startTime, item.endTime);
        const booking = addBooking({
          studioId: item.studioId,
          studioName: item.studioName,
          userId: item.userId,
          userName: item.userName,
          date: item.date,
          startTime: item.startTime,
          endTime: item.endTime,
          totalHours: pricing.totalHours,
          segments: pricing.segments,
          totalAmount: pricing.totalAmount
        });

        get().recalcWaitlistPositions();
        console.log('[BookingStore] 候补补位确认成功，生成预约', { waitlist: item, booking });
        return { booking, waitlist: { ...item, status: 'confirmed' } };
      },

      cancelWaitlist: (id) => {
        const item = get().waitlist.find((w) => w.id === id);
        if (!item) return;

        const wasNotified = item.status === 'notified';

        set({
          waitlist: get().waitlist.map((w) =>
            w.id === id ? { ...w, status: 'cancelled' as const, position: 0 } : w
          )
        });
        get().recalcWaitlistPositions();

        if (wasNotified) {
          get().notifyNextWaitlist(item.studioId, item.date, item.startTime, item.endTime);
        } else {
          get().refreshSchedules();
        }
        console.log('[BookingStore] 取消候补', { id, wasNotified });
      },

      processTimeoutBookings: () => {
        const now = dayjs();
        const { bookings, notifyNextWaitlist } = get();
        let changed = false;

        const updatedBookings = bookings.map((b) => {
          if (b.status !== 'confirmed' && b.status !== 'pending') return b;
          const bookingStart = dayjs(`${b.date} ${b.startTime}`);
          const timeoutAt = bookingStart.add(30, 'minute');
          if (now.isAfter(timeoutAt)) {
            changed = true;
            console.log('[BookingStore] 超时未到，释放预约', {
              id: b.id,
              start: `${b.date} ${b.startTime}`
            });
            return {
              ...b,
              status: 'no_show' as BookingStatus,
              releaseTime: now.format('YYYY-MM-DD HH:mm:ss')
            };
          }
          return b;
        });

        if (changed) {
          set({ bookings: updatedBookings });
          updatedBookings.forEach((b) => {
            if (b.status === 'no_show') {
              notifyNextWaitlist(b.studioId, b.date, b.startTime, b.endTime);
            }
          });
          get().refreshSchedules();
        }

        return changed;
      },

      notifyNextWaitlist: (studioId, date, startTime, endTime) => {
        const { waitlist } = get();
        const candidate = waitlist
          .filter(
            (w) =>
              w.studioId === studioId &&
              w.date === date &&
              w.startTime === startTime &&
              w.endTime === endTime &&
              w.status === 'waiting'
          )
          .sort((a, b) => a.position - b.position)[0];

        if (!candidate) {
          console.log('[BookingStore] 无有效候补中用户', { studioId, date, startTime, endTime });
          get().refreshSchedules();
          return null;
        }

        const now = dayjs();
        const expiresAt = now.add(15, 'minute').format('YYYY-MM-DD HH:mm:ss');
        const updated = waitlist.map((w) =>
          w.id === candidate.id
            ? {
                ...w,
                status: 'notified' as WaitlistStatus,
                notifiedAt: now.format('YYYY-MM-DD HH:mm:ss'),
                expiresAt
              }
            : w
        );
        set({ waitlist: updated });
        get().refreshSchedules();
        console.log('[BookingStore] 通知候补补位', {
          candidate: candidate.id,
          position: candidate.position,
          expiresAt
        });
        return { ...candidate, status: 'notified', notifiedAt: now.format('YYYY-MM-DD HH:mm:ss'), expiresAt };
      },

      processExpiredWaitlistNotifications: () => {
        const now = dayjs();
        const { waitlist } = get();
        let changed = false;
        const expiredItems: Array<{ studioId: string; date: string; startTime: string; endTime: string }> = [];

        const updated = waitlist.map((w) => {
          if (w.status === 'notified' && w.expiresAt && now.isAfter(dayjs(w.expiresAt))) {
            changed = true;
            console.log('[BookingStore] 候补补位确认超时，顺延下一位', w.id);
            expiredItems.push({
              studioId: w.studioId,
              date: w.date,
              startTime: w.startTime,
              endTime: w.endTime
            });
            return { ...w, status: 'expired' as WaitlistStatus, position: 0 };
          }
          return w;
        });

        if (changed) {
          set({ waitlist: updated });
          get().recalcWaitlistPositions();
          expiredItems.forEach((item) => {
            get().notifyNextWaitlist(item.studioId, item.date, item.startTime, item.endTime);
          });
        }
        return changed;
      }
    }),
    {
      name: 'booking-store',
      partialize: (state) => ({
        bookings: state.bookings,
        waitlist: state.waitlist
      }),
      storage: {
        getItem: async (name) => storage.getItem(name),
        setItem: async (name, value) => storage.setItem(name, value),
        removeItem: async (name) => storage.removeItem(name)
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('[BookingStore] 数据已从本地存储恢复');
          state.setHasHydrated(true);
          state.processTimeoutBookings();
          state.processExpiredWaitlistNotifications();
          state.recalcWaitlistPositions();
        }
      }
    }
  )
);
