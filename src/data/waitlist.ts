import dayjs from 'dayjs';
import { WaitlistItem, WaitlistStatus } from '@/types';
import { studios } from './studios';

const statusList: WaitlistStatus[] = ['waiting', 'notified', 'confirmed', 'cancelled'];

function generateMockWaitlist(index: number): WaitlistItem {
  const studio = studios[index % Math.min(studios.length, 3)];
  const date = dayjs()
    .add(Math.floor(Math.random() * 3), 'day')
    .format('YYYY-MM-DD');
  const startHour = 10 + Math.floor(Math.random() * 6);
  const duration = 1 + Math.floor(Math.random() * 3);
  const status = statusList[index % statusList.length];

  return {
    id: `waitlist-${String(index + 1).padStart(5, '0')}`,
    studioId: studio.id,
    studioName: studio.name,
    userId: 'user-001',
    userName: '张先生',
    date,
    startTime: `${String(startHour).padStart(2, '0')}:00`,
    endTime: `${String(startHour + duration).padStart(2, '0')}:00`,
    position: index + 1,
    status,
    createdAt: dayjs().subtract(index * 2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    notifiedAt: status === 'notified' ? dayjs().subtract(index, 'minute').format('YYYY-MM-DD HH:mm:ss') : undefined,
    expiresAt: status === 'notified' ? dayjs().add(10 - index, 'minute').format('YYYY-MM-DD HH:mm:ss') : undefined
  };
}

export const waitlistData: WaitlistItem[] = Array.from({ length: 6 }, (_, i) => generateMockWaitlist(i));

export function getWaitlistByStatus(status?: WaitlistStatus): WaitlistItem[] {
  const result = status ? waitlistData.filter((w) => w.status === status) : [...waitlistData];
  return result.sort((a, b) => a.position - b.position);
}
