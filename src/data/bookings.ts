import dayjs from 'dayjs';
import { Booking, BookingStatus } from '@/types';
import { calculatePricing } from '@/utils/pricing';
import { studios } from './studios';

const statusList: BookingStatus[] = ['confirmed', 'completed', 'no_show', 'pending', 'cancelled'];

function generateMockBooking(index: number): Booking {
  const studio = studios[index % studios.length];
  const date = dayjs()
    .subtract(Math.floor(Math.random() * 10), 'day')
    .format('YYYY-MM-DD');
  const startHour = 8 + Math.floor(Math.random() * 10);
  const duration = 1 + Math.floor(Math.random() * 4);
  const startTime = `${String(startHour).padStart(2, '0')}:00`;
  const endTime = `${String(startHour + duration).padStart(2, '0')}:00`;
  const pricing = calculatePricing(date, startTime, endTime);
  const status = statusList[index % statusList.length];

  return {
    id: `booking-${String(index + 1).padStart(5, '0')}`,
    studioId: studio.id,
    studioName: studio.name,
    userId: 'user-001',
    userName: '张先生',
    date,
    startTime,
    endTime,
    totalHours: pricing.totalHours,
    segments: pricing.segments,
    totalAmount: pricing.totalAmount,
    status,
    createdAt: dayjs().subtract(index, 'day').format('YYYY-MM-DD HH:mm:ss'),
    checkInTime: status === 'completed' ? dayjs(date + ' ' + startTime).add(5, 'minute').format('YYYY-MM-DD HH:mm:ss') : undefined,
    releaseTime: status === 'no_show' ? dayjs(date + ' ' + startTime).add(30, 'minute').format('YYYY-MM-DD HH:mm:ss') : undefined
  };
}

export const bookings: Booking[] = Array.from({ length: 10 }, (_, i) => generateMockBooking(i));

export function getBookingsByStatus(status?: BookingStatus): Booking[] {
  const result = status ? bookings.filter((b) => b.status === status) : [...bookings];
  return result.sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());
}

export function getBookingById(id: string): Booking | undefined {
  return bookings.find((b) => b.id === id);
}
