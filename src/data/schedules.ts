import dayjs from 'dayjs';
import { TimeSlot, SlotStatus, RateType } from '@/types';
import { generateTimeSlots } from '@/utils/pricing';
import { studios } from './studios';

function generateSlotsForStudio(studioId: string, dateStr: string): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const timeSlots = generateTimeSlots(dateStr);

  const busyRanges = [
    { start: 10, end: 12 },
    { start: 14, end: 16 }
  ];

  timeSlots.forEach(({ time, rate }, index) => {
    const hour = parseInt(time.split(':')[0]);
    const isBusy = busyRanges.some((r) => hour >= r.start && hour < r.end);

    let status: SlotStatus = 'available';
    if (isBusy) status = 'booked';

    slots.push({
      id: `${studioId}-${dateStr}-${index}`,
      studioId,
      date: dateStr,
      startTime: time,
      endTime: `${String(hour + 1).padStart(2, '0')}:00`,
      status,
      rateType: rate?.type || ('normal' as RateType),
      price: rate?.pricePerHour || 100
    });
  });

  return slots;
}

export function getSchedulesByDate(date: string, studioId?: string): TimeSlot[] {
  const result: TimeSlot[] = [];
  const targetStudios = studioId ? studios.filter((s) => s.id === studioId) : studios;

  targetStudios.forEach((studio) => {
    result.push(...generateSlotsForStudio(studio.id, date));
  });

  console.log('[Schedule] 获取排期数据', { date, studioId, count: result.length });
  return result;
}

export function generateWeekDates(): string[] {
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    dates.push(dayjs().add(i, 'day').format('YYYY-MM-DD'));
  }
  return dates;
}
