import { TimeRate } from '@/types';

export const rates: TimeRate[] = [
  {
    id: 'rate-peak-weekday',
    type: 'peak',
    label: '工作日高峰',
    startTime: '18:00',
    endTime: '22:00',
    pricePerHour: 180,
    weekdays: [1, 2, 3, 4, 5]
  },
  {
    id: 'rate-normal-weekday',
    type: 'normal',
    label: '工作日平峰',
    startTime: '10:00',
    endTime: '18:00',
    pricePerHour: 120,
    weekdays: [1, 2, 3, 4, 5]
  },
  {
    id: 'rate-offpeak-weekday',
    type: 'offpeak',
    label: '工作日早班',
    startTime: '08:00',
    endTime: '10:00',
    pricePerHour: 80,
    weekdays: [1, 2, 3, 4, 5]
  },
  {
    id: 'rate-peak-weekend',
    type: 'peak',
    label: '周末高峰',
    startTime: '14:00',
    endTime: '22:00',
    pricePerHour: 220,
    weekdays: [6, 0]
  },
  {
    id: 'rate-normal-weekend',
    type: 'normal',
    label: '周末平峰',
    startTime: '10:00',
    endTime: '14:00',
    pricePerHour: 160,
    weekdays: [6, 0]
  },
  {
    id: 'rate-offpeak-weekend',
    type: 'offpeak',
    label: '周末早班',
    startTime: '08:00',
    endTime: '10:00',
    pricePerHour: 120,
    weekdays: [6, 0]
  }
];
