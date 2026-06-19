import dayjs from 'dayjs';

export function formatDate(date: dayjs.Dayjs | string | Date, format = 'YYYY-MM-DD'): string {
  return dayjs(date).format(format);
}

export function formatDateTime(
  date: dayjs.Dayjs | string | Date,
  format = 'YYYY-MM-DD HH:mm:ss'
): string {
  return dayjs(date).format(format);
}

export function getWeekdayLabel(weekday: number): string {
  const labels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return labels[weekday];
}

export function getMonthDays(year: number, month: number): number {
  return dayjs(`${year}-${String(month + 1).padStart(2, '0')}`).daysInMonth();
}

export function getMonthFirstDay(year: number, month: number): number {
  return dayjs(`${year}-${String(month + 1).padStart(2, '0')}-01`).day();
}

export function generateCalendarDays(year: number, month: number): Array<dayjs.Dayjs> {
  const days: Array<dayjs.Dayjs> = [];
  const daysInMonth = getMonthDays(year, month);
  const firstDay = getMonthFirstDay(year, month);

  for (let i = 0; i < firstDay; i++) {
    days.push(dayjs(`${year}-${String(month + 1).padStart(2, '0')}-01`).subtract(firstDay - i, 'day'));
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(dayjs(`${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`));
  }

  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push(
      dayjs(`${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`).add(
        i,
        'day'
      )
    );
  }

  return days;
}

export function isToday(date: dayjs.Dayjs): boolean {
  return date.isSame(dayjs(), 'day');
}

export function isSameMonth(date: dayjs.Dayjs, year: number, month: number): boolean {
  return date.year() === year && date.month() === month;
}
