import dayjs from 'dayjs';
import { TimeRate, BookingSegment, RateType } from '@/types';
import { rates } from '@/data/rates';

export interface PricingResult {
  segments: BookingSegment[];
  totalHours: number;
  totalAmount: number;
}

export function getRateLabel(type: RateType): string {
  const labels: Record<RateType, string> = {
    peak: '高峰时段',
    normal: '平峰时段',
    offpeak: '特惠时段'
  };
  return labels[type];
}

export function getApplicableRate(date: string, time: string): TimeRate | null {
  const weekday = dayjs(date).day();
  const currentMinutes = timeToMinutes(time);

  for (const rate of rates) {
    if (!rate.weekdays.includes(weekday)) continue;

    const startMinutes = timeToMinutes(rate.startTime);
    const endMinutes = timeToMinutes(rate.endTime);

    if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
      return rate;
    }
  }
  return null;
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function calculatePricing(
  date: string,
  startTime: string,
  endTime: string
): PricingResult {
  const segments: BookingSegment[] = [];
  let totalHours = 0;
  let totalAmount = 0;

  let currentMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  if (currentMinutes >= endMinutes) {
    console.error('[Pricing] 时间范围无效', { startTime, endTime });
    return { segments: [], totalHours: 0, totalAmount: 0 };
  }

  while (currentMinutes < endMinutes) {
    const currentTime = minutesToTime(currentMinutes);
    const rate = getApplicableRate(date, currentTime);

    if (!rate) {
      console.warn('[Pricing] 未找到匹配费率', { date, currentTime });
      break;
    }

    const rateEndMinutes = timeToMinutes(rate.endTime);
    const segmentEndMinutes = Math.min(rateEndMinutes, endMinutes);
    const segmentDuration = (segmentEndMinutes - currentMinutes) / 60;

    const segment: BookingSegment = {
      startTime: minutesToTime(currentMinutes),
      endTime: minutesToTime(segmentEndMinutes),
      rateType: rate.type,
      rateLabel: rate.label,
      hours: parseFloat(segmentDuration.toFixed(2)),
      pricePerHour: rate.pricePerHour,
      subtotal: parseFloat((segmentDuration * rate.pricePerHour).toFixed(2))
    };

    segments.push(segment);
    totalHours += segment.hours;
    totalAmount += segment.subtotal;

    currentMinutes = segmentEndMinutes;
  }

  console.log('[Pricing] 计算完成', {
    date,
    startTime,
    endTime,
    segments,
    totalHours,
    totalAmount
  });

  return {
    segments,
    totalHours: parseFloat(totalHours.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2))
  };
}

export function generateTimeSlots(
  date: string,
  startHour = 8,
  endHour = 22,
  intervalMinutes = 60
): Array<{ time: string; rate: TimeRate | null }> {
  const slots: Array<{ time: string; rate: TimeRate | null }> = [];

  for (let minutes = startHour * 60; minutes < endHour * 60; minutes += intervalMinutes) {
    const time = minutesToTime(minutes);
    const rate = getApplicableRate(date, time);
    slots.push({ time, rate });
  }

  return slots;
}
